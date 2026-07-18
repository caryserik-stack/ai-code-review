// backend/src/controllers/report.controller.ts
import { Response } from "express";
import { AuthRequest } from "../types";
import * as reviewService from "../services/review.service";
import { generateMarkdownReport } from "../services/report.service";

export const getReviewReport = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await reviewService.getReviewById(id, req.userId!);

    const markdown = generateMarkdownReport(review);

    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="review-${id}.md"`,
    );
    res.status(200).send(markdown);
  } catch (error: any) {
    if (error.message === "REVIEW_NOT_FOUND") {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
