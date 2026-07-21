import type {
  CourseWithLessonSummaries,
  GetLessonResponse,
  Lesson,
  LessonSummary
} from "@english-learning/contracts/lesson";
import {
  courseWithLessonSummariesSchema,
  getLessonResponseSchema,
  lessonSchema
} from "@english-learning/contracts/lesson";
import { fetchApi } from "@/lib/api-client";

const DEFAULT_COURSE_ID =
  process.env.NEXT_PUBLIC_COURSE_ID || "elementary-english";

export const lessonService = {
  getDefaultCourseId() {
    return DEFAULT_COURSE_ID;
  },

  async getCourse(
    courseId: string = DEFAULT_COURSE_ID
  ): Promise<CourseWithLessonSummaries> {
    const data = await fetchApi(`/courses/${courseId}`);
    return courseWithLessonSummariesSchema.parse(data);
  },

  async getLesson(lessonId: string): Promise<GetLessonResponse> {
    const data = await fetchApi(`/lessons/${lessonId}`);
    return getLessonResponseSchema.parse(data);
  },

  async listLessons(
    courseId: string = DEFAULT_COURSE_ID
  ): Promise<LessonSummary[]> {
    const course = await this.getCourse(courseId);
    return course.lessons;
  },

  /** Full lesson object only (without progress). */
  async getLessonContent(lessonId: string): Promise<Lesson> {
    const { lesson } = await this.getLesson(lessonId);
    return lessonSchema.parse(lesson);
  },

  async completeContentItem(
    lessonId: string,
    itemId: string,
    learningSessionId: string
  ) {
    return fetchApi(`/lessons/${lessonId}/items/${itemId}/complete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learningSessionId })
    });
  },

  async submitFillBlankAttempt(
    lessonItemId: string,
    learningSessionId: string,
    selectedAnswer: string
  ) {
    return fetchApi("/learning/fill-in-blank/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonItemId, learningSessionId, selectedAnswer })
    });
  },

  async submitListenFillBlankAttempt(
    lessonItemId: string,
    learningSessionId: string,
    selectedAnswer: string
  ) {
    return fetchApi("/learning/listen-and-fill-in-blank/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonItemId, learningSessionId, selectedAnswer })
    });
  },

  async submitListenBuildAttempt(
    lessonItemId: string,
    learningSessionId: string,
    submittedOrder: string[]
  ) {
    return fetchApi("/learning/listen-and-build-sentence/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonItemId, learningSessionId, submittedOrder })
    });
  },

  async submitMatchingAttempt(
    lessonItemId: string,
    learningSessionId: string,
    selectedPairs: Record<string, string>
  ) {
    return fetchApi("/learning/matching/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonItemId, learningSessionId, selectedPairs })
    });
  },

  async submitListenSpeakAttempt(
    lessonItemId: string,
    learningSessionId: string,
    transcript?: string
  ) {
    return fetchApi("/learning/listen-and-speak/attempt", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonItemId, learningSessionId, transcript })
    });
  },

  /** Development only — clears all progress, attempts, and learning sessions. */
  async resetAllProgressDev() {
    return fetchApi("/learning/dev/reset-progress", {
      method: "POST"
    }) as Promise<{ ok: boolean }>;
  }
};
