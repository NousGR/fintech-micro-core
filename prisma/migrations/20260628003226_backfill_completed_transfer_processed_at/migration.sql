UPDATE "transfers"
SET "processedAt" = "createdAt"
WHERE "status" = 'COMPLETED'
  AND "processedAt" IS NULL;
