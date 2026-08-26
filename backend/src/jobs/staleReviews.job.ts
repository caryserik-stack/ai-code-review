// backend/src/jobs/staleReviews.job.ts
import cron from "node-cron";
import { prisma } from "../lib/prisma";

const STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 минут — с запасом от твоих "10-30 секунд"

export const startStaleReviewsJob = () => {
  cron.schedule("*/2 * * * *", async () => {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);

    const { count } = await prisma.review.updateMany({
      where: {
        status: "PROCESSING",
        processingStartedAt: { lt: cutoff },
      },
      data: {
        status: "FAILED",
        failureReason: "Processing timed out",
      },
    });

    if (count > 0) {
      console.log(`[StaleReviews] marked ${count} stuck review(s) as FAILED`);
    }
  });
};
