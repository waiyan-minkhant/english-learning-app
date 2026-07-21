import type {
  CourseWithLessonSummaries,
  GetLessonResponse,
  Lesson
} from "@english-learning/contracts/lesson";
import { NotFoundError } from "../../../shared/errors/not-found-error.js";
import {
  mapLessonItemToContract,
  type LessonItemWithSpecialized
} from "../mappers/lesson-item.mapper.js";
import { CourseRepository } from "../repositories/course.repository.js";
import { LessonRepository } from "../repositories/lesson.repository.js";
import {
  ProgressService,
  toProgressContract
} from "./progress.service.js";

export class CourseService {
  constructor(private readonly courseRepository = new CourseRepository()) {}

  async getCourse(courseId: string): Promise<CourseWithLessonSummaries> {
    const course = await this.courseRepository.findById(courseId);
    if (!course) throw new NotFoundError("Course not found");

    return {
      id: course.id,
      title: course.title,
      description: course.description,
      level: course.level,
      lessons: course.lessons.map((lesson) => ({
        id: lesson.id,
        number: lesson.number,
        title: lesson.title,
        description: lesson.description,
        estimatedMinutes: lesson.estimatedMinutes
      }))
    };
  }
}

export class LessonService {
  constructor(
    private readonly lessonRepository = new LessonRepository(),
    private readonly progressService = new ProgressService()
  ) {}

  async getLessonForUser(
    userId: string,
    lessonId: string
  ): Promise<GetLessonResponse> {
    const lesson = await this.lessonRepository.findById(lessonId);
    if (!lesson) throw new NotFoundError("Lesson not found");

    const progress = await this.progressService.ensure(userId, lessonId);

    const contractLesson: Lesson = {
      id: lesson.id,
      number: lesson.number,
      title: lesson.title,
      description: lesson.description,
      estimatedMinutes: lesson.estimatedMinutes,
      items: lesson.items.map((item) =>
        mapLessonItemToContract(item as LessonItemWithSpecialized)
      )
    };

    return {
      lesson: contractLesson,
      progress: toProgressContract(progress)
    };
  }
}

let courseService: CourseService | null = null;
let lessonService: LessonService | null = null;

export function getCourseService() {
  if (!courseService) courseService = new CourseService();
  return courseService;
}

export function getLessonService() {
  if (!lessonService) lessonService = new LessonService();
  return lessonService;
}
