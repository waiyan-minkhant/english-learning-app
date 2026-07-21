import {
  conversationAttemptFieldsSchema,
  fillBlankAttemptFieldsSchema,
  listenBuildAttemptFieldsSchema,
  listenFillBlankAttemptFieldsSchema,
  listenSpeakAttemptFieldsSchema,
  matchingAttemptFieldsSchema
} from "@english-learning/contracts/learning";
import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { ForbiddenError } from "../../../shared/errors/forbidden-error.js";
import { ValidationError } from "../../../shared/errors/validation-error.js";
import { getScoredAttemptService } from "../services/attempt.service.js";
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

    const parsed = conversationAttemptFieldsSchema.safeParse(req.body);
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

learningRouter.post(
  "/fill-in-blank/attempt",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = fillBlankAttemptFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const result = await getScoredAttemptService().submitFillBlank(
      user.id,
      parsed.data.lessonItemId,
      parsed.data.learningSessionId,
      parsed.data.selectedAnswer
    );
    res.status(201).json(result);
  })
);

learningRouter.post(
  "/listen-and-fill-in-blank/attempt",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = listenFillBlankAttemptFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const result = await getScoredAttemptService().submitListenFillBlank(
      user.id,
      parsed.data.lessonItemId,
      parsed.data.learningSessionId,
      parsed.data.selectedAnswer
    );
    res.status(201).json(result);
  })
);

learningRouter.post(
  "/listen-and-build-sentence/attempt",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = listenBuildAttemptFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const result = await getScoredAttemptService().submitListenBuild(
      user.id,
      parsed.data.lessonItemId,
      parsed.data.learningSessionId,
      parsed.data.submittedOrder
    );
    res.status(201).json(result);
  })
);

learningRouter.post(
  "/matching/attempt",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = matchingAttemptFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const result = await getScoredAttemptService().submitMatching(
      user.id,
      parsed.data.lessonItemId,
      parsed.data.learningSessionId,
      parsed.data.selectedPairs
    );
    res.status(201).json(result);
  })
);

learningRouter.post(
  "/listen-and-speak/attempt",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    const parsed = listenSpeakAttemptFieldsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Validation failed", parsed.error.flatten());
    }
    const result = await getScoredAttemptService().submitListenSpeak(
      user.id,
      parsed.data.lessonItemId,
      parsed.data.learningSessionId,
      parsed.data.transcript
    );
    res.status(201).json(result);
  })
);

learningRouter.post(
  "/dev/reset-progress",
  asyncHandler(async (req, res) => {
    requireAuth(req);

    if (process.env.NODE_ENV === "production") {
      throw new ForbiddenError("Dev reset is not available in production");
    }

    const { prisma } = await import("../../../lib/prisma.js");

    await prisma.$transaction([
      prisma.conversationAttempt.deleteMany(),
      prisma.fillBlankAttempt.deleteMany(),
      prisma.listenBuildSentenceAttempt.deleteMany(),
      prisma.listenFillBlankAttempt.deleteMany(),
      prisma.matchingAttempt.deleteMany(),
      prisma.listenSpeakAttempt.deleteMany(),
      prisma.userLessonProgress.deleteMany(),
      prisma.learningSession.deleteMany()
    ]);

    res.status(200).json({ ok: true });
  })
);

export { learningRouter };
