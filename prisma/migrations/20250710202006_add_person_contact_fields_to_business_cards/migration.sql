-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_business_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "personName" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "personEmail" TEXT NOT NULL DEFAULT '',
    "personPhone" TEXT NOT NULL DEFAULT '',
    "qrType" TEXT NOT NULL DEFAULT 'WEBSITE',
    "qrValue" TEXT NOT NULL DEFAULT '',
    "template" TEXT NOT NULL DEFAULT 'MODERN',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "business_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_business_cards" ("companyId", "createdAt", "id", "isArchived", "personName", "position", "qrType", "qrValue", "template", "updatedAt") SELECT "companyId", "createdAt", "id", "isArchived", "personName", "position", "qrType", "qrValue", "template", "updatedAt" FROM "business_cards";
DROP TABLE "business_cards";
ALTER TABLE "new_business_cards" RENAME TO "business_cards";
CREATE INDEX "business_cards_companyId_createdAt_id_idx" ON "business_cards"("companyId", "createdAt", "id");
CREATE INDEX "business_cards_isArchived_createdAt_id_idx" ON "business_cards"("isArchived", "createdAt", "id");
CREATE INDEX "business_cards_template_createdAt_id_idx" ON "business_cards"("template", "createdAt", "id");
CREATE INDEX "business_cards_createdAt_id_idx" ON "business_cards"("createdAt", "id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
