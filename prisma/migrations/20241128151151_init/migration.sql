-- CreateTable
CREATE TABLE "Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "specialty" TEXT,
    "annualSalary" REAL NOT NULL,
    "annualWRVUTarget" REAL,
    "conversionFactor" REAL NOT NULL DEFAULT 45.00
);

-- CreateTable
CREATE TABLE "CompensationChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveDate" TEXT NOT NULL,
    "previousSalary" REAL NOT NULL,
    "newSalary" REAL NOT NULL,
    "previousFTE" REAL NOT NULL,
    "newFTE" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "reason" TEXT,
    "providerId" TEXT NOT NULL,
    CONSTRAINT "CompensationChange_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Provider_employeeId_key" ON "Provider"("employeeId");

-- CreateIndex
CREATE INDEX "CompensationChange_providerId_effectiveDate_idx" ON "CompensationChange"("providerId", "effectiveDate");
