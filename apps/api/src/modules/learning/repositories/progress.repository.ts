import type { LessonProgressStatus } from "@prisma/client";
import { prisma } from "../../../lib/prisma.js";

export class ProgressRepository {
  findByUserAndLesson(userId: string, lessonId: string) {
    return prisma.userLessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } }
    });
  }

  ensure(userId: string, lessonId: string) {
    return prisma.userLessonProgress.upsert({
      where: { userId_lessonId: { userId, lessonId } },
      create: {
        userId,
        lessonId,
        status: "not_started",
        lastAccessedAt: new Date()
      },
      update: {
        lastAccessedAt: new Date()
      }
    });
  }

  update(
    userId: string,
    lessonId: string,
    data: {
      currentItemId?: string | null;
      status?: LessonProgressStatus;
      startedAt?: Date | null;
      completedAt?: Date | null;
    }
  ) {
    return prisma.userLessonProgress.update({
      where: { userId_lessonId: { userId, lessonId } },
      data: {
        ...data,
        lastAccessedAt: new Date()
      }
    });
  }
}
