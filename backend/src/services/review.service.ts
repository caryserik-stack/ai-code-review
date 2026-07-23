import { prisma } from "../lib/prisma";
import { analyzeCode, REVIEWER_LEVEL_TO_PRISMA } from "./ai.service";
import type { ReviewerLevel } from "./ai.service";
import { reviewQueue } from "../queues/review.queue";

// ──────────────────────
// СОЗДАТЬ РЕВЬЮ
// ──────────────────────

const REVIEW_LIMIT = 5;
const WINDOW_MS = 60 * 60 * 1000;

export const getReviewUsage = async (userId: string) => {
  const windowStart = new Date(Date.now() - WINDOW_MS);
  const used = await prisma.review.count({
    where: {
      userId,
      createdAt: { gte: windowStart },
    },
  });
  return {
    used,
    limit: REVIEW_LIMIT,
    remaining: Math.max(0, REVIEW_LIMIT - used),
  };
};

export const enqueueReview = async (data: {
  code: string;
  language: string;
  reviewerLevel: ReviewerLevel;
  userId: string;
}) => {
  const { used } = await getReviewUsage(data.userId);

  if (used >= REVIEW_LIMIT) throw new Error("REVIEW_LIMIT_REACHED");

  // const teamProfile = await prisma.teamProfile.findUnique({
  //   where: { userId: data.userId },
  // })

  // Шаг 1 — создаём запись со статусом PROCESSING
  const review = await prisma.review.create({
    data: {
      code: data.code,
      language: data.language,
      reviewerLevel: REVIEWER_LEVEL_TO_PRISMA[data.reviewerLevel],
      userId: data.userId,
      status: "PROCESSING",
    },
  });

  await reviewQueue.add("analyze", { reviewId: review.id });

  return review;
};

// ──────────────────────
// ПОЛУЧИТЬ ВСЕ РЕВЬЮ
// ──────────────────────

const REVIEWS_PER_PAGE = 10;

export const getReviews = async (userId: string, cursor?: string) => {
  const reviews = await prisma.review.findMany({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: REVIEWS_PER_PAGE + 1,
    ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    select: {
      id: true,
      language: true,
      status: true,
      score: true,
      summary: true,
      createdAt: true,
    },
  });

  const hasMore = reviews.length > REVIEWS_PER_PAGE; // > 10, не >= 10
  const items = hasMore ? reviews.slice(0, REVIEWS_PER_PAGE) : reviews;
  const nextCursor = hasMore ? items[items.length - 1].id : null;
  return { reviews: items, nextCursor };
};

// ──────────────────────
// ПОЛУЧИТЬ ОДНО РЕВЬЮ
// ──────────────────────
export const getReviewById = async (id: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: { id, userId, deletedAt: null },
    include: { items: true },
  });

  if (!review) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  return review;
};

// ──────────────────────
// УДАЛИТЬ РЕВЬЮ
// ──────────────────────

export const deleteReview = async (id: string, userId: string) => {
  const review = await prisma.review.findFirst({
    where: { id, userId, deletedAt: null },
  });

  if (!review) {
    throw new Error("REVIEW_NOT_FOUND");
  }

  await prisma.$transaction([
    prisma.chatMessage.deleteMany({ where: { reviewId: id } }),
    prisma.reviewItem.deleteMany({ where: { reviewId: id } }),
    prisma.review.update({
      where: { id },
      data: { deletedAt: new Date() },
    }),
  ]);
};

// ──────────────────────
// СЧЕТЧИК РЕВЬЮ
// ──────────────────────

export const getReviewsCount = async (userId: string) => {
  return prisma.review.count({
    where: { userId, deletedAt: null },
  });
};

// ──────────────────────
// ПЕРЕКЛЮЧИТЬ RESOLVED У ITEM
// ──────────────────────

export const toggleItemResolved = async (
  itemId: string,
  resolved: boolean,
  userId: string,
) => {
  // Проверяем, что item принадлежит ревью этого юзера
  const item = await prisma.reviewItem.findFirst({
    where: {
      id: itemId,
      review: { userId, deletedAt: null },
    },
  });

  if (!item) {
    throw new Error("REVIEW_ITEM_NOT_FOUND");
  }

  return prisma.reviewItem.update({
    where: { id: itemId },
    data: { resolved },
  });
};
