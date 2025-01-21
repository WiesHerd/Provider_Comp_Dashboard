-- DropIndex
DROP INDEX "provider_analytics_providerId_year_month_idx";

-- DropIndex
DROP INDEX "provider_analytics_year_month_idx";

-- DropIndex
DROP INDEX "provider_metrics_providerId_year_month_idx";

-- DropIndex
DROP INDEX "provider_metrics_year_month_idx";

-- DropIndex
DROP INDEX "wrvu_data_year_month_idx";

-- DropIndex
DROP INDEX "market_data_specialty_idx";

-- DropIndex
DROP INDEX "providers_terminationDate_idx";

-- DropIndex
DROP INDEX "providers_hireDate_idx";

-- DropIndex
DROP INDEX "providers_status_idx";

-- DropIndex
DROP INDEX "providers_department_idx";

-- DropIndex
DROP INDEX "providers_specialty_idx";

-- CreateTable
CREATE TABLE "MarketDataHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "marketDataId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    CONSTRAINT "MarketDataHistory_marketDataId_fkey" FOREIGN KEY ("marketDataId") REFERENCES "market_data" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "MarketDataHistory_marketDataId_idx" ON "MarketDataHistory"("marketDataId");

-- CreateIndex
CREATE INDEX "MarketDataHistory_changedAt_idx" ON "MarketDataHistory"("changedAt");
