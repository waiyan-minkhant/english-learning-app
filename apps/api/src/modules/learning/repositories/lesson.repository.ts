import { prisma } from "../../../lib/prisma.js";

const itemInclude = {
  conversationExercise: true,
  fillBlankExercise: true,
  listenBuildSentenceExercise: true,
  listenFillBlankExercise: true,
  matchingExercise: true,
  listenSpeakExercise: true,
  knowledgeContent: true
} as const;

export class LessonRepository {
  findById(id: string) {
    return prisma.lesson.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { order: "asc" },
          include: itemInclude
        }
      }
    });
  }

  findItemById(itemId: string) {
    return prisma.lessonItem.findUnique({
      where: { id: itemId },
      include: {
        lesson: true,
        ...itemInclude
      }
    });
  }

  findOrderedItems(lessonId: string) {
    return prisma.lessonItem.findMany({
      where: { lessonId },
      orderBy: { order: "asc" },
      select: { id: true, order: true, type: true }
    });
  }
}
