-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_MarketDataHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketDataId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    CONSTRAINT "MarketDataHistory_marketDataId_fkey" FOREIGN KEY ("marketDataId") REFERENCES "market_data" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_MarketDataHistory" ("changeType", "changedAt", "changedBy", "fieldName", "id", "marketDataId", "newValue", "oldValue") SELECT "changeType", "changedAt", "changedBy", "fieldName", "id", "marketDataId", "newValue", "oldValue" FROM "MarketDataHistory";
DROP TABLE "MarketDataHistory";
ALTER TABLE "new_MarketDataHistory" RENAME TO "MarketDataHistory";
CREATE INDEX "MarketDataHistory_marketDataId_idx" ON "MarketDataHistory"("marketDataId");
CREATE INDEX "MarketDataHistory_changedAt_idx" ON "MarketDataHistory"("changedAt");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
