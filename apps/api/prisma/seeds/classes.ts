import type { PrismaClient } from "@prisma/client";
import type { SeededUsers } from "./users";

export const DEMO_LESSON_IDS = {
  lesson1: "11111111-1111-4111-8111-111111111101",
  lesson2: "11111111-1111-4111-8111-111111111102"
} as const;

export const DEMO_CLASS_IDS = {
  class1: "22222222-2222-4222-8222-222222222201",
  /** Legacy id removed after multi-student migration; seed deletes if present. */
  class2: "22222222-2222-4222-8222-222222222202"
} as const;

export async function seedClasses(prisma: PrismaClient, users: SeededUsers) {
  const [student1, student2] = users.students;

  await prisma.class.upsert({
    where: { id: DEMO_CLASS_IDS.class1 },
    update: {
      teacherId: users.teacher.id,
      lessonId: DEMO_LESSON_IDS.lesson1
    },
    create: {
      id: DEMO_CLASS_IDS.class1,
      teacherId: users.teacher.id,
      lessonId: DEMO_LESSON_IDS.lesson1
    }
  });

  await prisma.classStudent.upsert({
    where: {
      classId_studentId: {
        classId: DEMO_CLASS_IDS.class1,
        studentId: student1.id
      }
    },
    update: {},
    create: {
      classId: DEMO_CLASS_IDS.class1,
      studentId: student1.id
    }
  });

  await prisma.classStudent.upsert({
    where: {
      classId_studentId: {
        classId: DEMO_CLASS_IDS.class1,
        studentId: student2.id
      }
    },
    update: {},
    create: {
      classId: DEMO_CLASS_IDS.class1,
      studentId: student2.id
    }
  });

  await prisma.class.deleteMany({
    where: { id: DEMO_CLASS_IDS.class2 }
  });

  console.log("✓ Seeded classes (1 class, 2 students)");
}
