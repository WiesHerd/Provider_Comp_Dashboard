/*
  Warnings:

  - You are about to drop the column `createdAt` on the `TierConfigHistory` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TierConfigHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    CONSTRAINT "TierConfigHistory_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TierConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TierConfigHistory" ("changeType", "changedBy", "configId", "fieldName", "id", "newValue", "oldValue") SELECT "changeType", "changedBy", "configId", "fieldName", "id", "newValue", "oldValue" FROM "TierConfigHistory";
DROP TABLE "TierConfigHistory";
ALTER TABLE "new_TierConfigHistory" RENAME TO "TierConfigHistory";
CREATE INDEX "TierConfigHistory_configId_idx" ON "TierConfigHistory"("configId");
CREATE INDEX "TierConfigHistory_changedAt_idx" ON "TierConfigHistory"("changedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
