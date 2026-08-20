/*
  Warnings:

  - You are about to drop the column `description` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Invoice` table. All the data in the column will be lost.
  - Added the required column `month` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `price` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teacherId` to the `Invoice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `year` to the `Invoice` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "description",
DROP COLUMN "status",
DROP COLUMN "title",
ADD COLUMN     "month" INTEGER NOT NULL,
ADD COLUMN     "price" INTEGER NOT NULL,
ADD COLUMN     "studentId" TEXT NOT NULL,
ADD COLUMN     "teacherId" TEXT NOT NULL,
ADD COLUMN     "year" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "_InvoiceSessions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InvoiceSessions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InvoiceSessions_B_index" ON "_InvoiceSessions"("B");

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceSessions" ADD CONSTRAINT "_InvoiceSessions_A_fkey" FOREIGN KEY ("A") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceSessions" ADD CONSTRAINT "_InvoiceSessions_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
