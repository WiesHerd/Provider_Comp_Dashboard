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

-- CreateIndex
CREATE UNIQUE INDEX "market_data_specialty_key" ON "market_data"("specialty");
