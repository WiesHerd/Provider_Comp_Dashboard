/*
  Warnings:

  - You are about to drop the `Provider` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropIndex
DROP INDEX "Provider_employeeId_key";

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Provider";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employee_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT DEFAULT 'Active',
    "hire_date" DATETIME NOT NULL,
    "fte" REAL NOT NULL,
    "base_salary" REAL NOT NULL,
    "compensation_model" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_AdditionalPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_AdditionalPayment" ("amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year") SELECT "amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year" FROM "AdditionalPayment";
DROP TABLE "AdditionalPayment";
ALTER TABLE "new_AdditionalPayment" RENAME TO "AdditionalPayment";
CREATE INDEX "AdditionalPayment_providerId_year_month_idx" ON "AdditionalPayment"("providerId", "year", "month");
CREATE TABLE "new_CompensationChange" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "effectiveDate" DATETIME NOT NULL,
    "previousSalary" REAL NOT NULL,
    "newSalary" REAL NOT NULL,
    "previousFTE" REAL NOT NULL,
    "newFTE" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "reason" TEXT,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CompensationChange_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompensationChange" ("conversionFactor", "createdAt", "effectiveDate", "id", "newFTE", "newSalary", "previousFTE", "previousSalary", "providerId", "reason", "updatedAt") SELECT "conversionFactor", "createdAt", "effectiveDate", "id", "newFTE", "newSalary", "previousFTE", "previousSalary", "providerId", "reason", "updatedAt" FROM "CompensationChange";
DROP TABLE "CompensationChange";
ALTER TABLE "new_CompensationChange" RENAME TO "CompensationChange";
CREATE INDEX "CompensationChange_providerId_effectiveDate_idx" ON "CompensationChange"("providerId", "effectiveDate");
CREATE TABLE "new_TargetAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_TargetAdjustment" ("amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year") SELECT "amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year" FROM "TargetAdjustment";
DROP TABLE "TargetAdjustment";
ALTER TABLE "new_TargetAdjustment" RENAME TO "TargetAdjustment";
CREATE INDEX "TargetAdjustment_providerId_year_month_idx" ON "TargetAdjustment"("providerId", "year", "month");
CREATE TABLE "new_WRVUAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_WRVUAdjustment" ("amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year") SELECT "amount", "createdAt", "id", "month", "name", "providerId", "updatedAt", "year" FROM "WRVUAdjustment";
DROP TABLE "WRVUAdjustment";
ALTER TABLE "new_WRVUAdjustment" RENAME TO "WRVUAdjustment";
CREATE INDEX "WRVUAdjustment_providerId_year_month_idx" ON "WRVUAdjustment"("providerId", "year", "month");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "providers_employee_id_key" ON "providers"("employee_id");
