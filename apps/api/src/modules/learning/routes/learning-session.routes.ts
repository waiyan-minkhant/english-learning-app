import {
  createClassroomLearningSessionSchema,
  createSoloLearningSessionSchema,
  listLearningSessionsQuerySchema
} from "@english-learning/contracts/learning-session";
import { Router } from "express";
import { requireAuth } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { getLearningSessionService } from "../services/learning-session.service.js";

const learningSessionRouter = Router();

learningSessionRouter.post(
  "/solo",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = createSoloLearningSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const session = await getLearningSessionService().startSolo(
      user.id,
      parsed.data.lessonId
    );
    res.status(201).json({ session });
  })
);

learningSessionRouter.post(
  "/classroom",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = createClassroomLearningSessionSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const session = await getLearningSessionService().startClassroom(
      user,
      parsed.data
    );
    res.status(201).json({ session });
  })
);

learningSessionRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = listLearningSessionsQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const sessions = await getLearningSessionService().list(user, parsed.data);
    res.json({ sessions });
  })
);

learningSessionRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const session = await getLearningSessionService().getById(
      user,
      String(req.params.id)
    );
    res.json({ session });
  })
);

learningSessionRouter.post(
  "/:id/end",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const session = await getLearningSessionService().end(
      user,
      String(req.params.id)
    );
    res.json({ session });
  })
);

learningSessionRouter.get(
  "/:id/attempts",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const filterUserId =
      typeof req.query.userId === "string" && req.query.userId.length > 0
        ? req.query.userId
        : undefined;
    const attempts = await getLearningSessionService().listAttempts(
      user,
      String(req.params.id),
      filterUserId
    );
    res.json({ attempts });
  })
);

export { learningSessionRouter };
