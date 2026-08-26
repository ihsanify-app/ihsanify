-- DropIndex
DROP INDEX "Payslip_teacherId_month_year_key";

-- AlterTable
ALTER TABLE "Payslip" DROP COLUMN "month",
DROP COLUMN "year",
ADD COLUMN     "payrollId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Payroll" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payroll_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Payroll_month_year_key" ON "Payroll"("month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Payslip_payrollId_teacherId_key" ON "Payslip"("payrollId", "teacherId");

-- AddForeignKey
ALTER TABLE "Payslip" ADD CONSTRAINT "Payslip_payrollId_fkey" FOREIGN KEY ("payrollId") REFERENCES "Payroll"("id") ON DELETE CASCADE ON UPDATE CASCADE;
