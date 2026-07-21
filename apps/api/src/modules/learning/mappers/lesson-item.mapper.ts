import type {
  ConversationExercise,
  FillBlankExercise,
  KnowledgeContent,
  LessonItem,
  LessonItemType,
  ListenBuildSentenceExercise,
  ListenFillBlankExercise,
  ListenSpeakExercise,
  MatchingExercise
} from "@prisma/client";
import type { LessonItem as ContractLessonItem } from "@english-learning/contracts/lesson";

export type LessonItemWithSpecialized = LessonItem & {
  conversationExercise: ConversationExercise | null;
  fillBlankExercise: FillBlankExercise | null;
  listenBuildSentenceExercise: ListenBuildSentenceExercise | null;
  listenFillBlankExercise: ListenFillBlankExercise | null;
  matchingExercise: MatchingExercise | null;
  listenSpeakExercise: ListenSpeakExercise | null;
  knowledgeContent: KnowledgeContent | null;
};

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

function mapDifficulty(
  difficulty: LessonItem["difficulty"]
): ContractLessonItem["difficulty"] {
  return difficulty;
}

export function mapLessonItemToContract(
  item: LessonItemWithSpecialized
): ContractLessonItem {
  const base = {
    id: item.id,
    order: item.order,
    title: item.title,
    difficulty: mapDifficulty(item.difficulty)
  };

  switch (item.type as LessonItemType) {
    case "conversation": {
      const row = item.conversationExercise;
      if (!row) throw new Error(`Missing conversation data for ${item.id}`);
      return {
        ...base,
        type: "exercise",
        exerciseType: "conversation",
        data: {
          instruction: row.instruction ?? undefined,
          question: row.question,
          dialogue: row.dialogue as { text: string; audioUrl?: string }[],
          sampleAnswers: row.sampleAnswers
            ? asStringArray(row.sampleAnswers)
            : undefined,
          assessment: {
            criteria: asStringArray(row.assessmentCriteria) as (
              | "answeredQuestion"
              | "grammar"
              | "vocabulary"
              | "sentenceCompleteness"
            )[],
            expectedTopics: row.expectedTopics
              ? asStringArray(row.expectedTopics)
              : undefined
          }
        }
      };
    }
    case "fill_in_blank": {
      const row = item.fillBlankExercise;
      if (!row) throw new Error(`Missing fill-blank data for ${item.id}`);
      return {
        ...base,
        type: "exercise",
        exerciseType: "fill_in_blank",
        data: {
          instruction: row.instruction ?? undefined,
          sentenceBefore: row.sentenceBefore,
          sentenceAfter: row.sentenceAfter,
          options: asStringArray(row.options),
          correctAnswer: row.correctAnswer
        }
      };
    }
    case "matching": {
      const row = item.matchingExercise;
      if (!row) throw new Error(`Missing matching data for ${item.id}`);
      return {
        ...base,
        type: "exercise",
        exerciseType: "matching",
        data: {
          instruction: row.instruction ?? undefined,
          pairs: row.pairs as { question: string; answer: string }[]
        }
      };
    }
    case "listen_and_build_sentence": {
      const row = item.listenBuildSentenceExercise;
      if (!row) throw new Error(`Missing listen-build data for ${item.id}`);
      return {
        ...base,
        type: "exercise",
        exerciseType: "listen_and_build_sentence",
        data: {
          instruction: row.instruction ?? undefined,
          audioUrl: row.audioUrl ?? undefined,
          words: asStringArray(row.words),
          correctOrder: asStringArray(row.correctOrder)
        }
      };
    }
    case "listen_and_fill_in_blank": {
      const row = item.listenFillBlankExercise;
      if (!row) throw new Error(`Missing listen-fill data for ${item.id}`);
      return {
        ...base,
        type: "exercise",
        exerciseType: "listen_and_fill_in_blank",
        data: {
          instruction: row.instruction ?? undefined,
          audioUrl: row.audioUrl ?? undefined,
          sentenceBefore: row.sentenceBefore,
          sentenceAfter: row.sentenceAfter,
          options: asStringArray(row.options),
          correctAnswer: row.correctAnswer
        }
      };
    }
    case "listen_and_speak": {
      const row = item.listenSpeakExercise;
      if (!row) throw new Error(`Missing listen-speak data for ${item.id}`);
      return {
        ...base,
        type: "exercise",
        exerciseType: "listen_and_speak",
        data: {
          instruction: row.instruction ?? undefined,
          expectedSentence: row.expectedSentence,
          audioUrl: row.audioUrl ?? undefined
        }
      };
    }
    case "knowledge": {
      const row = item.knowledgeContent;
      if (!row) throw new Error(`Missing knowledge data for ${item.id}`);
      return {
        ...base,
        type: "content",
        contentType: "knowledge",
        data: {
          body: row.body,
          media: {
            audio: row.audioUrl ?? undefined,
            images: row.images
              ? (row.images as { src: string; alt: string }[])
              : undefined
          }
        }
      };
    }
    case "demo_complete":
      return {
        ...base,
        type: "content",
        contentType: "demo_complete",
        data: {}
      };
    default:
      throw new Error(`Unsupported lesson item type: ${item.type}`);
  }
}
