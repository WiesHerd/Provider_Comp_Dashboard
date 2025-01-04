/*
  Warnings:

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
  - Added the required column `month` to the `WRVUAdjustment` table without a default value. This is not possible if the table is not empty.
  - Added the required column `value` to the `WRVUAdjustment` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
