-- CreateTable
CREATE TABLE "InvoiceSettings" (
    "id" TEXT NOT NULL,
    "bankName" TEXT,
    "bankAccount" TEXT,

    CONSTRAINT "InvoiceSettings_pkey" PRIMARY KEY ("id")
);
