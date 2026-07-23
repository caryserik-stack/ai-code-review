-- CreateIndex
CREATE INDEX "review_items_reviewId_type_idx" ON "review_items"("reviewId", "type");

-- CreateIndex
CREATE INDEX "review_items_reviewId_severity_idx" ON "review_items"("reviewId", "severity");

-- Enforce: owaspCategory/severity only allowed when type = 'SECURITY'
ALTER TABLE "review_items"
ADD CONSTRAINT "security_fields_only_for_security_type"
CHECK (
  (type = 'SECURITY') OR ("owaspCategory" IS NULL AND "severity" IS NULL)
);