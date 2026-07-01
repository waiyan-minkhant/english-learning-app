import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const DEMO_PASSWORD = "password123";

export const DEMO_EMAILS = {
  teacher: "teacher@demo.local",
  student1: "student1@demo.local",
  student2: "student2@demo.local"
} as const;

export type SeededUsers = {
  teacher: { id: string; email: string };
  students: { id: string; email: string }[];
};

export async function seedUsers(prisma: PrismaClient): Promise<SeededUsers> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const teacher = await prisma.user.upsert({
    where: { email: DEMO_EMAILS.teacher },
    update: { role: "teacher" },
    create: {
      email: DEMO_EMAILS.teacher,
      passwordHash,
      role: "teacher"
    },
    select: { id: true, email: true }
  });

  const student1 = await prisma.user.upsert({
    where: { email: DEMO_EMAILS.student1 },
    update: { role: "student" },
    create: {
      email: DEMO_EMAILS.student1,
      passwordHash,
      role: "student"
    },
    select: { id: true, email: true }
  });

  const student2 = await prisma.user.upsert({
    where: { email: DEMO_EMAILS.student2 },
    update: { role: "student" },
    create: {
      email: DEMO_EMAILS.student2,
      passwordHash,
      role: "student"
    },
    select: { id: true, email: true }
  });

  console.log("✓ Seeded users (teacher + 2 students)");
  return { teacher, students: [student1, student2] };
}
