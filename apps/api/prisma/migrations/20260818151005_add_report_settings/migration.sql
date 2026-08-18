-- CreateEnum
CREATE TYPE "ReportHeaderPattern" AS ENUM ('NONE', 'LINES', 'DOTS', 'BLOCKS', 'SWIRL');

-- CreateEnum
CREATE TYPE "ReportFont" AS ENUM ('HELVETICA', 'POPPINS', 'LORA');

-- CreateTable
CREATE TABLE "ReportSettings" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL DEFAULT 'Laporan Belajar',
    "organizationName" TEXT NOT NULL DEFAULT 'Ihsanify',
    "footerPhone" TEXT,
    "footerEmail" TEXT,
    "footerInstagram" TEXT,
    "font" "ReportFont" NOT NULL DEFAULT 'HELVETICA',
    "headerPattern" "ReportHeaderPattern" NOT NULL DEFAULT 'NONE',
    "coverImageUrl" TEXT,

    CONSTRAINT "ReportSettings_pkey" PRIMARY KEY ("id")
);
