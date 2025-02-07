/*
  Warnings:

  - You are about to drop the `TieredCFConfig` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `createdAt` on the `Tier` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Tier` table. All the data in the column will be lost.
  - You are about to drop the column `changedAt` on the `TierConfigHistory` table. All the data in the column will be lost.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "TieredCFConfig";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "TierConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thresholdType" TEXT NOT NULL DEFAULT 'WRVU',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "effectiveDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "wrvuThreshold" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "description" TEXT,
    "configId" TEXT NOT NULL,
    CONSTRAINT "Tier_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TierConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Tier" ("configId", "conversionFactor", "id", "name", "wrvuThreshold") SELECT "configId", "conversionFactor", "id", "name", "wrvuThreshold" FROM "Tier";
DROP TABLE "Tier";
ALTER TABLE "new_Tier" RENAME TO "Tier";
CREATE TABLE "new_TierConfigHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "TierConfigHistory_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TierConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TierConfigHistory" ("changeType", "changedBy", "configId", "fieldName", "id", "newValue", "oldValue") SELECT "changeType", "changedBy", "configId", "fieldName", "id", "newValue", "oldValue" FROM "TierConfigHistory";
DROP TABLE "TierConfigHistory";
ALTER TABLE "new_TierConfigHistory" RENAME TO "TierConfigHistory";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
