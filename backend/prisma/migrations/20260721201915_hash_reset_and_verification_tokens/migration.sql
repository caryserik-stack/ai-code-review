/*
  Warnings:

  - You are about to drop the column `code` on the `email_verification_tokens` table. All the data in the column will be lost.
  - You are about to drop the column `token` on the `password_reset_tokens` table. All the data in the column will be lost.
  - Added the required column `codeHash` to the `email_verification_tokens` table without a default value. This is not possible if the table is not empty.
  - Added the required column `codeHash` to the `password_reset_tokens` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "password_reset_tokens_token_key";

-- AlterTable
ALTER TABLE "email_verification_tokens" DROP COLUMN "code",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "codeHash" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "password_reset_tokens" DROP COLUMN "token",
ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "codeHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
