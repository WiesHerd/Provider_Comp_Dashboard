/*
  Warnings:

  - You are about to drop the `ProviderSettings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `additional_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `adjustment_reports` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `monthly_metrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `provider_metrics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `target_adjustments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `wrvu_adjustments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `conversionFactor` on the `CompensationChange` table. All the data in the column will be lost.
  - Added the required column `newConversionFactor` to the `CompensationChange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `previousConversionFactor` to the `CompensationChange` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "ProviderSettings_providerId_key";

-- DropIndex
DROP INDEX "additional_payments_providerId_year_month_idx";

-- DropIndex
DROP INDEX "adjustment_reports_providerId_reportType_idx";

-- DropIndex
DROP INDEX "adjustment_reports_reportType_generatedAt_idx";

-- DropIndex
DROP INDEX "monthly_metrics_providerId_year_month_key";

-- DropIndex
DROP INDEX "monthly_metrics_providerId_year_idx";

-- DropIndex
DROP INDEX "provider_metrics_providerId_year_month_key";

-- DropIndex
DROP INDEX "provider_metrics_calculatedDate_idx";

-- DropIndex
DROP INDEX "provider_metrics_providerId_year_idx";

-- DropIndex
DROP INDEX "target_adjustments_providerId_year_name_key";

-- DropIndex
DROP INDEX "target_adjustments_type_category_idx";

-- DropIndex
DROP INDEX "target_adjustments_providerId_year_idx";

-- DropIndex
DROP INDEX "wrvu_adjustments_providerId_year_name_key";

-- DropIndex
DROP INDEX "wrvu_adjustments_type_category_idx";

-- DropIndex
DROP INDEX "wrvu_adjustments_providerId_year_idx";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "ProviderSettings";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "additional_payments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "adjustment_reports";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "monthly_metrics";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "provider_metrics";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "target_adjustments";
PRAGMA foreign_keys=on;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "wrvu_adjustments";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WRVUAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdditionalPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_CompensationChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveDate" DATETIME NOT NULL,
    "previousSalary" REAL NOT NULL,
    "newSalary" REAL NOT NULL,
    "previousFTE" REAL NOT NULL,
    "newFTE" REAL NOT NULL,
    "previousConversionFactor" REAL NOT NULL,
    "newConversionFactor" REAL NOT NULL,
    "reason" TEXT,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompensationChange_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompensationChange" ("createdAt", "effectiveDate", "id", "newFTE", "newSalary", "previousFTE", "previousSalary", "providerId", "reason", "updatedAt") SELECT "createdAt", "effectiveDate", "id", "newFTE", "newSalary", "previousFTE", "previousSalary", "providerId", "reason", "updatedAt" FROM "CompensationChange";
DROP TABLE "CompensationChange";
ALTER TABLE "new_CompensationChange" RENAME TO "CompensationChange";
CREATE INDEX "CompensationChange_providerId_effectiveDate_idx" ON "CompensationChange"("providerId", "effectiveDate");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WRVUAdjustment_providerId_year_month_idx" ON "WRVUAdjustment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "TargetAdjustment_providerId_year_month_idx" ON "TargetAdjustment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "AdditionalPayment_providerId_year_month_idx" ON "AdditionalPayment"("providerId", "year", "month");
