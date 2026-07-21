export {
  exerciseTypeSchema,
  contentTypeSchema,
  difficultySchema,
  dialogueLineSchema,
  matchingPairSchema,
  contentImageSchema,
  conversationAssessmentCriteriaSchema,
  conversationAssessmentSchema,
  conversationDataSchema,
  fillInBlankDataSchema,
  listenAndBuildSentenceDataSchema,
  listenAndFillInBlankDataSchema,
  matchingDataSchema,
  listenAndSpeakDataSchema,
  knowledgeMediaSchema,
  knowledgeDataSchema,
  demoCompleteDataSchema,
  exerciseItemSchema,
  contentItemSchema,
  lessonItemSchema,
  lessonSchema,
  courseSchema,
  lessonSummarySchema,
  courseWithLessonSummariesSchema,
  lessonProgressStatusSchema,
  userLessonProgressSchema,
  getLessonResponseSchema,
  sortLessonItems,
  type ExerciseType,
  type ContentType,
  type Difficulty,
  type DialogueLine,
  type MatchingPair,
  type ContentImage,
  type ConversationData,
  type FillInBlankData,
  type ListenAndBuildSentenceData,
  type ListenAndFillInBlankData,
  type MatchingData,
  type ListenAndSpeakData,
  type KnowledgeData,
  type DemoCompleteData,
  type ExerciseItem,
  type ContentItem,
  type LessonItem,
  type Lesson,
  type Course,
  type LessonSummary,
  type CourseWithLessonSummaries,
  type LessonProgressStatus,
  type UserLessonProgress,
  type GetLessonResponse
} from "@english-learning/contracts/lesson";

/** @deprecated Use LessonItem */
export type Step = import("@english-learning/contracts/lesson").LessonItem;
/** @deprecated Use ExerciseItem */
export type ExerciseStep =
  import("@english-learning/contracts/lesson").ExerciseItem;
/** @deprecated Use ContentItem */
export type ContentStep =
  import("@english-learning/contracts/lesson").ContentItem;
