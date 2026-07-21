import { teacherClassRosterResponseSchema } from "@english-learning/contracts/class";
import { Router } from "express";
import { requireAuth, requireRole } from "../../../lib/require-auth.js";
import { asyncHandler } from "../../../shared/errors/async-handler.js";
import { getClassService } from "../services/class.service.js";

const classRouter = Router();

classRouter.get(
  "/me",
  asyncHandler(async (req, res) => {
    const user = requireAuth(req);
    requireRole(user, "teacher");
    const classRoster = await getClassService().getMine(user);
    const payload = teacherClassRosterResponseSchema.parse({
      class: classRoster
    });
    res.json(payload);
  })
);

export { classRouter };
