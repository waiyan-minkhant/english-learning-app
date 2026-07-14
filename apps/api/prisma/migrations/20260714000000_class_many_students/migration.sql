-- CreateTable
CREATE TABLE "ClassStudent" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClassStudent_pkey" PRIMARY KEY ("id")
);

-- Backfill enrollments from legacy Class.studentId
INSERT INTO "ClassStudent" ("id", "classId", "studentId", "createdAt")
SELECT gen_random_uuid()::text, "id", "studentId", NOW()
FROM "Class";

-- CreateIndex
CREATE UNIQUE INDEX "ClassStudent_classId_studentId_key" ON "ClassStudent"("classId", "studentId");

-- AddForeignKey
ALTER TABLE "ClassStudent" ADD CONSTRAINT "ClassStudent_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClassStudent" ADD CONSTRAINT "ClassStudent_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- DropForeignKey
ALTER TABLE "Class" DROP CONSTRAINT "Class_studentId_fkey";

-- AlterTable
ALTER TABLE "Class" DROP COLUMN "studentId";
