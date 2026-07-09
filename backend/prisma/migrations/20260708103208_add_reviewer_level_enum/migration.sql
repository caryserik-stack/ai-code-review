-- CreateEnum
CREATE TYPE "ReviewerLevel" AS ENUM ('JUNIOR', 'MIDDLE', 'SENIOR');

-- AlterTable
ALTER TABLE "reviews" ADD COLUMN     "reviewerLevel" "ReviewerLevel" NOT NULL DEFAULT 'JUNIOR';
