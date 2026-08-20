/*
  Warnings:

  - You are about to drop the column `groupId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the column `teacherId` on the `Invoice` table. All the data in the column will be lost.
  - You are about to drop the `_InvoiceSessions` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_groupId_fkey";

-- DropForeignKey
ALTER TABLE "Invoice" DROP CONSTRAINT "Invoice_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "_InvoiceSessions" DROP CONSTRAINT "_InvoiceSessions_A_fkey";

-- DropForeignKey
ALTER TABLE "_InvoiceSessions" DROP CONSTRAINT "_InvoiceSessions_B_fkey";

-- AlterTable
ALTER TABLE "Invoice" DROP COLUMN "groupId",
DROP COLUMN "price",
DROP COLUMN "teacherId";

-- DropTable
DROP TABLE "_InvoiceSessions";

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "price" INTEGER NOT NULL,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_InvoiceLineSessions" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_InvoiceLineSessions_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_InvoiceLineSessions_B_index" ON "_InvoiceLineSessions"("B");

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "Group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceLineSessions" ADD CONSTRAINT "_InvoiceLineSessions_A_fkey" FOREIGN KEY ("A") REFERENCES "InvoiceLine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_InvoiceLineSessions" ADD CONSTRAINT "_InvoiceLineSessions_B_fkey" FOREIGN KEY ("B") REFERENCES "Session"("id") ON DELETE CASCADE ON UPDATE CASCADE;
