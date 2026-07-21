import type { UserLessonProgress as ContractProgress } from "@english-learning/contracts/lesson";
import type { UserLessonProgress } from "@prisma/client";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import { LessonRepository } from "../repositories/lesson.repository.js";
import { ProgressRepository } from "../repositories/progress.repository.js";

export function toProgressContract(
  row: UserLessonProgress
): ContractProgress {
  return {
    lessonId: row.lessonId,
    currentItemId: row.currentItemId,
    status: row.status,
    startedAt: row.startedAt?.toISOString() ?? null,
    completedAt: row.completedAt?.toISOString() ?? null,
    lastAccessedAt: row.lastAccessedAt.toISOString()
  };
}

export class ProgressService {
  constructor(
    private readonly progressRepository = new ProgressRepository(),
    private readonly lessonRepository = new LessonRepository()
  ) {}

  async ensure(userId: string, lessonId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundError("Lesson not found");

    let progress = await this.progressRepository.ensure(userId, lessonId);

    if (
      progress.status === "not_started" &&
      !progress.currentItemId &&
      lesson.items[0]
    ) {
      progress = await this.progressRepository.update(userId, lessonId, {
        currentItemId: lesson.items[0].id,
        status: "in_progress",
        startedAt: new Date()
      });
    }

    return progress;
  }

  /** Advance to the next item after completing `itemId`, or mark lesson complete. */
  async completeItem(userId: string, lessonId: string, itemId: string) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundError("Lesson not found");

    const existing = await this.progressRepository.ensure(userId, lessonId);
    const alreadyCompleted = existing.status === "completed";

    const items = lesson.items;
    const index = items.findIndex((item) => item.id === itemId);
    if (index === -1) throw new NotFoundError("Lesson item not found");

    const next = items[index + 1];
    if (!next) {
      return this.markCompleted(userId, lessonId, itemId);
    }

    // Replay of a completed lesson must not downgrade status (unlock chain).
    if (alreadyCompleted) {
      return this.progressRepository.update(userId, lessonId, {
        currentItemId: next.id,
        status: "completed",
        completedAt: existing.completedAt ?? new Date()
      });
    }

    return this.progressRepository.update(userId, lessonId, {
      currentItemId: next.id,
      status: "in_progress"
    });
  }

  async markCompleted(
    userId: string,
    lessonId: string,
    currentItemId?: string | null
  ) {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundError("Lesson not found");

    await this.progressRepository.ensure(userId, lessonId);

    const lastItemId =
      currentItemId ?? lesson.items[lesson.items.length - 1]?.id ?? null;

    return this.progressRepository.update(userId, lessonId, {
      currentItemId: lastItemId,
      status: "completed",
      completedAt: new Date()
    });
  }
}
