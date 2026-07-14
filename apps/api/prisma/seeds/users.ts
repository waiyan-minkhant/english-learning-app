import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

export const DEMO_PASSWORD = "password123";

export const DEMO_EMAILS = {
  teacher: "teacher@demo.local",
  student1: "student1@demo.local",
  student2: "student2@demo.local"
} as const;

export const DEMO_NAMES = {
  teacher: "Clair",
  student1: "Aung Aung",
  student2: "Kyaw Kyaw"
} as const;

export type SeededUsers = {
  teacher: { id: string; email: string; name: string };
  students: { id: string; email: string; name: string }[];
};

export async function seedUsers(prisma: PrismaClient): Promise<SeededUsers> {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const teacher = await prisma.user.upsert({
    where: { email: DEMO_EMAILS.teacher },
    update: { role: "teacher", name: DEMO_NAMES.teacher },
    create: {
      email: DEMO_EMAILS.teacher,
      name: DEMO_NAMES.teacher,
      passwordHash,
      role: "teacher"
    },
    select: { id: true, email: true, name: true }
  });

  const student1 = await prisma.user.upsert({
    where: { email: DEMO_EMAILS.student1 },
    update: { role: "student", name: DEMO_NAMES.student1 },
    create: {
      email: DEMO_EMAILS.student1,
      name: DEMO_NAMES.student1,
      passwordHash,
      role: "student"
    },
    select: { id: true, email: true, name: true }
  });

  const student2 = await prisma.user.upsert({
    where: { email: DEMO_EMAILS.student2 },
    update: { role: "student", name: DEMO_NAMES.student2 },
    create: {
      email: DEMO_EMAILS.student2,
      name: DEMO_NAMES.student2,
      passwordHash,
      role: "student"
    },
    select: { id: true, email: true, name: true }
  });

  console.log("✓ Seeded users (teacher + 2 students)");
  return { teacher, students: [student1, student2] };
}
