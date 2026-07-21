import type {
  LearningSessionMode,
  LearningSessionStatus
} from "@english-learning/contracts/learning-session";
import { prisma } from "../../../lib/prisma.js";

export class LearningSessionRepository {
  create(data: {
    mode: LearningSessionMode;
    lessonId: string;
    currentLessonItemId: string | null;
    startedById: string;
    liveSessionId?: string | null;
  }) {
    return prisma.learningSession.create({
      data: {
        mode: data.mode,
        status: "live",
        lessonId: data.lessonId,
        currentLessonItemId: data.currentLessonItemId,
        answerRevealed: false,
        startedById: data.startedById,
        liveSessionId: data.liveSessionId ?? null,
        startedAt: new Date()
      },
      include: { liveSession: { select: { roomId: true } } }
    });
  }

  findById(id: string) {
    return prisma.learningSession.findUnique({
      where: { id },
      include: {
        liveSession: {
          select: {
            id: true,
            roomId: true,
            status: true,
            classId: true,
            class: {
              select: {
                teacherId: true,
                students: { select: { studentId: true } }
              }
            }
          }
        }
      }
    });
  }

  findLiveByLiveSessionId(liveSessionId: string) {
    return prisma.learningSession.findFirst({
      where: { liveSessionId, status: "live" },
      include: { liveSession: { select: { roomId: true } } }
    });
  }

  findLiveByRoomId(roomId: string) {
    return prisma.learningSession.findFirst({
      where: {
        status: "live",
        liveSession: { roomId }
      },
      include: { liveSession: { select: { roomId: true } } }
    });
  }

  end(id: string) {
    return prisma.learningSession.update({
      where: { id },
      data: { status: "ended", endedAt: new Date() },
      include: { liveSession: { select: { roomId: true } } }
    });
  }

  endLiveForLiveSession(liveSessionId: string) {
    return prisma.learningSession.updateMany({
      where: { liveSessionId, status: "live" },
      data: { status: "ended", endedAt: new Date() }
    });
  }

  updateSyncState(
    id: string,
    data: {
      currentLessonItemId?: string | null;
      answerRevealed?: boolean;
    }
  ) {
    return prisma.learningSession.update({
      where: { id },
      data,
      include: { liveSession: { select: { roomId: true } } }
    });
  }

  list(filters: {
    mode?: LearningSessionMode;
    status?: LearningSessionStatus;
    lessonId?: string;
    userId?: string;
  }) {
    return prisma.learningSession.findMany({
      where: {
        mode: filters.mode,
        status: filters.status,
        lessonId: filters.lessonId,
        OR: filters.userId
          ? [
              { startedById: filters.userId },
              {
                mode: "classroom",
                liveSession: {
                  class: {
                    OR: [
                      { teacherId: filters.userId },
                      { students: { some: { studentId: filters.userId } } }
                    ]
                  }
                }
              }
            ]
          : undefined
      },
      include: { liveSession: { select: { roomId: true } } },
      orderBy: { startedAt: "desc" }
    });
  }

  async findAttemptsForSession(
    learningSessionId: string,
    userId?: string
  ) {
    const userFilter = userId ? { userId } : {};
    const [
      conversation,
      fillBlank,
      listenFill,
      listenBuild,
      matching,
      listenSpeak
    ] = await Promise.all([
      prisma.conversationAttempt.findMany({
        where: { learningSessionId, ...userFilter },
        orderBy: { createdAt: "asc" }
      }),
      prisma.fillBlankAttempt.findMany({
        where: { learningSessionId, ...userFilter },
        orderBy: { createdAt: "asc" }
      }),
      prisma.listenFillBlankAttempt.findMany({
        where: { learningSessionId, ...userFilter },
        orderBy: { createdAt: "asc" }
      }),
      prisma.listenBuildSentenceAttempt.findMany({
        where: { learningSessionId, ...userFilter },
        orderBy: { createdAt: "asc" }
      }),
      prisma.matchingAttempt.findMany({
        where: { learningSessionId, ...userFilter },
        orderBy: { createdAt: "asc" }
      }),
      prisma.listenSpeakAttempt.findMany({
        where: { learningSessionId, ...userFilter },
        orderBy: { createdAt: "asc" }
      })
    ]);

    return {
      conversation,
      fillBlank,
      listenFill,
      listenBuild,
      matching,
      listenSpeak
    };
  }
}
