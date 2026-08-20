-- CreateEnum
CREATE TYPE "GroupType" AS ENUM ('GROUP', 'PRIVATE');

-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "cardColor" TEXT,
ADD COLUMN     "groupType" "GroupType" NOT NULL DEFAULT 'GROUP';
