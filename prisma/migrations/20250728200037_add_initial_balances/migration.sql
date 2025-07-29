-- CreateTable
CREATE TABLE "initial_balances" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "initial_balances_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "initial_balances_companyId_idx" ON "initial_balances"("companyId");

-- CreateIndex
CREATE INDEX "initial_balances_accountType_idx" ON "initial_balances"("accountType");

-- CreateIndex
CREATE INDEX "initial_balances_currency_idx" ON "initial_balances"("currency");

-- CreateIndex
CREATE UNIQUE INDEX "initial_balances_accountId_accountType_key" ON "initial_balances"("accountId", "accountType");

-- AddForeignKey
ALTER TABLE "initial_balances" ADD CONSTRAINT "initial_balances_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
