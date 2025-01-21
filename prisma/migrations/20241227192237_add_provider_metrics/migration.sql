-- CreateTable
CREATE TABLE "provider_metrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "calculatedDate" DATETIME NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "completedMonths" INTEGER NOT NULL,
    "actualWRVUs" REAL NOT NULL,
    "ytdWRVUs" REAL NOT NULL,
    "annualizedWRVUs" REAL NOT NULL,
    "wrvuPercentile" REAL NOT NULL,
    "monthlyCompensation" REAL NOT NULL,
    "ytdCompensation" REAL NOT NULL,
    "annualizedCompensation" REAL NOT NULL,
    "compensationPercentile" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "cfPercentile" REAL NOT NULL,
    "monthlyTarget" REAL NOT NULL,
    "ytdTarget" REAL NOT NULL,
    "wrvuVariance" REAL NOT NULL,
    "currentFTE" REAL NOT NULL,
    "normalizedWRVUs" REAL NOT NULL,
    "compensationModel" TEXT NOT NULL DEFAULT 'standard',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "provider_metrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "provider_metrics_providerId_year_idx" ON "provider_metrics"("providerId", "year");

-- CreateIndex
CREATE INDEX "provider_metrics_calculatedDate_idx" ON "provider_metrics"("calculatedDate");

-- CreateIndex
CREATE UNIQUE INDEX "provider_metrics_providerId_year_month_key" ON "provider_metrics"("providerId", "year", "month");
