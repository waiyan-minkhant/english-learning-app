-- CreateEnum
CREATE TYPE "LearningSessionMode" AS ENUM ('solo', 'classroom');

-- CreateEnum
CREATE TYPE "LearningSessionStatus" AS ENUM ('live', 'ended');

-- CreateTable
CREATE TABLE "LearningSession" (
    "id" TEXT NOT NULL,
    "mode" "LearningSessionMode" NOT NULL,
    "status" "LearningSessionStatus" NOT NULL DEFAULT 'live',
    "lessonId" TEXT NOT NULL,
    "currentLessonItemId" TEXT,
    "answerRevealed" BOOLEAN NOT NULL DEFAULT false,
    "startedById" TEXT NOT NULL,
    "liveSessionId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LearningSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LearningSession_liveSessionId_key" ON "LearningSession"("liveSessionId");
CREATE INDEX "LearningSession_startedById_idx" ON "LearningSession"("startedById");
CREATE INDEX "LearningSession_lessonId_idx" ON "LearningSession"("lessonId");
CREATE INDEX "LearningSession_status_idx" ON "LearningSession"("status");
CREATE INDEX "LearningSession_liveSessionId_idx" ON "LearningSession"("liveSessionId");

ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_currentLessonItemId_fkey" FOREIGN KEY ("currentLessonItemId") REFERENCES "LessonItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_startedById_fkey" FOREIGN KEY ("startedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LearningSession" ADD CONSTRAINT "LearningSession_liveSessionId_fkey" FOREIGN KEY ("liveSessionId") REFERENCES "LiveSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Synthetic ended SOLO sessions for existing conversation attempts
INSERT INTO "LearningSession" (
  "id", "mode", "status", "lessonId", "currentLessonItemId", "answerRevealed",
  "startedById", "liveSessionId", "startedAt", "endedAt", "createdAt", "updatedAt"
)
SELECT
  (md5(ca."userId" || ':' || ca."lessonId" || ':legacy-solo'))::uuid::text,
  'solo'::"LearningSessionMode",
  'ended'::"LearningSessionStatus",
  ca."lessonId",
  NULL,
  false,
  ca."userId",
  NULL,
  MIN(ca."createdAt"),
  MAX(ca."createdAt"),
  MIN(ca."createdAt"),
  MAX(ca."createdAt")
FROM "ConversationAttempt" ca
GROUP BY ca."userId", ca."lessonId";

ALTER TABLE "ConversationAttempt" ADD COLUMN "learningSessionId" TEXT;

UPDATE "ConversationAttempt" ca
SET "learningSessionId" = (md5(ca."userId" || ':' || ca."lessonId" || ':legacy-solo'))::uuid::text
WHERE ca."learningSessionId" IS NULL;

DELETE FROM "ConversationAttempt" WHERE "learningSessionId" IS NULL;

ALTER TABLE "ConversationAttempt" ALTER COLUMN "learningSessionId" SET NOT NULL;
ALTER TABLE "ConversationAttempt" DROP COLUMN IF EXISTS "sessionId";
CREATE INDEX "ConversationAttempt_learningSessionId_idx" ON "ConversationAttempt"("learningSessionId");
ALTER TABLE "ConversationAttempt" ADD CONSTRAINT "ConversationAttempt_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Clear unscored attempt rows (no prior session linkage) then add required FK
TRUNCATE TABLE "FillBlankAttempt";
TRUNCATE TABLE "ListenBuildSentenceAttempt";
TRUNCATE TABLE "ListenFillBlankAttempt";
TRUNCATE TABLE "MatchingAttempt";
TRUNCATE TABLE "ListenSpeakAttempt";

ALTER TABLE "FillBlankAttempt" ADD COLUMN "learningSessionId" TEXT NOT NULL;
CREATE INDEX "FillBlankAttempt_learningSessionId_idx" ON "FillBlankAttempt"("learningSessionId");
ALTER TABLE "FillBlankAttempt" ADD CONSTRAINT "FillBlankAttempt_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListenBuildSentenceAttempt" ADD COLUMN "learningSessionId" TEXT NOT NULL;
CREATE INDEX "ListenBuildSentenceAttempt_learningSessionId_idx" ON "ListenBuildSentenceAttempt"("learningSessionId");
ALTER TABLE "ListenBuildSentenceAttempt" ADD CONSTRAINT "ListenBuildSentenceAttempt_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListenFillBlankAttempt" ADD COLUMN "learningSessionId" TEXT NOT NULL;
CREATE INDEX "ListenFillBlankAttempt_learningSessionId_idx" ON "ListenFillBlankAttempt"("learningSessionId");
ALTER TABLE "ListenFillBlankAttempt" ADD CONSTRAINT "ListenFillBlankAttempt_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MatchingAttempt" ADD COLUMN "learningSessionId" TEXT NOT NULL;
CREATE INDEX "MatchingAttempt_learningSessionId_idx" ON "MatchingAttempt"("learningSessionId");
ALTER TABLE "MatchingAttempt" ADD CONSTRAINT "MatchingAttempt_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ListenSpeakAttempt" ADD COLUMN "learningSessionId" TEXT NOT NULL;
CREATE INDEX "ListenSpeakAttempt_learningSessionId_idx" ON "ListenSpeakAttempt"("learningSessionId");
ALTER TABLE "ListenSpeakAttempt" ADD CONSTRAINT "ListenSpeakAttempt_learningSessionId_fkey" FOREIGN KEY ("learningSessionId") REFERENCES "LearningSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
