-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_representatives" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "nationality" TEXT NOT NULL,
    "countryOfResidence" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "customRole" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "representatives_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_representatives" ("companyId", "countryOfResidence", "createdAt", "customRole", "dateOfBirth", "email", "firstName", "id", "lastName", "nationality", "phoneNumber", "role", "updatedAt") SELECT "companyId", "countryOfResidence", "createdAt", "customRole", "dateOfBirth", "email", "firstName", "id", "lastName", "nationality", "phoneNumber", "role", "updatedAt" FROM "representatives";
DROP TABLE "representatives";
ALTER TABLE "new_representatives" RENAME TO "representatives";
CREATE INDEX "representatives_companyId_idx" ON "representatives"("companyId");
CREATE TABLE "new_shareholders" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "companyId" INTEGER NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "dateOfBirth" DATETIME,
    "nationality" TEXT NOT NULL,
    "countryOfResidence" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "ownershipPercent" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "shareholders_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_shareholders" ("companyId", "countryOfResidence", "createdAt", "dateOfBirth", "email", "firstName", "id", "lastName", "nationality", "ownershipPercent", "phoneNumber", "updatedAt") SELECT "companyId", "countryOfResidence", "createdAt", "dateOfBirth", "email", "firstName", "id", "lastName", "nationality", "ownershipPercent", "phoneNumber", "updatedAt" FROM "shareholders";
DROP TABLE "shareholders";
ALTER TABLE "new_shareholders" RENAME TO "shareholders";
CREATE INDEX "shareholders_companyId_idx" ON "shareholders"("companyId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
