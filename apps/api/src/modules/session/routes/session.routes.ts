import {
  sessionJoinResponseSchema,
  sessionRoomResponseSchema
} from "@english-learning/contracts/session";
import { Router } from "express";
import { requireAuth, requireRole } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { joinSession, startSession } from "../services/session.service.js";

const sessionRouter = Router();

sessionRouter.post(
  "/start",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    requireRole(user, "teacher");

    const result = await startSession(user.id);
    const payload = sessionRoomResponseSchema.parse(result);
    res.status(201).json(payload);
  })
);

sessionRouter.post(
  "/join",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    requireRole(user, "student");

    const result = await joinSession(user.id);
    const payload = sessionJoinResponseSchema.parse(result);
    res.json(payload);
  })
);

export { sessionRouter };
