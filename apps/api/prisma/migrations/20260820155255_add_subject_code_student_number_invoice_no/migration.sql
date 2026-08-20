-- AlterTable
ALTER TABLE "Subject" ADD COLUMN "subjectCode" TEXT;

-- AlterTable
ALTER TABLE "Student" ADD COLUMN "studentNumber" INTEGER;

-- AlterTable: invoiceNo is added nullable first, backfilled for the 2
-- existing rows (created before this feature existed) with a placeholder
-- that can't collide with a real "{CODE}-{year}-{month}-{num}" value, then
-- made required.
ALTER TABLE "InvoiceLine" ADD COLUMN "invoiceNo" TEXT;
UPDATE "InvoiceLine" SET "invoiceNo" = 'LEGACY-' || substr(id, -8) WHERE "invoiceNo" IS NULL;
ALTER TABLE "InvoiceLine" ALTER COLUMN "invoiceNo" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_subjectCode_key" ON "Subject"("subjectCode");

-- CreateIndex
CREATE UNIQUE INDEX "Student_studentNumber_key" ON "Student"("studentNumber");
