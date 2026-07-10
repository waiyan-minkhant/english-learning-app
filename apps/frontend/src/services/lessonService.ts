import courseData from "@/data.json";
import {
  courseSchema,
  lessonSchema,
  type Course,
  type Lesson
} from "@/features/lesson/types/Lesson";

const course = courseSchema.parse(courseData);

export const lessonService = {
  getCourse(): Course {
    return course;
  },

  getLesson(lessonId: string): Lesson {
    const lesson = course.lessons.find((item) => item.id === lessonId);
    if (!lesson) {
      throw new Error(`Lesson not found: ${lessonId}`);
    }
    return lessonSchema.parse(lesson);
  },

  listLessons(): Lesson[] {
    return course.lessons;
  }
};
