// backend/src/routes/teamProfile.routes.ts
import { Router } from "express";
import * as teamProfileController from "../controllers/teamProfile.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../services/validate.middleware";
import { teamProfileSchema } from "../lib/schemas";

const router = Router();

router.get("/", authMiddleware, teamProfileController.getTeamProfile);
router.put(
  "/",
  authMiddleware,
  validate(teamProfileSchema),
  teamProfileController.updateTeamProfile,
);

export default router;
