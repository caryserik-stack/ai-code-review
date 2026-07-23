import { Worker, Job } from "bullmq";
import { redisConnection } from "./lib/redis";
import { prisma } from "./lib/prisma";
import { analyzeCode, REVIEWER_LEVEL_FROM_PRISMA } from "./services/ai.service"; // подставь свой реальный путь к analyzeCode

const worker = new Worker(
  "review-analysis",
  async (job: Job) => {
    const { reviewId } = job.data;

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { status: "PROCESSING", processingStartedAt: new Date() },
    });

    const teamProfile = await prisma.teamProfile.findUnique({
      where: { userId: review.userId },
    });

    try {
      const result = await analyzeCode(
        review.code,
        review.language,
        REVIEWER_LEVEL_FROM_PRISMA[review.reviewerLevel],
        teamProfile?.rules ?? [],
      );

      await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: "COMPLETED",
          summary: result.summary,
          score: result.score,
          items: { create: result.items },
        },
      });
    } catch (error) {
      await prisma.review.update({
        where: { id: reviewId },
        data: {
          status: "FAILED",
          failureReason: error instanceof Error ? error.message : String(error),
          attempts: { increment: 1 },
        },
      });
      throw error;
    }
  },
  { connection: redisConnection, concurrency: 5 },
);

worker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

console.log("Review worker started");
