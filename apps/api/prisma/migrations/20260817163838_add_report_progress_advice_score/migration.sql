/*
  Warnings:

  - You are about to drop the column `description` on the `Report` table. All the data in the column will be lost.
  - Added the required column `advice` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `progress` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `score` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "description",
ADD COLUMN     "advice" TEXT NOT NULL,
ADD COLUMN     "progress" TEXT NOT NULL,
ADD COLUMN     "score" INTEGER NOT NULL;
