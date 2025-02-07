-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "terminationDate" DATETIME,
    "hireDate" DATETIME NOT NULL,
    "yearsOfExperience" REAL NOT NULL DEFAULT 0,
    "fte" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "compensationModel" TEXT NOT NULL,
    "clinicalFte" REAL NOT NULL DEFAULT 0,
    "nonClinicalFte" REAL NOT NULL DEFAULT 0,
    "clinicalSalary" REAL NOT NULL DEFAULT 0,
    "nonClinicalSalary" REAL NOT NULL DEFAULT 0,
    "targetWRVUs" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "CompensationChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveDate" DATETIME NOT NULL,
    "previousSalary" REAL NOT NULL,
    "newSalary" REAL NOT NULL,
    "previousFTE" REAL NOT NULL,
    "newFTE" REAL NOT NULL,
    "previousConversionFactor" REAL NOT NULL,
    "newConversionFactor" REAL NOT NULL,
    "reason" TEXT,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompensationChange_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WRVUAdjustment" (
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

-- CreateTable
CREATE TABLE "TargetAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdditionalPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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
    CONSTRAINT "MarketDataHistory_marketDataId_fkey" FOREIGN KEY ("marketDataId") REFERENCES "market_data" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "market_data" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "specialty" TEXT NOT NULL,
    "p25_total" REAL NOT NULL,
    "p50_total" REAL NOT NULL,
    "p75_total" REAL NOT NULL,
    "p90_total" REAL NOT NULL,
    "p25_wrvu" REAL NOT NULL,
    "p50_wrvu" REAL NOT NULL,
    "p75_wrvu" REAL NOT NULL,
    "p90_wrvu" REAL NOT NULL,
    "p25_cf" REAL NOT NULL,
    "p50_cf" REAL NOT NULL,
    "p75_cf" REAL NOT NULL,
    "p90_cf" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "WRVUData" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "value" REAL NOT NULL,
    "hours" REAL NOT NULL DEFAULT 0,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUData_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

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

-- CreateTable
CREATE TABLE "ProviderMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "actualWRVUs" REAL NOT NULL,
    "rawMonthlyWRVUs" REAL NOT NULL,
    "ytdWRVUs" REAL NOT NULL,
    "ytdTargetWRVUs" REAL NOT NULL,
    "targetWRVUs" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "totalCompensation" REAL NOT NULL,
    "incentivesEarned" REAL NOT NULL,
    "holdbackAmount" REAL NOT NULL,
    "wrvuPercentile" REAL NOT NULL,
    "compPercentile" REAL NOT NULL,
    "planProgress" REAL NOT NULL,
    "monthsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderMetrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderAnalytics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "ytdProgress" REAL NOT NULL,
    "ytdTargetProgress" REAL NOT NULL,
    "incentivePercentage" REAL NOT NULL,
    "clinicalUtilization" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderAnalytics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdditionalPay" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPay_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ProviderSettings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "holdbackPercent" REAL NOT NULL DEFAULT 20,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderSettings_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TieredCFConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "thresholdType" TEXT NOT NULL DEFAULT 'WRVU',
    "status" TEXT NOT NULL DEFAULT 'Active',
    "effectiveDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Tier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "wrvuThreshold" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "configId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Tier_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TieredCFConfig" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TierConfigHistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "configId" TEXT NOT NULL,
    "changeType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    CONSTRAINT "TierConfigHistory_configId_fkey" FOREIGN KEY ("configId") REFERENCES "TieredCFConfig" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "providers_employeeId_key" ON "providers"("employeeId");

-- CreateIndex
CREATE INDEX "CompensationChange_providerId_effectiveDate_idx" ON "CompensationChange"("providerId", "effectiveDate");

-- CreateIndex
CREATE INDEX "WRVUAdjustment_providerId_year_month_idx" ON "WRVUAdjustment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "TargetAdjustment_providerId_year_month_idx" ON "TargetAdjustment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "AdditionalPayment_providerId_year_month_idx" ON "AdditionalPayment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "MarketDataHistory_marketDataId_idx" ON "MarketDataHistory"("marketDataId");

-- CreateIndex
CREATE INDEX "MarketDataHistory_changedAt_idx" ON "MarketDataHistory"("changedAt");

-- CreateIndex
CREATE UNIQUE INDEX "market_data_specialty_key" ON "market_data"("specialty");

-- CreateIndex
CREATE INDEX "WRVUData_providerId_year_idx" ON "WRVUData"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "WRVUData_providerId_year_month_key" ON "WRVUData"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "ProviderMetrics_providerId_year_idx" ON "ProviderMetrics"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderMetrics_providerId_year_month_key" ON "ProviderMetrics"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "ProviderAnalytics_providerId_year_idx" ON "ProviderAnalytics"("providerId", "year");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderAnalytics_providerId_year_month_key" ON "ProviderAnalytics"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "AdditionalPay_month_idx" ON "AdditionalPay"("month");

-- CreateIndex
CREATE INDEX "AdditionalPay_year_idx" ON "AdditionalPay"("year");

-- CreateIndex
CREATE INDEX "AdditionalPay_providerId_idx" ON "AdditionalPay"("providerId");

-- CreateIndex
CREATE UNIQUE INDEX "ProviderSettings_providerId_key" ON "ProviderSettings"("providerId");

-- CreateIndex
CREATE INDEX "Tier_configId_idx" ON "Tier"("configId");

-- CreateIndex
CREATE INDEX "TierConfigHistory_configId_idx" ON "TierConfigHistory"("configId");

-- CreateIndex
CREATE INDEX "TierConfigHistory_changedAt_idx" ON "TierConfigHistory"("changedAt");
