-- CreateIndex
CREATE INDEX "chat_messages_reviewId_createdAt_idx" ON "chat_messages"("reviewId", "createdAt");
