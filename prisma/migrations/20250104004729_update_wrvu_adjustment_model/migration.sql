/*
  Warnings:

  - You are about to drop the column `month` on the `WRVUAdjustment` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `WRVUAdjustment` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "WRVUHistory_changedAt_idx";

-- DropIndex
DROP INDEX "WRVUHistory_wrvuDataId_idx";

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_WRVUAdjustment" (
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
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WRVUAdjustment" ("createdAt", "description", "id", "name", "providerId", "updatedAt", "year") SELECT "createdAt", "description", "id", "name", "providerId", "updatedAt", "year" FROM "WRVUAdjustment";
DROP TABLE "WRVUAdjustment";
ALTER TABLE "new_WRVUAdjustment" RENAME TO "WRVUAdjustment";
CREATE INDEX "WRVUAdjustment_providerId_year_idx" ON "WRVUAdjustment"("providerId", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
