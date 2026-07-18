import { conversationAttemptFieldsSchema } from "@english-learning/contracts/learning";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { getConversationService } from "../services/conversation.service.js";

const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AUDIO_BYTES },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "audio/webm",
      "audio/ogg",
      "audio/mp4",
      "audio/mpeg",
      "audio/wav",
      "audio/x-wav",
      "video/webm"
    ];
    if (allowed.includes(file.mimetype) || file.mimetype.startsWith("audio/")) {
      cb(null, true);
      return;
    }
    cb(new ValidationError(`Unsupported audio type: ${file.mimetype}`));
  }
});

const learningRouter = Router();

learningRouter.post(
  "/conversation/attempt",
  upload.single("audio"),
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);

    if (!req.file?.buffer?.length) {
      throw new ValidationError("Audio file is required");
    }

    const body = {
      ...req.body,
      sessionId:
        typeof req.body.sessionId === "string" && req.body.sessionId.trim()
          ? req.body.sessionId.trim()
          : undefined
    };

    const parsed = conversationAttemptFieldsSchema.safeParse(body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }

    const result = await getConversationService().evaluateAttempt({
      userId: user.id,
      audio: req.file.buffer,
      mimeType: req.file.mimetype,
      ...parsed.data
    });

    res.status(201).json(result);
  })
);

export { learningRouter };
