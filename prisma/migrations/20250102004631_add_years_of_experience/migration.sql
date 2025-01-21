-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_providers" (
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
INSERT INTO "new_providers" ("baseSalary", "clinicalFte", "clinicalSalary", "compensationModel", "createdAt", "department", "email", "employeeId", "firstName", "fte", "hireDate", "id", "lastName", "nonClinicalFte", "nonClinicalSalary", "specialty", "status", "targetWRVUs", "terminationDate", "updatedAt") SELECT "baseSalary", "clinicalFte", "clinicalSalary", "compensationModel", "createdAt", "department", "email", "employeeId", "firstName", "fte", "hireDate", "id", "lastName", "nonClinicalFte", "nonClinicalSalary", "specialty", "status", "targetWRVUs", "terminationDate", "updatedAt" FROM "providers";
DROP TABLE "providers";
ALTER TABLE "new_providers" RENAME TO "providers";
CREATE UNIQUE INDEX "providers_employeeId_key" ON "providers"("employeeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
