-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "reportThemeId" TEXT;

-- CreateTable
CREATE TABLE "ReportTheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "primaryColor" TEXT NOT NULL,

    CONSTRAINT "ReportTheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReportTheme_name_key" ON "ReportTheme"("name");

-- AddForeignKey
ALTER TABLE "Subject" ADD CONSTRAINT "Subject_reportThemeId_fkey" FOREIGN KEY ("reportThemeId") REFERENCES "ReportTheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
