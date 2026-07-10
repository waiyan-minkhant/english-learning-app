import { lessonService } from "@/services/lessonService";
import type { Course, Lesson } from "@/features/lesson/types/Lesson";

export const lessonApi = {
  getCourse(): Course {
    return lessonService.getCourse();
  },

  getLesson(lessonId: string): Lesson {
    return lessonService.getLesson(lessonId);
  },

  listLessons(): Lesson[] {
    return lessonService.listLessons();
  }
};
