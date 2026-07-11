import { Response } from "express";
import * as reviewService from "../services/review.service";
import { AuthRequest } from "../types";
import { prisma } from "../lib/prisma";
import { createReviewSchema, toggleResolvedSchema } from "../lib/schemas";

export const createReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { code, language, reviewerLevel } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.userId! } });
    if (!user?.emailVerified) {
      res
        .status(403)
        .json({ error: "Please verify your email before creating reviews" });
      return;
    }

    const review = await reviewService.createReview({
      code,
      language,
      reviewerLevel,
      userId: req.userId!,
    });

    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const used = await prisma.review.count({
      where: {
        userId: req.userId!,
        createdAt: { gte: windowStart },
      },
    });

    res.status(201).json({
      review,
      remaining: Math.max(0, 5 - used),
      limit: 5,
    });
  } catch (error: any) {
    if (error.message === "REVIEW_LIMIT_REACHED") {
      res.status(400).json({
        error: "Review limit reached. You can create up to 5 reviews per hour.",
      });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReviews = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const cursor = req.query.cursor as string | undefined;
    const reviews = await reviewService.getReviews(req.userId!, cursor);
    res.status(200).json(reviews);
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReviewById = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await reviewService.getReviewById(id, req.userId!);

    res.status(200).json({ review });
  } catch (error: any) {
    if (error.message === "REVIEW_NOT_FOUND") {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteReview = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { id } = req.params;

    await reviewService.deleteReview(id, req.userId!);

    res.status(200).send();
  } catch (error: any) {
    if (error.message === "REVIEW_NOT_FOUND") {
      res.status(404).json({ error: "Review not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getLimits = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const LIMIT = 5;
    const windowStart = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago

    const used = await prisma.review.count({
      where: {
        userId: req.userId!,
        createdAt: { gte: windowStart },
      },
    });

    res.status(200).json({
      used,
      limit: LIMIT,
      remaining: Math.max(0, LIMIT - used),
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getReviewsCount = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const count = await reviewService.getReviewsCount(req.userId!);
    res.status(200).json({ count });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
};

export const toggleItemResolved = async (
  req: AuthRequest,
  res: Response,
): Promise<void> => {
  try {
    const { itemId } = req.params;
    const { resolved } = req.body;

    const item = await reviewService.toggleItemResolved(
      itemId,
      resolved,
      req.userId!,
    );

    res.status(200).json({ item });
  } catch (error: any) {
    if (error.message === "REVIEW_ITEM_NOT_FOUND") {
      res.status(404).json({ error: "Review item not found" });
      return;
    }
    res.status(500).json({ error: "Internal server error" });
  }
};
