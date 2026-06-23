import { Request, Response } from "express";
import * as authService from "../services/auth.service";
import { AuthRequest } from "../types";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
};

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name } = req.body;
    const { token, user } = await authService.register({
      email,
      password,
      name,
    });

    res.cookie("jwt_token", token, COOKIE_OPTIONS);
    res.status(201).json({ user });
  } catch (error: any) {
    if (error.message === "EMAIL_EXISTS") {
      res.status(409).json({ error: "Email already exists" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const { token, user } = await authService.login({ email, password });

    res.cookie("jwt_token", token, COOKIE_OPTIONS);
    res.status(200).json({ user });
  } catch (error: any) {
    if (error.message === "INVALID_CREDENTIALS") {
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("jwt_token", COOKIE_OPTIONS);
  res.status(200).json({ message: "Logged out successfully" });
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await authService.getMe(req.userId!);
    res.status(200).json({ user });
  } catch (error) {
    res.status(404).json({ error: "User not found" });
  }
};

export const updateProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, email } = req.body;

    if (!name && !email) {
      res
        .status(400)
        .json({ error: "Provide at least name or email to update" });
      return;
    }

    const user = await authService.updateProfile(req.userId!, { name, email });
    res.status(200).json({ user });
  } catch (error: any) {
    if (error.message === "EMAIL_EXISTS") {
      res.status(409).json({ error: "Email already in use" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: "Current and new password are required" });
      return;
    }

    if (newPassword.length < 8) {
      res
        .status(400)
        .json({ error: "New password must be at least 8 characters" });
      return;
    }

    await authService.changePassword(req.userId!, {
      currentPassword,
      newPassword,
    });
    res.status(200).json({ message: "Password changed successfully" });
  } catch (error: any) {
    if (error.message === "INVALID_CURRENT_PASSWORD") {
      res.status(401).json({ error: "Current password is incorrect" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
