// src/jobs/cleanup.job.ts
import cron from "node-cron";
import { prisma } from "../lib/prisma";

export const startCleanupJob = () => {
  cron.schedule("0 3 * * *", async () => {
    const now = new Date();

    const [emailTokens, resetTokens] = await Promise.all([
      prisma.emailVerificationToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
      prisma.passwordResetToken.deleteMany({
        where: { expiresAt: { lt: now } },
      }),
    ]);

    console.log(
      `[Cleanup] email tokens: ${emailTokens.count}, reset tokens: ${resetTokens.count}`,
    );
  });
};
