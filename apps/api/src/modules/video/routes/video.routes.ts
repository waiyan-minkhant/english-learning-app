import type { AuthUser } from "@english-learning/contracts";
import { videoTokenRequestSchema } from "@english-learning/contracts/video";
import { Router } from "express";
import {
  AUTH_COOKIE_NAME,
  verifyToken
} from "../../auth/services/auth.service.js";
import { createVideoToken } from "../services/video.service.js";

const videoRouter = Router();

videoRouter.post("/token", async (req, res) => {
  const accessToken = req.cookies?.[AUTH_COOKIE_NAME];
  if (!accessToken) {
    return res.status(401).json({ message: "Unauthenticated" });
  }

  let user: AuthUser;
  try {
    user = verifyToken(accessToken);
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }

  const parsed = videoTokenRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ errors: parsed.error.flatten() });
  }

  try {
    const { token, url } = await createVideoToken({
      roomName: parsed.data.roomName,
      participantIdentity: user.id,
      participantName: user.email
    });

    return res.json({
      token,
      url,
      roomName: parsed.data.roomName
    });
  } catch (error) {
    return res.status(500).json({
      message:
        error instanceof Error ? error.message : "Failed to create video token"
    });
  }
});

export { videoRouter };
