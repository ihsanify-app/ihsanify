-- Safe: ReportSettings table has zero rows at this point, nothing references
-- the old "LORA" enum value. Using RENAME VALUE instead of Prisma's default
-- recreate-the-type approach since there's no data to migrate.
ALTER TYPE "ReportFont" RENAME VALUE 'LORA' TO 'PT_SERIF';
