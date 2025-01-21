-- CreateTable
CREATE TABLE "ProviderMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "actualWRVUs" REAL NOT NULL,
    "targetWRVUs" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "totalCompensation" REAL NOT NULL,
    "incentivesEarned" REAL NOT NULL,
    "holdbackAmount" REAL NOT NULL,
    "wrvuPercentile" REAL NOT NULL,
    "compPercentile" REAL NOT NULL,
    "planProgress" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderMetrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "ytdProgress" REAL NOT NULL,
    "ytdTargetProgress" REAL NOT NULL,
    "incentivePercentage" REAL NOT NULL,
    "clinicalUtilization" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderAnalytics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "ProviderMetrics_providerId_year_idx" ON "ProviderMetrics"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderMetrics_providerId_year_month_key" ON "ProviderMetrics"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "ProviderAnalytics_providerId_year_idx" ON "ProviderAnalytics"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAnalytics_providerId_year_month_key" ON "ProviderAnalytics"("providerId", "year", "month");
