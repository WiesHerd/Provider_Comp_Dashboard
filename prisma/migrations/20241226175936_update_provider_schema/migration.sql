-- RedefineTables
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
    "status" TEXT DEFAULT 'Active',
    "hireDate" DATETIME NOT NULL,
    "fte" REAL NOT NULL,
    "baseSalary" REAL NOT NULL,
    "compensationModel" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- Copy data from old table to new table
INSERT OR IGNORE INTO "new_Provider" (
    "id", "employeeId", "firstName", "lastName", "email", 
    "specialty", "department", "status", "hireDate", "fte", 
    "baseSalary", "compensationModel", "createdAt", "updatedAt"
) 
SELECT 
    "id", "employeeId", "firstName", "lastName", "email",
    "specialty", "department", "status", "hireDate", "fte",
    "baseSalary", "compensationModel", "createdAt", "updatedAt"
FROM "Provider";

-- Drop old table and rename new table
DROP TABLE IF EXISTS "Provider";
ALTER TABLE "new_Provider" RENAME TO "Provider";

-- Recreate indexes
CREATE UNIQUE INDEX "Provider_employeeId_key" ON "Provider"("employeeId");

PRAGMA foreign_keys=ON;
