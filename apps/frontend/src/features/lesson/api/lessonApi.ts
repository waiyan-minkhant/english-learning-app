import { lessonService } from "@/services/lessonService";
import type {
  CourseWithLessonSummaries,
  GetLessonResponse,
  LessonSummary
} from "@/features/lesson/types/Lesson";

export const lessonApi = {
  getCourse(): Promise<CourseWithLessonSummaries> {
    return lessonService.getCourse();
  },

  getLesson(lessonId: string): Promise<GetLessonResponse> {
    return lessonService.getLesson(lessonId);
  },

  listLessons(): Promise<LessonSummary[]> {
    return lessonService.listLessons();
  }
};
