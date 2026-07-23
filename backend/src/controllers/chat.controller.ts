// backend/src/controllers/chat.controller.ts
import { Response } from "express";
import { AuthRequest } from "../types";
import * as chatService from "../services/chat.service";

export const getChatHistory = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const cursor = req.query.cursor as string | undefined;
    const result = await chatService.getChatHistory(id, req.userId!, cursor);
    res.status(200).json(result);
  } catch (error: any) {
    if (error.message === "REVIEW_NOT_FOUND") {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const sendChatMessage = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const message = await chatService.sendChatMessage(id, req.userId!, content);
    res.status(201).json({ message });
  } catch (error: any) {
    if (error.message === "REVIEW_NOT_FOUND") {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
