/*
  Warnings:

  - Added the required column `updatedAt` to the `Tier` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "wrvuThreshold" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "configId" TEXT NOT NULL,
    CONSTRAINT "Tier_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TierConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Tier" ("configId", "conversionFactor", "description", "id", "name", "wrvuThreshold") SELECT "configId", "conversionFactor", "description", "id", "name", "wrvuThreshold" FROM "Tier";
DROP TABLE "Tier";
ALTER TABLE "new_Tier" RENAME TO "Tier";
CREATE INDEX "Tier_configId_idx" ON "Tier"("configId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
