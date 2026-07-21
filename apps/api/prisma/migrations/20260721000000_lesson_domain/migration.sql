-- CreateEnum
CREATE TYPE "LessonItemType" AS ENUM (
  'conversation',
  'fill_in_blank',
  'matching',
  'listen_and_build_sentence',
  'listen_and_speak',
  'listen_and_fill_in_blank',
  'knowledge',
  'demo_complete'
);

CREATE TYPE "LessonDifficulty" AS ENUM ('easy', 'medium', 'hard');

CREATE TYPE "LessonProgressStatus" AS ENUM ('not_started', 'in_progress', 'completed');

-- CreateTable
CREATE TABLE "Course" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lesson" (
    "id" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "estimatedMinutes" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lesson_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "LessonItem" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "type" "LessonItemType" NOT NULL,
    "difficulty" "LessonDifficulty" NOT NULL DEFAULT 'easy',
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LessonItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ConversationExercise" (
    "lessonItemId" TEXT NOT NULL,
    "instruction" TEXT,
    "question" TEXT NOT NULL,
    "assessmentCriteria" JSONB NOT NULL,
    "expectedTopics" JSONB,
    "sampleAnswers" JSONB,
    "dialogue" JSONB NOT NULL,

    CONSTRAINT "ConversationExercise_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "FillBlankExercise" (
    "lessonItemId" TEXT NOT NULL,
    "instruction" TEXT,
    "sentenceBefore" TEXT NOT NULL,
    "sentenceAfter" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,

    CONSTRAINT "FillBlankExercise_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "ListenBuildSentenceExercise" (
    "lessonItemId" TEXT NOT NULL,
    "instruction" TEXT,
    "audioUrl" TEXT,
    "words" JSONB NOT NULL,
    "correctOrder" JSONB NOT NULL,

    CONSTRAINT "ListenBuildSentenceExercise_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "ListenFillBlankExercise" (
    "lessonItemId" TEXT NOT NULL,
    "instruction" TEXT,
    "audioUrl" TEXT,
    "sentenceBefore" TEXT NOT NULL,
    "sentenceAfter" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correctAnswer" TEXT NOT NULL,

    CONSTRAINT "ListenFillBlankExercise_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "MatchingExercise" (
    "lessonItemId" TEXT NOT NULL,
    "instruction" TEXT,
    "pairs" JSONB NOT NULL,

    CONSTRAINT "MatchingExercise_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "ListenSpeakExercise" (
    "lessonItemId" TEXT NOT NULL,
    "instruction" TEXT,
    "expectedSentence" TEXT NOT NULL,
    "audioUrl" TEXT,

    CONSTRAINT "ListenSpeakExercise_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "KnowledgeContent" (
    "lessonItemId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "audioUrl" TEXT,
    "images" JSONB,

    CONSTRAINT "KnowledgeContent_pkey" PRIMARY KEY ("lessonItemId")
);

CREATE TABLE "UserLessonProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "currentItemId" TEXT,
    "status" "LessonProgressStatus" NOT NULL DEFAULT 'not_started',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastAccessedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserLessonProgress_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FillBlankAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonItemId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FillBlankAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListenBuildSentenceAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonItemId" TEXT NOT NULL,
    "submittedOrder" JSONB NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListenBuildSentenceAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListenFillBlankAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonItemId" TEXT NOT NULL,
    "selectedAnswer" TEXT NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListenFillBlankAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MatchingAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonItemId" TEXT NOT NULL,
    "selectedPairs" JSONB NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MatchingAttempt_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ListenSpeakAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonItemId" TEXT NOT NULL,
    "transcript" TEXT NOT NULL,
    "pronunciationScore" INTEGER,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListenSpeakAttempt_pkey" PRIMARY KEY ("id")
);

-- Migrate ConversationAttempt: drop old rows, reshape columns
DELETE FROM "ConversationAttempt";

DROP INDEX IF EXISTS "ConversationAttempt_userId_exerciseId_idx";

ALTER TABLE "ConversationAttempt" DROP COLUMN IF EXISTS "exerciseId";
ALTER TABLE "ConversationAttempt" ADD COLUMN "lessonItemId" TEXT NOT NULL;

-- Indexes & FKs
CREATE UNIQUE INDEX "Lesson_courseId_number_key" ON "Lesson"("courseId", "number");
CREATE INDEX "Lesson_courseId_idx" ON "Lesson"("courseId");
CREATE UNIQUE INDEX "LessonItem_lessonId_order_key" ON "LessonItem"("lessonId", "order");
CREATE INDEX "LessonItem_lessonId_idx" ON "LessonItem"("lessonId");
CREATE UNIQUE INDEX "UserLessonProgress_userId_lessonId_key" ON "UserLessonProgress"("userId", "lessonId");
CREATE INDEX "UserLessonProgress_userId_idx" ON "UserLessonProgress"("userId");
CREATE INDEX "UserLessonProgress_lessonId_idx" ON "UserLessonProgress"("lessonId");
CREATE INDEX "ConversationAttempt_userId_lessonItemId_idx" ON "ConversationAttempt"("userId", "lessonItemId");
CREATE INDEX "FillBlankAttempt_userId_lessonItemId_idx" ON "FillBlankAttempt"("userId", "lessonItemId");
CREATE INDEX "ListenBuildSentenceAttempt_userId_lessonItemId_idx" ON "ListenBuildSentenceAttempt"("userId", "lessonItemId");
CREATE INDEX "ListenFillBlankAttempt_userId_lessonItemId_idx" ON "ListenFillBlankAttempt"("userId", "lessonItemId");
CREATE INDEX "MatchingAttempt_userId_lessonItemId_idx" ON "MatchingAttempt"("userId", "lessonItemId");
CREATE INDEX "ListenSpeakAttempt_userId_lessonItemId_idx" ON "ListenSpeakAttempt"("userId", "lessonItemId");

ALTER TABLE "Lesson" ADD CONSTRAINT "Lesson_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LessonItem" ADD CONSTRAINT "LessonItem_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ConversationExercise" ADD CONSTRAINT "ConversationExercise_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FillBlankExercise" ADD CONSTRAINT "FillBlankExercise_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenBuildSentenceExercise" ADD CONSTRAINT "ListenBuildSentenceExercise_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenFillBlankExercise" ADD CONSTRAINT "ListenFillBlankExercise_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchingExercise" ADD CONSTRAINT "MatchingExercise_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenSpeakExercise" ADD CONSTRAINT "ListenSpeakExercise_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "KnowledgeContent" ADD CONSTRAINT "KnowledgeContent_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "UserLessonProgress" ADD CONSTRAINT "UserLessonProgress_currentItemId_fkey" FOREIGN KEY ("currentItemId") REFERENCES "LessonItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ConversationAttempt" ADD CONSTRAINT "ConversationAttempt_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FillBlankAttempt" ADD CONSTRAINT "FillBlankAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FillBlankAttempt" ADD CONSTRAINT "FillBlankAttempt_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenBuildSentenceAttempt" ADD CONSTRAINT "ListenBuildSentenceAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenBuildSentenceAttempt" ADD CONSTRAINT "ListenBuildSentenceAttempt_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenFillBlankAttempt" ADD CONSTRAINT "ListenFillBlankAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenFillBlankAttempt" ADD CONSTRAINT "ListenFillBlankAttempt_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchingAttempt" ADD CONSTRAINT "MatchingAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MatchingAttempt" ADD CONSTRAINT "MatchingAttempt_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenSpeakAttempt" ADD CONSTRAINT "ListenSpeakAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ListenSpeakAttempt" ADD CONSTRAINT "ListenSpeakAttempt_lessonItemId_fkey" FOREIGN KEY ("lessonItemId") REFERENCES "LessonItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
