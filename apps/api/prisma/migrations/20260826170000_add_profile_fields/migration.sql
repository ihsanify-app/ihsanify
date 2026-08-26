-- CreateEnum
CREATE TYPE "TeacherTitle" AS ENUM ('S_PD', 'S_T', 'LC');

-- CreateEnum
CREATE TYPE "School" AS ENUM ('MEDINA_INTERNATIONAL_SCHOOL', 'AL_WILDAN_INTERNATIONAL_ISLAMIC_SCHOOL');

-- AlterTable
ALTER TABLE "Student" ADD COLUMN     "school" "School";

-- AlterTable
ALTER TABLE "Teacher" ADD COLUMN     "title" "TeacherTitle";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "bio" TEXT,
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "TeachingHistory" (
    "id" TEXT NOT NULL,
    "teacherId" TEXT NOT NULL,
    "startYear" INTEGER NOT NULL,
    "endYear" INTEGER NOT NULL,
    "organization" TEXT NOT NULL,

    CONSTRAINT "TeachingHistory_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "TeachingHistory" ADD CONSTRAINT "TeachingHistory_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher"("id") ON DELETE CASCADE ON UPDATE CASCADE;
