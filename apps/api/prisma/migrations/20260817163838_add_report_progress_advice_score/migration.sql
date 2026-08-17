/*
  Warnings:

  - You are about to drop the column `description` on the `Report` table. All the data in the column will be lost.
  - Added the required column `advice` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `progress` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `Report` table without a default value. This is not possible if the table is not empty.

  This also clears existing rows in "Report" first (dev-only test data,
  not real records) since the new columns are required with no default.
*/
-- Dev-only cleanup: existing rows can't satisfy the new NOT NULL columns.
DELETE FROM "Report";

-- AlterTable
ALTER TABLE "Report" DROP COLUMN "description",
ADD COLUMN     "advice" TEXT NOT NULL,
ADD COLUMN     "progress" TEXT NOT NULL,
ADD COLUMN     "score" INTEGER NOT NULL;
