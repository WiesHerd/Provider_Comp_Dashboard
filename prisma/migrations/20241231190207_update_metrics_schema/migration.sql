/*
  Warnings:

  - You are about to drop the `wrvu_data` table. If the table is not empty, all the data it contains will be lost.
  - You are about to alter the column `month` on the `AdditionalPayment` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `month` on the `ProviderAnalytics` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to alter the column `month` on the `ProviderMetrics` table. The data in that column could be lost. The data in that column will be cast from `String` to `Int`.
  - You are about to drop the column `apr` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `aug` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `dec` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `feb` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `jan` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `jul` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `jun` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `mar` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `may` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `nov` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `oct` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `sep` on the `TargetAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `apr` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `aug` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `dec` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `feb` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `jan` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `jul` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `jun` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `mar` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `may` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `nov` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `oct` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `sep` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - Added the required column `month` to the `TargetAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `TargetAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `month` to the `WRVUAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `WRVUAdjustment` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "wrvu_data_providerId_year_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "wrvu_data";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "WRVUData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "hours" REAL NOT NULL DEFAULT 0,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUData_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdditionalPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdditionalPayment" ("amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year") SELECT "amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year" FROM "AdditionalPayment";
DROP TABLE "AdditionalPayment";
ALTER TABLE "new_AdditionalPayment" RENAME TO "AdditionalPayment";
CREATE INDEX "AdditionalPayment_providerId_year_month_idx" ON "AdditionalPayment"("providerId", "year", "month");
CREATE TABLE "new_ProviderAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "ytdProgress" REAL NOT NULL,
    "ytdTargetProgress" REAL NOT NULL,
    "incentivePercentage" REAL NOT NULL,
    "clinicalUtilization" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderAnalytics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProviderAnalytics" ("clinicalUtilization", "createdAt", "id", "incentivePercentage", "month", "providerId", "updatedAt", "year", "ytdProgress", "ytdTargetProgress") SELECT "clinicalUtilization", "createdAt", "id", "incentivePercentage", "month", "providerId", "updatedAt", "year", "ytdProgress", "ytdTargetProgress" FROM "ProviderAnalytics";
DROP TABLE "ProviderAnalytics";
ALTER TABLE "new_ProviderAnalytics" RENAME TO "ProviderAnalytics";
CREATE INDEX "ProviderAnalytics_providerId_year_idx" ON "ProviderAnalytics"("providerId", "year");
CREATE UNIQUE INDEX "ProviderAnalytics_providerId_year_month_key" ON "ProviderAnalytics"("providerId", "year", "month");
CREATE TABLE "new_ProviderMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "actualWRVUs" REAL NOT NULL,
    "targetWRVUs" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "totalCompensation" REAL NOT NULL,
    "incentivesEarned" REAL NOT NULL,
    "holdbackAmount" REAL NOT NULL,
    "wrvuPercentile" REAL NOT NULL,
    "compPercentile" REAL NOT NULL,
    "planProgress" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderMetrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProviderMetrics" ("actualWRVUs", "baseSalary", "compPercentile", "createdAt", "holdbackAmount", "id", "incentivesEarned", "month", "planProgress", "providerId", "targetWRVUs", "totalCompensation", "updatedAt", "wrvuPercentile", "year") SELECT "actualWRVUs", "baseSalary", "compPercentile", "createdAt", "holdbackAmount", "id", "incentivesEarned", "month", "planProgress", "providerId", "targetWRVUs", "totalCompensation", "updatedAt", "wrvuPercentile", "year" FROM "ProviderMetrics";
DROP TABLE "ProviderMetrics";
ALTER TABLE "new_ProviderMetrics" RENAME TO "ProviderMetrics";
CREATE INDEX "ProviderMetrics_providerId_year_idx" ON "ProviderMetrics"("providerId", "year");
CREATE UNIQUE INDEX "ProviderMetrics_providerId_year_month_key" ON "ProviderMetrics"("providerId", "year", "month");
CREATE TABLE "new_TargetAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TargetAdjustment" ("createdAt", "description", "id", "name", "providerId", "updatedAt", "year") SELECT "createdAt", "description", "id", "name", "providerId", "updatedAt", "year" FROM "TargetAdjustment";
DROP TABLE "TargetAdjustment";
ALTER TABLE "new_TargetAdjustment" RENAME TO "TargetAdjustment";
CREATE INDEX "TargetAdjustment_providerId_year_month_idx" ON "TargetAdjustment"("providerId", "year", "month");
CREATE TABLE "new_WRVUAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WRVUAdjustment" ("createdAt", "description", "id", "name", "providerId", "updatedAt", "year") SELECT "createdAt", "description", "id", "name", "providerId", "updatedAt", "year" FROM "WRVUAdjustment";
DROP TABLE "WRVUAdjustment";
ALTER TABLE "new_WRVUAdjustment" RENAME TO "WRVUAdjustment";
CREATE INDEX "WRVUAdjustment_providerId_year_month_idx" ON "WRVUAdjustment"("providerId", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WRVUData_providerId_year_idx" ON "WRVUData"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "WRVUData_providerId_year_month_key" ON "WRVUData"("providerId", "year", "month");
