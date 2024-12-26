/*
  Warnings:

  - You are about to alter the column `effectiveDate` on the `CompensationChange` table. The data in that column could be lost. The data in that column will be cast from `String` to `DateTime`.
  - Added the required column `updatedAt` to the `CompensationChange` table without a default value. This is not possible if the table is not empty.
  - Added the required column `fte` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `hireDate` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Made the column `annualWRVUTarget` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `specialty` on table `Provider` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateTable
CREATE TABLE "WRVUAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WRVUAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TargetAdjustment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TargetAdjustment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdditionalPayment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "month" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "providerId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "AdditionalPayment_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
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
    CONSTRAINT "CompensationChange_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Provider" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_CompensationChange" ("conversionFactor", "effectiveDate", "id", "newFTE", "newSalary", "previousFTE", "previousSalary", "providerId", "reason") SELECT "conversionFactor", "effectiveDate", "id", "newFTE", "newSalary", "previousFTE", "previousSalary", "providerId", "reason" FROM "CompensationChange";
DROP TABLE "CompensationChange";
ALTER TABLE "new_CompensationChange" RENAME TO "CompensationChange";
CREATE INDEX "CompensationChange_providerId_effectiveDate_idx" ON "CompensationChange"("providerId", "effectiveDate");
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT,
    "specialty" TEXT NOT NULL,
    "department" TEXT,
    "status" TEXT NOT NULL,
    "contractType" TEXT,
    "compensationModel" TEXT,
    "annualSalary" REAL NOT NULL,
    "annualWRVUTarget" REAL NOT NULL,
    "conversionFactor" REAL NOT NULL,
    "fte" REAL NOT NULL,
    "hireDate" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Provider" ("annualSalary", "annualWRVUTarget", "conversionFactor", "employeeId", "firstName", "id", "lastName", "specialty") SELECT "annualSalary", "annualWRVUTarget", "conversionFactor", "employeeId", "firstName", "id", "lastName", "specialty" FROM "Provider";
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";
CREATE UNIQUE INDEX "Provider_employeeId_key" ON "Provider"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "WRVUAdjustment_providerId_year_month_idx" ON "WRVUAdjustment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "TargetAdjustment_providerId_year_month_idx" ON "TargetAdjustment"("providerId", "year", "month");

-- CreateIndex
CREATE INDEX "AdditionalPayment_providerId_year_month_idx" ON "AdditionalPayment"("providerId", "year", "month");
