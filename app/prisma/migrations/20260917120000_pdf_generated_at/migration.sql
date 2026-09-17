-- AlterTable
ALTER TABLE "Inspection" ADD COLUMN "pdfGeneratedAt" TIMESTAMP(3);

-- Backfill existing closed inspections so their download links pick up a
-- cache-busting version immediately (the /files route serves an immutable
-- year-long Cache-Control header, so already-cached browsers would
-- otherwise never see fixes applied via a report regeneration).
UPDATE "Inspection" SET "pdfGeneratedAt" = "closedAt" WHERE "pdfUrl" IS NOT NULL;
