/*
  Warnings:

  - You are about to drop the column `annualSalary` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `annualWRVUTarget` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `contractType` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `conversionFactor` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `current_wrvus` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `monthly_target` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `previous_wrvus` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `tier2_cf` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `tier2_threshold` on the `Provider` table. All the data in the column will be lost.
  - You are about to drop the column `ytd_wrvus` on the `Provider` table. All the data in the column will be lost.
  - Added the required column `baseSalary` to the `Provider` table without a default value. This is not possible if the table is not empty.
  - Made the column `compensationModel` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `department` on table `Provider` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `Provider` required. This step will fail if there are existing NULL values in that column.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Create the new table structure
CREATE TABLE "new_Provider" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "specialty" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "status" TEXT,
    "hireDate" DATETIME NOT NULL,
    "fte" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "compensationModel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy data from old table to new table
INSERT INTO "new_Provider" (
    "id", "employeeId", "firstName", "lastName", "email", 
    "specialty", "department", "status", "hireDate", "fte", 
    "baseSalary", "compensationModel", "createdAt", "updatedAt"
) 
SELECT 
    "id", "employeeId", "firstName", "lastName", 
    COALESCE("email", "firstName" || '.' || "lastName" || '@example.com') as "email",
    "specialty", 
    COALESCE("department", 'Unknown') as "department", 
    "status", "hireDate", "fte",
    "annualSalary" as "baseSalary", 
    COALESCE("compensationModel", 'Standard') as "compensationModel",
    "createdAt", "updatedAt"
FROM "Provider";

-- Drop old table and rename new table
DROP TABLE "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";

-- Recreate indexes
CREATE UNIQUE INDEX "Provider_employeeId_key" ON "Provider"("employeeId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
