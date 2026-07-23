import { Queue } from "bullmq";
import { redisConnection } from "../lib/redis";

export const reviewQueue = new Queue("review-analysis", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 100, // хранить последние 100 успешных job, остальное чистить
    removeOnFail: 500,
  },
});
