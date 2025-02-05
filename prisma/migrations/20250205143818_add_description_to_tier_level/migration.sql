-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TierLevel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "wrvuThreshold" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TierLevel_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TieredCFConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TierLevel" ("configId", "conversionFactor", "createdAt", "description", "id", "name", "updatedAt", "wrvuThreshold") SELECT "configId", "conversionFactor", "createdAt", "description", "id", "name", "updatedAt", "wrvuThreshold" FROM "TierLevel";
DROP TABLE "TierLevel";
ALTER TABLE "new_TierLevel" RENAME TO "TierLevel";
CREATE INDEX "TierLevel_configId_idx" ON "TierLevel"("configId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
