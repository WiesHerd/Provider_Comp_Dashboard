-- CreateTable
CREATE TABLE "WRVUHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "wrvuDataId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    CONSTRAINT "WRVUHistory_wrvuDataId_fkey" FOREIGN KEY ("wrvuDataId") REFERENCES "WRVUData" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "WRVUHistory_wrvuDataId_idx" ON "WRVUHistory"("wrvuDataId");

-- CreateIndex
CREATE INDEX "WRVUHistory_changedAt_idx" ON "WRVUHistory"("changedAt");
