-- Explicitly approved: title is no longer used on Report. Only 1 row exists
-- in this dev database, so the data loss is inconsequential.
ALTER TABLE "Report" DROP COLUMN "title";
