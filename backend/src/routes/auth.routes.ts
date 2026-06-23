import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../services/validate.middleware";
import { registerSchema, loginSchema } from "../lib/schemas";

const router = Router();

router.post("/register", validate(registerSchema), authController.register);
router.post("/login", validate(loginSchema), authController.login);
router.post("/logout", authController.logout);

router.get("/me", authMiddleware, authController.getMe);
router.patch("/me", authMiddleware, authController.updateProfile);
router.patch("/me/password", authMiddleware, authController.changePassword);

export default router;
