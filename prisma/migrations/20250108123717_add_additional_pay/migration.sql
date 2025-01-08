-- CreateTable
CREATE TABLE "AdditionalPay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPay_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "AdditionalPay_providerId_idx" ON "AdditionalPay"("providerId");

-- CreateIndex
CREATE INDEX "AdditionalPay_year_idx" ON "AdditionalPay"("year");

-- CreateIndex
CREATE INDEX "AdditionalPay_month_idx" ON "AdditionalPay"("month");
