import type { AuthUser } from "@english-learning/contracts";
import type { TeacherClassRoster } from "@english-learning/contracts/class";
import { prisma } from "../../../lib/prisma.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";

export class ClassService {
  async getMine(user: AuthUser): Promise<TeacherClassRoster> {
    if (user.role !== "teacher") {
      throw new ForbiddenError("Only teachers can view class roster");
    }

    const classRecord = await prisma.class.findFirst({
      where: { teacherId: user.id },
      include: {
        students: {
          include: {
            student: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { student: { name: "asc" } }
        }
      }
    });

    if (!classRecord) {
      throw new NotFoundError("No class assigned to this teacher");
    }

    return {
      id: classRecord.id,
      teacherId: classRecord.teacherId,
      lessonId: classRecord.lessonId,
      students: classRecord.students.map((row) => ({
        id: row.student.id,
        name: row.student.name,
        email: row.student.email
      }))
    };
  }

  async isStudentInTeacherClass(teacherId: string, studentId: string) {
    const membership = await prisma.classStudent.findFirst({
      where: {
        studentId,
        class: { teacherId }
      },
      select: { id: true }
    });
    return Boolean(membership);
  }
}

let classService: ClassService | null = null;

export function getClassService() {
  if (!classService) classService = new ClassService();
  return classService;
}
