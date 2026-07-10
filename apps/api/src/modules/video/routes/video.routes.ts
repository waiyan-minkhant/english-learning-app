import { videoTokenRequestSchema } from "@english-learning/contracts/video";
import { Router } from "express";
import { requireAuth } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { createVideoToken } from "../services/video.service.js";

const videoRouter = Router();

videoRouter.post(
  "/token",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);

    const parsed = videoTokenRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }

    const { token, url } = await createVideoToken({
      roomName: parsed.data.roomName,
      participantIdentity: user.id,
      participantName: user.email
    });

    res.json({
      token,
      url,
      roomName: parsed.data.roomName
    });
  })
);

export { videoRouter };
