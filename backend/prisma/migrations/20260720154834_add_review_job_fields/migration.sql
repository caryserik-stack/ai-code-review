-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "failureReason" TEXT,
ADD COLUMN     "processingStartedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "reviews_userId_createdAt_idx" ON "reviews"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "reviews_status_processingStartedAt_idx" ON "reviews"("status", "processingStartedAt");
