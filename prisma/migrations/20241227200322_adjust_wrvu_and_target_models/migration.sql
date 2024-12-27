/*
  Warnings:

  - You are about to drop the `AdditionalPayment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TargetAdjustment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WRVUAdjustment` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "AdditionalPayment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TargetAdjustment";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "WRVUAdjustment";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "wrvu_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "jan" REAL NOT NULL DEFAULT 0,
    "feb" REAL NOT NULL DEFAULT 0,
    "mar" REAL NOT NULL DEFAULT 0,
    "apr" REAL NOT NULL DEFAULT 0,
    "may" REAL NOT NULL DEFAULT 0,
    "jun" REAL NOT NULL DEFAULT 0,
    "jul" REAL NOT NULL DEFAULT 0,
    "aug" REAL NOT NULL DEFAULT 0,
    "sep" REAL NOT NULL DEFAULT 0,
    "oct" REAL NOT NULL DEFAULT 0,
    "nov" REAL NOT NULL DEFAULT 0,
    "dec" REAL NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'adjustment',
    "category" TEXT NOT NULL DEFAULT 'operational',
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedBy" TEXT,
    "approvedDate" DATETIME,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "wrvu_adjustments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "target_adjustments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "jan" REAL NOT NULL DEFAULT 0,
    "feb" REAL NOT NULL DEFAULT 0,
    "mar" REAL NOT NULL DEFAULT 0,
    "apr" REAL NOT NULL DEFAULT 0,
    "may" REAL NOT NULL DEFAULT 0,
    "jun" REAL NOT NULL DEFAULT 0,
    "jul" REAL NOT NULL DEFAULT 0,
    "aug" REAL NOT NULL DEFAULT 0,
    "sep" REAL NOT NULL DEFAULT 0,
    "oct" REAL NOT NULL DEFAULT 0,
    "nov" REAL NOT NULL DEFAULT 0,
    "dec" REAL NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'target',
    "category" TEXT NOT NULL DEFAULT 'standard',
    "status" TEXT NOT NULL DEFAULT 'active',
    "approvedBy" TEXT,
    "approvedDate" DATETIME,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "target_adjustments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "additional_payments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "amount" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "additional_payments_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "holdbackPercent" REAL NOT NULL DEFAULT 5,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderSettings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "monthly_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "actualWRVUs" REAL NOT NULL,
    "adjustedWRVUs" REAL NOT NULL,
    "targetWRVUs" REAL NOT NULL,
    "variance" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "incentivePay" REAL NOT NULL,
    "holdbackAmount" REAL NOT NULL,
    "ytdIncentives" REAL NOT NULL,
    "totalCompensation" REAL NOT NULL,
    "wrvuPercentile" REAL,
    "cfPercentile" REAL,
    "totalCompPercentile" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "monthly_metrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "adjustment_reports" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reportName" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "providerId" TEXT,
    "department" TEXT,
    "specialty" TEXT,
    "includeWRVU" BOOLEAN NOT NULL DEFAULT true,
    "includeTarget" BOOLEAN NOT NULL DEFAULT true,
    "categories" TEXT NOT NULL,
    "reportData" TEXT,
    "generatedBy" TEXT NOT NULL,
    "generatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'completed',
    CONSTRAINT "adjustment_reports_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "wrvu_adjustments_providerId_year_idx" ON "wrvu_adjustments"("providerId", "year");

-- CreateIndex
CREATE INDEX "wrvu_adjustments_type_category_idx" ON "wrvu_adjustments"("type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "wrvu_adjustments_providerId_year_name_key" ON "wrvu_adjustments"("providerId", "year", "name");

-- CreateIndex
CREATE INDEX "target_adjustments_providerId_year_idx" ON "target_adjustments"("providerId", "year");

-- CreateIndex
CREATE INDEX "target_adjustments_type_category_idx" ON "target_adjustments"("type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "target_adjustments_providerId_year_name_key" ON "target_adjustments"("providerId", "year", "name");

-- CreateIndex
CREATE INDEX "additional_payments_providerId_year_month_idx" ON "additional_payments"("providerId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSettings_providerId_key" ON "ProviderSettings"("providerId");

-- CreateIndex
CREATE INDEX "monthly_metrics_providerId_year_idx" ON "monthly_metrics"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "monthly_metrics_providerId_year_month_key" ON "monthly_metrics"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "adjustment_reports_reportType_generatedAt_idx" ON "adjustment_reports"("reportType", "generatedAt");

-- CreateIndex
CREATE INDEX "adjustment_reports_providerId_reportType_idx" ON "adjustment_reports"("providerId", "reportType");
