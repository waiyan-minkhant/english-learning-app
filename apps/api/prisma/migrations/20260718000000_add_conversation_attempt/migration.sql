-- CreateTable
CREATE TABLE "ConversationAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "exerciseId" TEXT NOT NULL,
    "sessionId" TEXT,
    "transcript" TEXT NOT NULL,
    "answeredQuestion" INTEGER NOT NULL,
    "grammar" INTEGER NOT NULL,
    "vocabulary" INTEGER NOT NULL,
    "sentenceCompleteness" INTEGER NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConversationAttempt_userId_exerciseId_idx" ON "ConversationAttempt"("userId", "exerciseId");

-- AddForeignKey
ALTER TABLE "ConversationAttempt" ADD CONSTRAINT "ConversationAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
