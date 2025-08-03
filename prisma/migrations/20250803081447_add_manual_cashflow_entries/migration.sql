/*
  Warnings:

  - You are about to drop the `journal_entries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `journal_entry_lines` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_companyId_fkey";

-- DropForeignKey
ALTER TABLE "journal_entries" DROP CONSTRAINT "journal_entries_reversedFromId_fkey";

-- DropForeignKey
ALTER TABLE "journal_entry_lines" DROP CONSTRAINT "journal_entry_lines_journalEntryId_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transaction_bank_account_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transaction_company_account_fkey";

-- DropForeignKey
ALTER TABLE "transactions" DROP CONSTRAINT "transaction_digital_wallet_fkey";

-- DropTable
DROP TABLE "journal_entries";

-- DropTable
DROP TABLE "journal_entry_lines";

-- CreateTable
CREATE TABLE "manual_cashflow_entries" (
    "id" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manual_cashflow_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_companyId_period_idx" ON "manual_cashflow_entries"("companyId", "period");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_companyId_accountId_idx" ON "manual_cashflow_entries"("companyId", "accountId");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_companyId_type_idx" ON "manual_cashflow_entries"("companyId", "type");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_companyId_createdAt_idx" ON "manual_cashflow_entries"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_accountId_period_idx" ON "manual_cashflow_entries"("accountId", "period");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_accountType_idx" ON "manual_cashflow_entries"("accountType");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_type_idx" ON "manual_cashflow_entries"("type");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_period_idx" ON "manual_cashflow_entries"("period");

-- CreateIndex
CREATE INDEX "manual_cashflow_entries_createdAt_idx" ON "manual_cashflow_entries"("createdAt");

-- AddForeignKey
ALTER TABLE "manual_cashflow_entries" ADD CONSTRAINT "manual_cashflow_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
