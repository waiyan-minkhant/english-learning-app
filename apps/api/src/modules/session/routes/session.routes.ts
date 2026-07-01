import {
  sessionJoinResponseSchema,
  sessionRoomResponseSchema
} from "@english-learning/contracts/session";
import { Router } from "express";
import { getAuthUser, requireRole } from "../../../lib/require-auth.js";
import { joinSession, startSession } from "../services/session.service.js";

const sessionRouter = Router();

sessionRouter.post("/start", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  try {
    requireRole(user, "teacher");
    const result = await startSession(user.id);
    const payload = sessionRoomResponseSchema.parse(result);
    return res.status(201).json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to start session";
    const status = message.includes("Only") ? 403 : 400;
    return res.status(status).json({ message });
  }
});

sessionRouter.post("/join", async (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  try {
    requireRole(user, "student");
    const result = await joinSession(user.id);
    const payload = sessionJoinResponseSchema.parse(result);
    return res.json(payload);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to join session";
    const status = message.includes("Only")
      ? 403
      : message.includes("No live session")
        ? 404
        : 400;
    return res.status(status).json({ message });
  }
});

export { sessionRouter };
