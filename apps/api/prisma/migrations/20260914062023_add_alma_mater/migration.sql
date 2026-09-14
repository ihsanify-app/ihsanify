-- CreateTable
CREATE TABLE "AlmaMater" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "logoUrl" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlmaMater_pkey" PRIMARY KEY ("id")
);
