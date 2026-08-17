/*
  Warnings:

  - You are about to drop the column `status` on the `Report` table. All the data in the column will be lost.
  - Added the required column `month` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Report` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Report" DROP COLUMN "status",
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "readAt" TIMESTAMP(3),
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "submittedAt" TIMESTAMP(3),
ADD COLUMN     "teacherId" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Report" ADD CONSTRAINT "Report_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
