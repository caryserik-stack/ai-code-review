// backend/src/controllers/teamProfile.controller.ts
import { Response } from "express";
import * as teamProfileService from "../services/teamProfile.service";
import { AuthRequest } from "../types";

export const getTeamProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const profile = await teamProfileService.getTeamProfile(req.userId!);
    res.status(200).json({ profile });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateTeamProfile = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { rules } = req.body;
    const profile = await teamProfileService.upsertTeamProfile(
      req.userId!,
      rules,
    );
    res.status(200).json({ profile });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};
