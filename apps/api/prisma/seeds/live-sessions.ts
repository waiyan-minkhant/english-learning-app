import type { PrismaClient } from "@prisma/client";
import { DEMO_CLASS_IDS } from "./classes";

export const DEMO_ROOM_IDS = {
  session1: "lesson-demo-1",
  session2: "lesson-demo-2"
} as const;

export async function seedLiveSessions(prisma: PrismaClient) {
  await prisma.liveSession.upsert({
    where: { roomId: DEMO_ROOM_IDS.session1 },
    update: {
      classId: DEMO_CLASS_IDS.class1,
      status: "scheduled"
    },
    create: {
      roomId: DEMO_ROOM_IDS.session1,
      classId: DEMO_CLASS_IDS.class1,
      status: "scheduled"
    }
  });

  await prisma.liveSession.upsert({
    where: { roomId: DEMO_ROOM_IDS.session2 },
    update: {
      classId: DEMO_CLASS_IDS.class2,
      status: "scheduled"
    },
    create: {
      roomId: DEMO_ROOM_IDS.session2,
      classId: DEMO_CLASS_IDS.class2,
      status: "scheduled"
    }
  });

  console.log("✓ Seeded live sessions (2)");
}
