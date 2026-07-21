import { completeContentItemFieldsSchema } from "@english-learning/contracts/learning";
import { Router } from "express";
import { requireAuth } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { getLessonService } from "../services/lesson.service.js";
import { getScoredAttemptService } from "../services/attempt.service.js";

const lessonRouter = Router();

lessonRouter.get(
  "/:lessonId",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const lessonId = String(req.params.lessonId);
    const payload = await getLessonService().getLessonForUser(
      user.id,
      lessonId
    );
    res.json(payload);
  })
);

lessonRouter.post(
  "/:lessonId/items/:itemId/complete",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = completeContentItemFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const progress = await getScoredAttemptService().completeContentItem(
      user.id,
      String(req.params.lessonId),
      String(req.params.itemId),
      parsed.data.learningSessionId
    );
    res.json({ progress });
  })
);

export { lessonRouter };
