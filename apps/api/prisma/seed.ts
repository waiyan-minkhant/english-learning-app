import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { seedClasses } from "./seeds/classes";
import { seedLessons } from "./seeds/lessons";
import { seedLiveSessions } from "./seeds/live-sessions";
import { seedUsers, type SeededUsers } from "./seeds/users";

const prisma = new PrismaClient();

function parseSeedOnly(): Set<string> | null {
  const raw = process.env.SEED_ONLY;
  if (!raw) return null;

  return new Set(
    raw
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
  );
}

function shouldRun(only: Set<string> | null, name: string) {
  return !only || only.has(name);
}

async function main() {
  const only = parseSeedOnly();
  const runAll = !only;

  const runUsers =
    runAll ||
    shouldRun(only, "users") ||
    shouldRun(only, "classes") ||
    shouldRun(only, "live-sessions");

  const runLessons =
    runAll ||
    shouldRun(only, "lessons") ||
    shouldRun(only, "classes") ||
    shouldRun(only, "live-sessions");

  const runClasses =
    runAll || shouldRun(only, "classes") || shouldRun(only, "live-sessions");

  const runLiveSessions = runAll || shouldRun(only, "live-sessions");

  let users: SeededUsers | undefined;

  if (runUsers) {
    users = await seedUsers(prisma);
  }

  if (runLessons) {
    await seedLessons(prisma);
  }

  if (runClasses) {
    if (!users) {
      throw new Error("Users must be seeded before classes");
    }
    await seedClasses(prisma, users);
  }

  if (runLiveSessions) {
    await seedLiveSessions(prisma);
  }

  console.log("Seed completed");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
