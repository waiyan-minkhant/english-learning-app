import type { ScoredAttemptResponse } from "@english-learning/contracts/learning";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { AttemptRepository } from "../repositories/attempt.repository.js";
import { LessonRepository } from "../repositories/lesson.repository.js";
import { broadcastAttemptSubmitted } from "./attempt-broadcast.js";
import { getLearningSessionService } from "./learning-session.service.js";
import {
  ProgressService,
  toProgressContract
} from "./progress.service.js";

function arraysEqual(a: string[], b: string[]) {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export class ScoredAttemptService {
  constructor(
    private readonly lessonRepository = new LessonRepository(),
    private readonly attemptRepository = new AttemptRepository(),
    private readonly progressService = new ProgressService()
  ) {}

  private async progressPayload(
    userId: string,
    lessonId: string,
    itemId: string,
    shouldAdvance: boolean,
    sessionMode: string
  ) {
    // Solo practice records attempts but must not mutate shared class progress.
    const advance = shouldAdvance && sessionMode !== "solo";
    const progress = advance
      ? await this.progressService.completeItem(userId, lessonId, itemId)
      : await this.progressService.ensure(userId, lessonId);

    const contract = toProgressContract(progress);
    return {
      lessonId: contract.lessonId,
      currentItemId: contract.currentItemId,
      status: contract.status
    };
  }

  async submitFillBlank(
    userId: string,
    lessonItemId: string,
    learningSessionId: string,
    selectedAnswer: string
  ): Promise<ScoredAttemptResponse> {
    const session = await getLearningSessionService().assertCanSubmitAttempt(
      userId,
      learningSessionId,
      lessonItemId
    );
    const item = await this.lessonRepository.findItemById(lessonItemId);
    if (!item?.fillBlankExercise) {
      throw new NotFoundError("Fill-in-the-blank exercise not found");
    }

    const correct =
      selectedAnswer === item.fillBlankExercise.correctAnswer;
    const attempt = await this.attemptRepository.createFillBlank({
      userId,
      lessonItemId,
      learningSessionId: session.id,
      selectedAnswer,
      correct
    });

    broadcastAttemptSubmitted(session, {
      lessonItemId,
      userId,
      attemptId: attempt.id,
      type: "fill_in_blank",
      selectedAnswer,
      correct,
      createdAt: attempt.createdAt.toISOString()
    });

    return {
      attemptId: attempt.id,
      correct,
      progress: await this.progressPayload(
        userId,
        item.lessonId,
        lessonItemId,
        correct,
        session.mode
      )
    };
  }

  async submitListenFillBlank(
    userId: string,
    lessonItemId: string,
    learningSessionId: string,
    selectedAnswer: string
  ): Promise<ScoredAttemptResponse> {
    const session = await getLearningSessionService().assertCanSubmitAttempt(
      userId,
      learningSessionId,
      lessonItemId
    );
    const item = await this.lessonRepository.findItemById(lessonItemId);
    if (!item?.listenFillBlankExercise) {
      throw new NotFoundError("Listen-and-fill exercise not found");
    }

    const correct =
      selectedAnswer === item.listenFillBlankExercise.correctAnswer;
    const attempt = await this.attemptRepository.createListenFillBlank({
      userId,
      lessonItemId,
      learningSessionId: session.id,
      selectedAnswer,
      correct
    });

    broadcastAttemptSubmitted(session, {
      lessonItemId,
      userId,
      attemptId: attempt.id,
      type: "listen_and_fill_in_blank",
      selectedAnswer,
      correct,
      createdAt: attempt.createdAt.toISOString()
    });

    return {
      attemptId: attempt.id,
      correct,
      progress: await this.progressPayload(
        userId,
        item.lessonId,
        lessonItemId,
        correct,
        session.mode
      )
    };
  }

  async submitListenBuild(
    userId: string,
    lessonItemId: string,
    learningSessionId: string,
    submittedOrder: string[]
  ): Promise<ScoredAttemptResponse> {
    const session = await getLearningSessionService().assertCanSubmitAttempt(
      userId,
      learningSessionId,
      lessonItemId
    );
    const item = await this.lessonRepository.findItemById(lessonItemId);
    if (!item?.listenBuildSentenceExercise) {
      throw new NotFoundError("Listen-and-build exercise not found");
    }

    const correctOrder = item.listenBuildSentenceExercise
      .correctOrder as string[];
    const correct = arraysEqual(submittedOrder, correctOrder);
    const attempt = await this.attemptRepository.createListenBuild({
      userId,
      lessonItemId,
      learningSessionId: session.id,
      submittedOrder,
      correct
    });

    broadcastAttemptSubmitted(session, {
      lessonItemId,
      userId,
      attemptId: attempt.id,
      type: "listen_and_build_sentence",
      submittedOrder,
      correct,
      createdAt: attempt.createdAt.toISOString()
    });

    return {
      attemptId: attempt.id,
      correct,
      progress: await this.progressPayload(
        userId,
        item.lessonId,
        lessonItemId,
        correct,
        session.mode
      )
    };
  }

  async submitMatching(
    userId: string,
    lessonItemId: string,
    learningSessionId: string,
    selectedPairs: Record<string, string>
  ): Promise<ScoredAttemptResponse> {
    const session = await getLearningSessionService().assertCanSubmitAttempt(
      userId,
      learningSessionId,
      lessonItemId
    );
    const item = await this.lessonRepository.findItemById(lessonItemId);
    if (!item?.matchingExercise) {
      throw new NotFoundError("Matching exercise not found");
    }

    const pairs = item.matchingExercise.pairs as {
      question: string;
      answer: string;
    }[];
    const correct = pairs.every(
      (pair) => selectedPairs[pair.question] === pair.answer
    );
    const attempt = await this.attemptRepository.createMatching({
      userId,
      lessonItemId,
      learningSessionId: session.id,
      selectedPairs,
      correct
    });

    broadcastAttemptSubmitted(session, {
      lessonItemId,
      userId,
      attemptId: attempt.id,
      type: "matching",
      selectedPairs,
      correct,
      createdAt: attempt.createdAt.toISOString()
    });

    return {
      attemptId: attempt.id,
      correct,
      progress: await this.progressPayload(
        userId,
        item.lessonId,
        lessonItemId,
        correct,
        session.mode
      )
    };
  }

  async submitListenSpeak(
    userId: string,
    lessonItemId: string,
    learningSessionId: string,
    transcript = ""
  ): Promise<ScoredAttemptResponse> {
    const session = await getLearningSessionService().assertCanSubmitAttempt(
      userId,
      learningSessionId,
      lessonItemId
    );
    const item = await this.lessonRepository.findItemById(lessonItemId);
    if (!item?.listenSpeakExercise) {
      throw new NotFoundError("Listen-and-speak exercise not found");
    }

    const attempt = await this.attemptRepository.createListenSpeak({
      userId,
      lessonItemId,
      learningSessionId: session.id,
      transcript: transcript || "(spoken)",
      pronunciationScore: 5,
      feedback: "Nice work — keep practicing your pronunciation."
    });

    broadcastAttemptSubmitted(session, {
      lessonItemId,
      userId,
      attemptId: attempt.id,
      type: "listen_and_speak",
      transcript: attempt.transcript,
      correct: true,
      createdAt: attempt.createdAt.toISOString()
    });

    return {
      attemptId: attempt.id,
      correct: true,
      progress: await this.progressPayload(
        userId,
        item.lessonId,
        lessonItemId,
        true,
        session.mode
      )
    };
  }

  async completeContentItem(
    userId: string,
    lessonId: string,
    itemId: string,
    learningSessionId: string
  ) {
    await getLearningSessionService().assertCanSubmitAttempt(
      userId,
      learningSessionId,
      itemId,
      lessonId
    );
    const item = await this.lessonRepository.findItemById(itemId);
    if (!item || item.lessonId !== lessonId) {
      throw new NotFoundError("Lesson item not found");
    }
    if (
      item.type !== "knowledge" &&
      item.type !== "demo_complete"
    ) {
      throw new ValidationError("Item is not a content step");
    }

    const progress = await this.progressService.completeItem(
      userId,
      lessonId,
      itemId
    );
    return toProgressContract(progress);
  }
}

let scoredAttemptService: ScoredAttemptService | null = null;

export function getScoredAttemptService() {
  if (!scoredAttemptService) scoredAttemptService = new ScoredAttemptService();
  return scoredAttemptService;
}
