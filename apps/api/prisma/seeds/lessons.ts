import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type {
  LessonDifficulty,
  LessonItemType,
  Prisma,
  PrismaClient
} from "@prisma/client";
import { courseSchema, type Course } from "@english-learning/contracts/lesson";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadCourseFixture(): Course {
  const raw = readFileSync(
    join(__dirname, "fixtures/course.json"),
    "utf8"
  );
  return courseSchema.parse(JSON.parse(raw));
}

function toDbItemType(
  item: Course["lessons"][number]["items"][number]
): LessonItemType {
  if (item.type === "exercise") return item.exerciseType;
  return item.contentType;
}

export async function seedLessons(prisma: PrismaClient) {
  const course = loadCourseFixture();

  await prisma.course.upsert({
    where: { id: course.id },
    update: {
      title: course.title,
      description: course.description,
      level: course.level
    },
    create: {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level
    }
  });

  for (const lesson of course.lessons) {
    await prisma.lesson.upsert({
      where: { id: lesson.id },
      update: {
        courseId: course.id,
        number: lesson.number,
        title: lesson.title,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes
      },
      create: {
        id: lesson.id,
        courseId: course.id,
        number: lesson.number,
        title: lesson.title,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes
      }
    });

    for (const item of lesson.items) {
      const type = toDbItemType(item);
      const difficulty = item.difficulty as LessonDifficulty;

      await prisma.lessonItem.upsert({
        where: { id: item.id },
        update: {
          lessonId: lesson.id,
          order: item.order,
          type,
          difficulty,
          title: item.title
        },
        create: {
          id: item.id,
          lessonId: lesson.id,
          order: item.order,
          type,
          difficulty,
          title: item.title
        }
      });

      if (item.type === "exercise") {
        switch (item.exerciseType) {
          case "conversation":
            await prisma.conversationExercise.upsert({
              where: { lessonItemId: item.id },
              update: {
                instruction: item.data.instruction ?? null,
                question: item.data.question,
                assessmentCriteria: item.data.assessment.criteria,
                expectedTopics: item.data.assessment.expectedTopics ?? null,
                sampleAnswers: item.data.sampleAnswers ?? null,
                dialogue: item.data.dialogue
              },
              create: {
                lessonItemId: item.id,
                instruction: item.data.instruction ?? null,
                question: item.data.question,
                assessmentCriteria: item.data.assessment.criteria,
                expectedTopics: item.data.assessment.expectedTopics ?? null,
                sampleAnswers: item.data.sampleAnswers ?? null,
                dialogue: item.data.dialogue
              }
            });
            break;
          case "fill_in_blank":
            await prisma.fillBlankExercise.upsert({
              where: { lessonItemId: item.id },
              update: {
                instruction: item.data.instruction ?? null,
                sentenceBefore: item.data.sentenceBefore,
                sentenceAfter: item.data.sentenceAfter,
                options: item.data.options,
                correctAnswer: item.data.correctAnswer
              },
              create: {
                lessonItemId: item.id,
                instruction: item.data.instruction ?? null,
                sentenceBefore: item.data.sentenceBefore,
                sentenceAfter: item.data.sentenceAfter,
                options: item.data.options,
                correctAnswer: item.data.correctAnswer
              }
            });
            break;
          case "matching":
            await prisma.matchingExercise.upsert({
              where: { lessonItemId: item.id },
              update: {
                instruction: item.data.instruction ?? null,
                pairs: item.data.pairs
              },
              create: {
                lessonItemId: item.id,
                instruction: item.data.instruction ?? null,
                pairs: item.data.pairs
              }
            });
            break;
          case "listen_and_build_sentence":
            await prisma.listenBuildSentenceExercise.upsert({
              where: { lessonItemId: item.id },
              update: {
                instruction: item.data.instruction ?? null,
                audioUrl: item.data.audioUrl ?? null,
                words: item.data.words,
                correctOrder: item.data.correctOrder
              },
              create: {
                lessonItemId: item.id,
                instruction: item.data.instruction ?? null,
                audioUrl: item.data.audioUrl ?? null,
                words: item.data.words,
                correctOrder: item.data.correctOrder
              }
            });
            break;
          case "listen_and_fill_in_blank":
            await prisma.listenFillBlankExercise.upsert({
              where: { lessonItemId: item.id },
              update: {
                instruction: item.data.instruction ?? null,
                audioUrl: item.data.audioUrl ?? null,
                sentenceBefore: item.data.sentenceBefore,
                sentenceAfter: item.data.sentenceAfter,
                options: item.data.options,
                correctAnswer: item.data.correctAnswer
              },
              create: {
                lessonItemId: item.id,
                instruction: item.data.instruction ?? null,
                audioUrl: item.data.audioUrl ?? null,
                sentenceBefore: item.data.sentenceBefore,
                sentenceAfter: item.data.sentenceAfter,
                options: item.data.options,
                correctAnswer: item.data.correctAnswer
              }
            });
            break;
          case "listen_and_speak":
            await prisma.listenSpeakExercise.upsert({
              where: { lessonItemId: item.id },
              update: {
                instruction: item.data.instruction ?? null,
                expectedSentence: item.data.expectedSentence,
                audioUrl: item.data.audioUrl ?? null
              },
              create: {
                lessonItemId: item.id,
                instruction: item.data.instruction ?? null,
                expectedSentence: item.data.expectedSentence,
                audioUrl: item.data.audioUrl ?? null
              }
            });
            break;
          default:
            break;
        }
      } else if (item.contentType === "knowledge") {
        await prisma.knowledgeContent.upsert({
          where: { lessonItemId: item.id },
          update: {
            body: item.data.body,
            audioUrl: item.data.media?.audio ?? null,
            images: (item.data.media?.images ??
              null) as Prisma.InputJsonValue | null
          },
          create: {
            lessonItemId: item.id,
            body: item.data.body,
            audioUrl: item.data.media?.audio ?? null,
            images: (item.data.media?.images ??
              null) as Prisma.InputJsonValue | null
          }
        });
      }
    }
  }

  console.log(
    `✓ Seeded course ${course.id} (${course.lessons.length} lessons)`
  );
}
