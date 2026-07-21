import { Router } from "express";
import { requireAuth } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { getCourseService } from "../services/lesson.service.js";

const courseRouter = Router();

courseRouter.get(
  "/:courseId",
  asyncHandler(async (req, res) => {
    requireAuth(req);
    const courseId = String(req.params.courseId);
    const course = await getCourseService().getCourse(courseId);
    res.json(course);
  })
);

export { courseRouter };
