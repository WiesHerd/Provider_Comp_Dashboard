/*
  Warnings:

  - Added the required column `rawMonthlyWRVUs` to the `ProviderMetrics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ytdWRVUs` to the `ProviderMetrics` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ProviderMetrics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "providerId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "actualWRVUs" REAL NOT NULL,
    "rawMonthlyWRVUs" REAL NOT NULL DEFAULT 0,
    "ytdWRVUs" REAL NOT NULL DEFAULT 0,
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
INSERT INTO "new_ProviderMetrics" (
    "id", 
    "providerId", 
    "year", 
    "month", 
    "actualWRVUs", 
    "rawMonthlyWRVUs", 
    "ytdWRVUs",
    "targetWRVUs", 
    "baseSalary", 
    "totalCompensation", 
    "incentivesEarned", 
    "holdbackAmount", 
    "wrvuPercentile", 
    "compPercentile", 
    "planProgress", 
    "createdAt", 
    "updatedAt"
) 
SELECT 
    "id", 
    "providerId", 
    "year", 
    "month", 
    "actualWRVUs", 
    "actualWRVUs" as "rawMonthlyWRVUs", 
    "actualWRVUs" as "ytdWRVUs",
    "targetWRVUs", 
    "baseSalary", 
    "totalCompensation", 
    "incentivesEarned", 
    "holdbackAmount", 
    "wrvuPercentile", 
    "compPercentile", 
    "planProgress", 
    "createdAt", 
    "updatedAt" 
FROM "ProviderMetrics";
DROP TABLE "ProviderMetrics";
ALTER TABLE "new_ProviderMetrics" RENAME TO "ProviderMetrics";
CREATE INDEX "ProviderMetrics_providerId_year_idx" ON "ProviderMetrics"("providerId", "year");
CREATE UNIQUE INDEX "ProviderMetrics_providerId_year_month_key" ON "ProviderMetrics"("providerId", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
