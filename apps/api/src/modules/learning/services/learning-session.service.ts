import type { AuthUser } from "@english-learning/contracts";
import type {
  LearningSession as LearningSessionDto,
  ListLearningSessionsQuery,
  SessionAttempt
} from "@english-learning/contracts/learning-session";
import type { LearningSession, Prisma } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";
import { ConflictError } from "../../../shared/errors/conflict-error.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { LearningSessionRepository } from "../repositories/learning-session.repository.js";
import { LessonRepository } from "../repositories/lesson.repository.js";
import { ProgressService } from "./progress.service.js";

type SessionWithLive = LearningSession & {
  liveSession?: { roomId: string } | null;
};

export function toLearningSessionDto(
  row: SessionWithLive
): LearningSessionDto {
  return {
    id: row.id,
    mode: row.mode,
    status: row.status,
    lessonId: row.lessonId,
    currentLessonItemId: row.currentLessonItemId,
    answerRevealed: row.answerRevealed,
    startedById: row.startedById,
    liveSessionId: row.liveSessionId,
    liveSessionRoomId: row.liveSession?.roomId ?? null,
    startedAt: row.startedAt.toISOString(),
    endedAt: row.endedAt?.toISOString() ?? null
  };
}

export class LearningSessionService {
  constructor(
    private readonly sessionRepository = new LearningSessionRepository(),
    private readonly lessonRepository = new LessonRepository(),
    private readonly progressService = new ProgressService()
  ) {}

  async startSolo(userId: string, lessonId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundError("Lesson not found");

    // Touch progress for lastAccessedAt; always start solo at the first item.
    await this.progressService.ensure(userId, lessonId);
    const currentLessonItemId = lesson.items[0]?.id ?? null;

    const session = await this.sessionRepository.create({
      mode: "solo",
      lessonId,
      currentLessonItemId,
      startedById: userId
    });

    return toLearningSessionDto(session);
  }

  async startClassroom(
    teacher: AuthUser,
    input: { lessonId: string; liveSessionId?: string; roomId?: string }
  ) {
    if (teacher.role !== "teacher") {
      throw new ForbiddenError("Only teachers can start classroom sessions");
    }

    const lesson = await this.lessonRepository.findById(input.lessonId);
    if (!lesson) throw new NotFoundError("Lesson not found");

    const liveWhere: Prisma.LiveSessionWhereInput = { status: "live" };
    if (input.liveSessionId) liveWhere.id = input.liveSessionId;
    else if (input.roomId) liveWhere.roomId = input.roomId;
    else throw new ValidationError("liveSessionId or roomId is required");

    const liveSession = await prisma.liveSession.findFirst({
      where: liveWhere,
      include: { class: true }
    });

    if (!liveSession) {
      throw new NotFoundError("Live session not found or not live");
    }
    if (liveSession.class.teacherId !== teacher.id) {
      throw new ForbiddenError("Cannot start learning session for this class");
    }

    await this.sessionRepository.endLiveForLiveSession(liveSession.id);

    const session = await this.sessionRepository.create({
      mode: "classroom",
      lessonId: input.lessonId,
      currentLessonItemId: lesson.items[0]?.id ?? null,
      startedById: teacher.id,
      liveSessionId: liveSession.id
    });

    const dto = toLearningSessionDto(session);
    const { broadcastLessonState } = await import(
      "../../realtime/services/lesson-sync.service.js"
    );
    broadcastLessonState(dto);
    return dto;
  }

  async getById(user: AuthUser, id: string) {
    const session = await this.sessionRepository.findById(id);
    if (!session) throw new NotFoundError("Learning session not found");
    await this.assertCanAccess(user, session);
    return toLearningSessionDto(session);
  }

  async end(user: AuthUser, id: string) {
    const session = await this.sessionRepository.findById(id);
    if (!session) throw new NotFoundError("Learning session not found");
    if (session.status === "ended") {
      return toLearningSessionDto(session);
    }

    if (session.mode === "solo") {
      if (session.startedById !== user.id) {
        throw new ForbiddenError("Cannot end this session");
      }
    } else if (user.role !== "teacher" || session.startedById !== user.id) {
      throw new ForbiddenError("Only the session teacher can end it");
    }

    if (session.mode === "classroom") {
      await this.completeLessonForClassIfFinished(session);
    }

    const ended = await this.sessionRepository.end(id);
    const dto = toLearningSessionDto(ended);
    if (session.mode === "classroom") {
      const { broadcastLessonState } = await import(
        "../../realtime/services/lesson-sync.service.js"
      );
      broadcastLessonState(dto);
    }
    return dto;
  }

  /** When leaving from the last item, mark the lesson complete for all class members. */
  private async completeLessonForClassIfFinished(
    session: NonNullable<
      Awaited<ReturnType<LearningSessionRepository["findById"]>>
    >
  ) {
    const lesson = await this.lessonRepository.findById(session.lessonId);
    if (!lesson || lesson.items.length === 0) return;

    const lastItem = lesson.items[lesson.items.length - 1];
    if (!lastItem || session.currentLessonItemId !== lastItem.id) return;

    const live = session.liveSession;
    if (!live) return;

    const participantIds = [
      live.class.teacherId,
      ...live.class.students.map((s) => s.studentId)
    ];

    await Promise.all(
      participantIds.map((userId) =>
        this.progressService.markCompleted(userId, session.lessonId, lastItem.id)
      )
    );
  }

  async endByLiveSessionId(liveSessionId: string) {
    await this.sessionRepository.endLiveForLiveSession(liveSessionId);
  }

  async endByRoomId(roomId: string) {
    const live = await prisma.liveSession.findFirst({
      where: { roomId },
      select: { id: true }
    });
    if (!live) return;
    await this.sessionRepository.endLiveForLiveSession(live.id);
  }

  async list(user: AuthUser, query: ListLearningSessionsQuery) {
    if (query.roomId) {
      const live = await this.sessionRepository.findLiveByRoomId(query.roomId);
      if (!live) return [];
      const full = await this.sessionRepository.findById(live.id);
      if (!full) return [];
      await this.assertCanAccess(user, full);
      return [toLearningSessionDto(live)];
    }

    if (
      user.role === "teacher" &&
      query.userId &&
      query.userId !== user.id
    ) {
      const { getClassService } = await import(
        "../../class/services/class.service.js"
      );
      const allowed = await getClassService().isStudentInTeacherClass(
        user.id,
        query.userId
      );
      if (!allowed) {
        throw new ForbiddenError("Student is not in your class");
      }
    }

    const userId =
      user.role === "teacher" && query.userId ? query.userId : user.id;

    const sessions = await this.sessionRepository.list({
      mode: query.mode,
      status: query.status,
      lessonId: query.lessonId,
      userId
    });

    return sessions.map(toLearningSessionDto);
  }

  async listAttempts(
    user: AuthUser,
    id: string,
    filterUserId?: string
  ): Promise<SessionAttempt[]> {
    const session = await this.sessionRepository.findById(id);
    if (!session) throw new NotFoundError("Learning session not found");
    await this.assertCanAccess(user, session);

    const rows = await this.sessionRepository.findAttemptsForSession(
      id,
      filterUserId
    );
    const attempts: SessionAttempt[] = [];

    for (const row of rows.conversation) {
      attempts.push({
        id: row.id,
        type: "conversation",
        userId: row.userId,
        lessonItemId: row.lessonItemId,
        learningSessionId: row.learningSessionId,
        createdAt: row.createdAt.toISOString(),
        transcript: row.transcript,
        feedback: row.feedback,
        scores: {
          answeredQuestion: row.answeredQuestion,
          grammar: row.grammar,
          vocabulary: row.vocabulary,
          sentenceCompleteness: row.sentenceCompleteness
        }
      });
    }
    for (const row of rows.fillBlank) {
      attempts.push({
        id: row.id,
        type: "fill_in_blank",
        userId: row.userId,
        lessonItemId: row.lessonItemId,
        learningSessionId: row.learningSessionId,
        createdAt: row.createdAt.toISOString(),
        correct: row.correct,
        selectedAnswer: row.selectedAnswer
      });
    }
    for (const row of rows.listenFill) {
      attempts.push({
        id: row.id,
        type: "listen_and_fill_in_blank",
        userId: row.userId,
        lessonItemId: row.lessonItemId,
        learningSessionId: row.learningSessionId,
        createdAt: row.createdAt.toISOString(),
        correct: row.correct,
        selectedAnswer: row.selectedAnswer
      });
    }
    for (const row of rows.listenBuild) {
      attempts.push({
        id: row.id,
        type: "listen_and_build_sentence",
        userId: row.userId,
        lessonItemId: row.lessonItemId,
        learningSessionId: row.learningSessionId,
        createdAt: row.createdAt.toISOString(),
        correct: row.correct,
        submittedOrder: row.submittedOrder as string[]
      });
    }
    for (const row of rows.matching) {
      attempts.push({
        id: row.id,
        type: "matching",
        userId: row.userId,
        lessonItemId: row.lessonItemId,
        learningSessionId: row.learningSessionId,
        createdAt: row.createdAt.toISOString(),
        correct: row.correct,
        selectedPairs: row.selectedPairs as Record<string, string>
      });
    }
    for (const row of rows.listenSpeak) {
      attempts.push({
        id: row.id,
        type: "listen_and_speak",
        userId: row.userId,
        lessonItemId: row.lessonItemId,
        learningSessionId: row.learningSessionId,
        createdAt: row.createdAt.toISOString(),
        transcript: row.transcript,
        feedback: row.feedback,
        pronunciationScore: row.pronunciationScore
      });
    }

    attempts.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    return attempts;
  }

  /**
   * Validate that the user may submit an attempt for this live session + item.
   */
  async assertCanSubmitAttempt(
    userId: string,
    learningSessionId: string,
    lessonItemId: string,
    lessonId?: string
  ) {
    const session = await this.sessionRepository.findById(learningSessionId);
    if (!session) throw new NotFoundError("Learning session not found");
    if (session.status !== "live") {
      throw new ConflictError("Learning session has ended");
    }
    if (lessonId && session.lessonId !== lessonId) {
      throw new ValidationError("Lesson does not match learning session");
    }

    const item = await this.lessonRepository.findItemById(lessonItemId);
    if (!item || item.lessonId !== session.lessonId) {
      throw new NotFoundError("Lesson item not found in this session");
    }

    if (session.mode === "solo") {
      if (session.startedById !== userId) {
        throw new ForbiddenError("Cannot submit to this session");
      }
    } else {
      const live = session.liveSession;
      if (!live) throw new ForbiddenError("Classroom session is not linked");
      const isTeacher = live.class.teacherId === userId;
      const isStudent = live.class.students.some((s) => s.studentId === userId);
      if (!isTeacher && !isStudent) {
        throw new ForbiddenError("Not a participant of this class");
      }
    }

    return session;
  }

  async setCurrentItem(
    teacherId: string,
    learningSessionId: string,
    itemId: string
  ) {
    const session = await this.sessionRepository.findById(learningSessionId);
    if (!session) throw new NotFoundError("Learning session not found");
    if (session.mode !== "classroom") {
      throw new ForbiddenError("Only classroom sessions support sync navigation");
    }
    if (session.status !== "live") {
      throw new ConflictError("Learning session has ended");
    }
    if (session.startedById !== teacherId) {
      throw new ForbiddenError("Only the session teacher can change the item");
    }

    const item = await this.lessonRepository.findItemById(itemId);
    if (!item || item.lessonId !== session.lessonId) {
      throw new NotFoundError("Lesson item not found in this session");
    }

    return toLearningSessionDto(
      await this.sessionRepository.updateSyncState(learningSessionId, {
        currentLessonItemId: itemId,
        answerRevealed: false
      })
    );
  }

  async revealAnswers(teacherId: string, learningSessionId: string) {
    const session = await this.sessionRepository.findById(learningSessionId);
    if (!session) throw new NotFoundError("Learning session not found");
    if (session.mode !== "classroom") {
      throw new ForbiddenError("Only classroom sessions support answer reveal");
    }
    if (session.status !== "live") {
      throw new ConflictError("Learning session has ended");
    }
    if (session.startedById !== teacherId) {
      throw new ForbiddenError("Only the session teacher can reveal answers");
    }

    return toLearningSessionDto(
      await this.sessionRepository.updateSyncState(learningSessionId, {
        answerRevealed: true
      })
    );
  }

  private async assertCanAccess(
    user: AuthUser,
    session: NonNullable<
      Awaited<ReturnType<LearningSessionRepository["findById"]>>
    >
  ) {
    if (session.mode === "solo") {
      if (session.startedById === user.id) return;
      if (user.role === "teacher") {
        const { getClassService } = await import(
          "../../class/services/class.service.js"
        );
        const allowed = await getClassService().isStudentInTeacherClass(
          user.id,
          session.startedById
        );
        if (allowed) return;
      }
      throw new ForbiddenError("Cannot access this learning session");
    }

    const live = session.liveSession;
    if (!live) throw new ForbiddenError("Cannot access this learning session");
    if (live.class.teacherId === user.id) return;
    if (live.class.students.some((s) => s.studentId === user.id)) return;
    throw new ForbiddenError("Cannot access this learning session");
  }
}

let learningSessionService: LearningSessionService | null = null;

export function getLearningSessionService() {
  if (!learningSessionService) {
    learningSessionService = new LearningSessionService();
  }
  return learningSessionService;
}
