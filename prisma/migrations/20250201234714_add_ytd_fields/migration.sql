-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProviderMetrics" (
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
    "ytdIncentives" REAL NOT NULL DEFAULT 0,
    "ytdAdditionalPay" REAL NOT NULL DEFAULT 0,
    "ytdBase" REAL NOT NULL DEFAULT 0,
    "wrvuPercentile" REAL NOT NULL,
    "compPercentile" REAL NOT NULL,
    "planProgress" REAL NOT NULL,
    "monthsCompleted" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ProviderMetrics_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_ProviderMetrics" ("actualWRVUs", "baseSalary", "compPercentile", "createdAt", "holdbackAmount", "id", "incentivesEarned", "month", "monthsCompleted", "planProgress", "providerId", "rawMonthlyWRVUs", "targetWRVUs", "totalCompensation", "updatedAt", "wrvuPercentile", "year", "ytdIncentives", "ytdTargetWRVUs", "ytdWRVUs") SELECT "actualWRVUs", "baseSalary", "compPercentile", "createdAt", "holdbackAmount", "id", "incentivesEarned", "month", "monthsCompleted", "planProgress", "providerId", "rawMonthlyWRVUs", "targetWRVUs", "totalCompensation", "updatedAt", "wrvuPercentile", "year", "ytdIncentives", "ytdTargetWRVUs", "ytdWRVUs" FROM "ProviderMetrics";
DROP TABLE "ProviderMetrics";
ALTER TABLE "new_ProviderMetrics" RENAME TO "ProviderMetrics";
CREATE INDEX "ProviderMetrics_providerId_year_idx" ON "ProviderMetrics"("providerId", "year");
CREATE UNIQUE INDEX "ProviderMetrics_providerId_year_month_key" ON "ProviderMetrics"("providerId", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
