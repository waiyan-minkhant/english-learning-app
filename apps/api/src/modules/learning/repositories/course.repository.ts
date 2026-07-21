import { prisma } from "../../../lib/prisma.js";

export class CourseRepository {
  findById(id: string) {
    return prisma.course.findUnique({
      where: { id },
      include: {
        lessons: {
          orderBy: { number: "asc" },
          select: {
            id: true,
            number: true,
            title: true,
            description: true,
            estimatedMinutes: true
          }
        }
      }
    });
  }
}
