-- CreateTable
CREATE TABLE "LandingStats" (
    "id" TEXT NOT NULL,
    "historicalSessionHours" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "LandingStats_pkey" PRIMARY KEY ("id")
);
