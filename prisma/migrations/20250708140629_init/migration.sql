-- CreateTable
CREATE TABLE "companies" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "legalName" TEXT NOT NULL,
    "tradingName" TEXT NOT NULL,
    "registrationNo" TEXT NOT NULL,
    "registrationDate" DATETIME NOT NULL,
    "countryOfRegistration" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "businessLicenseNr" TEXT,
    "vatNumber" TEXT,
    "industry" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "logo" TEXT NOT NULL DEFAULT '',
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "xUrl" TEXT,
    "youtubeUrl" TEXT,
    "whatsappNumber" TEXT,
    "telegramNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastLoginAt" DATETIME,
    "passwordHash" TEXT,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "authId" TEXT
);

-- CreateTable
CREATE TABLE "company_memberships" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "company_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "company_memberships_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "userName" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "details" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER,
    "clientType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactPersonName" TEXT,
    "contactPersonPosition" TEXT,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL DEFAULT '',
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "zipCode" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastInvoiceDate" DATETIME,
    "totalInvoiced" REAL NOT NULL DEFAULT 0,
    "totalPaid" REAL NOT NULL DEFAULT 0,
    "registrationNumber" TEXT,
    "vatNumber" TEXT,
    "passportNumber" TEXT,
    "dateOfBirth" DATETIME,
    CONSTRAINT "clients_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "products" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "cost" REAL NOT NULL DEFAULT 0,
    "costCurrency" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "companyId" INTEGER,
    "vendorId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "products_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "products_vendorId_fkey" FOREIGN KEY ("vendorId") REFERENCES "vendors" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vendors" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "companyName" TEXT NOT NULL,
    "contactPerson" TEXT,
    "contactEmail" TEXT NOT NULL,
    "phone" TEXT,
    "website" TEXT,
    "paymentTerms" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "paymentMethod" TEXT NOT NULL,
    "billingAddress" TEXT,
    "itemsServicesSold" TEXT,
    "notes" TEXT,
    "companyRegistrationNr" TEXT,
    "vatNr" TEXT,
    "vendorCountry" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "vendors_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "clientName" TEXT NOT NULL,
    "clientEmail" TEXT NOT NULL,
    "clientAddress" TEXT,
    "subtotal" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "dueDate" DATETIME NOT NULL,
    "issueDate" DATETIME NOT NULL,
    "paidDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "template" TEXT NOT NULL DEFAULT 'professional',
    "taxRate" REAL NOT NULL DEFAULT 0,
    "taxAmount" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL,
    "fromCompanyId" INTEGER NOT NULL,
    "notes" TEXT,
    "clientId" TEXT,
    CONSTRAINT "invoices_fromCompanyId_fkey" FOREIGN KEY ("fromCompanyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "invoice_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "total" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "invoice_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "invoice_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "companyId" INTEGER NOT NULL,
    "accountName" TEXT,
    "bankName" TEXT,
    "bankAddress" TEXT,
    "iban" TEXT,
    "swiftCode" TEXT,
    "accountNumber" TEXT,
    "walletAddress" TEXT,
    "currency" TEXT NOT NULL,
    "details" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "payment_methods_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "payment_method_invoices" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceId" TEXT NOT NULL,
    "paymentMethodId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "payment_method_invoices_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "payment_method_invoices_paymentMethodId_fkey" FOREIGN KEY ("paymentMethodId") REFERENCES "payment_methods" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bank_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "bankName" TEXT NOT NULL,
    "bankAddress" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "iban" TEXT NOT NULL,
    "swiftCode" TEXT NOT NULL,
    "accountNumber" TEXT,
    "accountName" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "notes" TEXT,
    CONSTRAINT "bank_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "digital_wallets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "walletType" TEXT NOT NULL,
    "walletName" TEXT NOT NULL,
    "walletAddress" TEXT NOT NULL,
    "currency" TEXT NOT NULL,
    "currencies" TEXT NOT NULL DEFAULT '',
    "description" TEXT NOT NULL,
    "blockchain" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "notes" TEXT,
    CONSTRAINT "digital_wallets_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bookkeeping_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "subcategory" TEXT,
    "description" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "currency" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "reference" TEXT,
    "notes" TEXT,
    "accountId" TEXT,
    "accountType" TEXT,
    "cogs" REAL NOT NULL DEFAULT 0,
    "cogsPaid" REAL NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "bookkeeping_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "bookkeeping_entries_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "company_accounts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "company_accounts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "accountNumber" TEXT,
    "currency" TEXT NOT NULL,
    "startingBalance" REAL NOT NULL DEFAULT 0,
    "currentBalance" REAL NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "company_accounts_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "date" DATETIME NOT NULL,
    "paidBy" TEXT NOT NULL,
    "paidTo" TEXT NOT NULL,
    "netAmount" REAL NOT NULL,
    "incomingAmount" REAL,
    "outgoingAmount" REAL,
    "currency" TEXT NOT NULL,
    "baseCurrency" TEXT NOT NULL,
    "baseCurrencyAmount" REAL NOT NULL,
    "exchangeRate" REAL,
    "accountId" TEXT NOT NULL,
    "accountType" TEXT NOT NULL,
    "reference" TEXT,
    "category" TEXT,
    "subcategory" TEXT,
    "description" TEXT,
    "notes" TEXT,
    "tags" TEXT NOT NULL DEFAULT '',
    "linkedEntryId" TEXT,
    "linkedEntryType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CLEARED',
    "reconciliationStatus" TEXT NOT NULL DEFAULT 'UNRECONCILED',
    "statementDate" DATETIME,
    "statementReference" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurringPattern" TEXT,
    "parentTransactionId" TEXT,
    "approvalStatus" TEXT NOT NULL DEFAULT 'APPROVED',
    "approvedBy" TEXT,
    "approvedAt" DATETIME,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "deletedAt" DATETIME,
    "deletedBy" TEXT,
    "createdBy" TEXT,
    "updatedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "transactions_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "company_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "bank_accounts" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "digital_wallets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "transactions_linkedEntryId_fkey" FOREIGN KEY ("linkedEntryId") REFERENCES "bookkeeping_entries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_parentTransactionId_fkey" FOREIGN KEY ("parentTransactionId") REFERENCES "transactions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "transactions_updatedBy_fkey" FOREIGN KEY ("updatedBy") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction_attachments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "transactionId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_attachments_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "transactions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_entries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "entryNumber" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "description" TEXT NOT NULL,
    "reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'POSTED',
    "reversedFromId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "journal_entries_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "journal_entries_reversedFromId_fkey" FOREIGN KEY ("reversedFromId") REFERENCES "journal_entries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "journal_entry_lines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "journalEntryId" TEXT NOT NULL,
    "accountCode" TEXT NOT NULL,
    "accountName" TEXT NOT NULL,
    "description" TEXT,
    "debit" REAL NOT NULL DEFAULT 0,
    "credit" REAL NOT NULL DEFAULT 0,
    "reference" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "journal_entry_lines_journalEntryId_fkey" FOREIGN KEY ("journalEntryId") REFERENCES "journal_entries" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calendar_events" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "date" DATETIME NOT NULL,
    "time" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OTHER',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "company" TEXT,
    "participants" TEXT NOT NULL DEFAULT '',
    "companyId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "calendar_events_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "eventId" TEXT,
    "companyId" INTEGER,
    "tags" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "isStandalone" BOOLEAN NOT NULL DEFAULT true,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" DATETIME,
    "isAutoArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "notes_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "calendar_events" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notes_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "business_cards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" INTEGER NOT NULL,
    "personName" TEXT NOT NULL DEFAULT '',
    "position" TEXT NOT NULL DEFAULT '',
    "qrType" TEXT NOT NULL DEFAULT 'WEBSITE',
    "qrValue" TEXT NOT NULL DEFAULT '',
    "template" TEXT NOT NULL DEFAULT 'MODERN',
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "business_cards_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "companies_registrationNo_key" ON "companies"("registrationNo");

-- CreateIndex
CREATE INDEX "companies_createdAt_id_idx" ON "companies"("createdAt", "id");

-- CreateIndex
CREATE INDEX "companies_status_createdAt_id_idx" ON "companies"("status", "createdAt", "id");

-- CreateIndex
CREATE INDEX "companies_industry_createdAt_id_idx" ON "companies"("industry", "createdAt", "id");

-- CreateIndex
CREATE INDEX "companies_legalName_createdAt_id_idx" ON "companies"("legalName", "createdAt", "id");

-- CreateIndex
CREATE INDEX "companies_tradingName_createdAt_id_idx" ON "companies"("tradingName", "createdAt", "id");

-- CreateIndex
CREATE INDEX "companies_status_idx" ON "companies"("status");

-- CreateIndex
CREATE INDEX "companies_industry_idx" ON "companies"("industry");

-- CreateIndex
CREATE INDEX "companies_email_idx" ON "companies"("email");

-- CreateIndex
CREATE INDEX "companies_registrationNo_idx" ON "companies"("registrationNo");

-- CreateIndex
CREATE INDEX "companies_status_industry_idx" ON "companies"("status", "industry");

-- CreateIndex
CREATE INDEX "companies_updatedAt_idx" ON "companies"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_authId_key" ON "users"("authId");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_authId_idx" ON "users"("authId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "company_memberships_userId_idx" ON "company_memberships"("userId");

-- CreateIndex
CREATE INDEX "company_memberships_companyId_idx" ON "company_memberships"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "company_memberships_userId_companyId_key" ON "company_memberships"("userId", "companyId");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_entityType_entityId_idx" ON "audit_logs"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "audit_logs_timestamp_idx" ON "audit_logs"("timestamp");

-- CreateIndex
CREATE INDEX "clients_companyId_createdAt_idx" ON "clients"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "clients_status_createdAt_idx" ON "clients"("status", "createdAt");

-- CreateIndex
CREATE INDEX "clients_email_idx" ON "clients"("email");

-- CreateIndex
CREATE INDEX "clients_name_idx" ON "clients"("name");

-- CreateIndex
CREATE INDEX "clients_industry_idx" ON "clients"("industry");

-- CreateIndex
CREATE INDEX "clients_clientType_idx" ON "clients"("clientType");

-- CreateIndex
CREATE INDEX "clients_companyId_status_idx" ON "clients"("companyId", "status");

-- CreateIndex
CREATE INDEX "clients_createdAt_idx" ON "clients"("createdAt");

-- CreateIndex
CREATE INDEX "clients_updatedAt_idx" ON "clients"("updatedAt");

-- CreateIndex
CREATE INDEX "clients_totalInvoiced_idx" ON "clients"("totalInvoiced");

-- CreateIndex
CREATE INDEX "clients_lastInvoiceDate_idx" ON "clients"("lastInvoiceDate");

-- CreateIndex
CREATE INDEX "products_companyId_createdAt_idx" ON "products"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "products_isActive_createdAt_idx" ON "products"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products"("name");

-- CreateIndex
CREATE INDEX "products_currency_idx" ON "products"("currency");

-- CreateIndex
CREATE INDEX "products_vendorId_idx" ON "products"("vendorId");

-- CreateIndex
CREATE INDEX "products_companyId_isActive_idx" ON "products"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "products_price_idx" ON "products"("price");

-- CreateIndex
CREATE INDEX "products_createdAt_idx" ON "products"("createdAt");

-- CreateIndex
CREATE INDEX "products_updatedAt_idx" ON "products"("updatedAt");

-- CreateIndex
CREATE INDEX "vendors_companyId_createdAt_idx" ON "vendors"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "vendors_isActive_createdAt_idx" ON "vendors"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "vendors_companyName_idx" ON "vendors"("companyName");

-- CreateIndex
CREATE INDEX "vendors_contactEmail_idx" ON "vendors"("contactEmail");

-- CreateIndex
CREATE INDEX "vendors_currency_idx" ON "vendors"("currency");

-- CreateIndex
CREATE INDEX "vendors_paymentMethod_idx" ON "vendors"("paymentMethod");

-- CreateIndex
CREATE INDEX "vendors_companyId_isActive_idx" ON "vendors"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "vendors_createdAt_idx" ON "vendors"("createdAt");

-- CreateIndex
CREATE INDEX "vendors_updatedAt_idx" ON "vendors"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_invoiceNumber_key" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_fromCompanyId_createdAt_idx" ON "invoices"("fromCompanyId", "createdAt");

-- CreateIndex
CREATE INDEX "invoices_status_createdAt_idx" ON "invoices"("status", "createdAt");

-- CreateIndex
CREATE INDEX "invoices_clientId_createdAt_idx" ON "invoices"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "invoices_invoiceNumber_idx" ON "invoices"("invoiceNumber");

-- CreateIndex
CREATE INDEX "invoices_clientName_idx" ON "invoices"("clientName");

-- CreateIndex
CREATE INDEX "invoices_clientEmail_idx" ON "invoices"("clientEmail");

-- CreateIndex
CREATE INDEX "invoices_currency_idx" ON "invoices"("currency");

-- CreateIndex
CREATE INDEX "invoices_dueDate_idx" ON "invoices"("dueDate");

-- CreateIndex
CREATE INDEX "invoices_issueDate_idx" ON "invoices"("issueDate");

-- CreateIndex
CREATE INDEX "invoices_paidDate_idx" ON "invoices"("paidDate");

-- CreateIndex
CREATE INDEX "invoices_totalAmount_idx" ON "invoices"("totalAmount");

-- CreateIndex
CREATE INDEX "invoices_fromCompanyId_status_idx" ON "invoices"("fromCompanyId", "status");

-- CreateIndex
CREATE INDEX "invoices_status_dueDate_idx" ON "invoices"("status", "dueDate");

-- CreateIndex
CREATE INDEX "invoices_createdAt_idx" ON "invoices"("createdAt");

-- CreateIndex
CREATE INDEX "invoices_updatedAt_idx" ON "invoices"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "payment_method_invoices_invoiceId_paymentMethodId_key" ON "payment_method_invoices"("invoiceId", "paymentMethodId");

-- CreateIndex
CREATE INDEX "bank_accounts_companyId_createdAt_idx" ON "bank_accounts"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "bank_accounts_isActive_createdAt_idx" ON "bank_accounts"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "bank_accounts_bankName_idx" ON "bank_accounts"("bankName");

-- CreateIndex
CREATE INDEX "bank_accounts_accountName_idx" ON "bank_accounts"("accountName");

-- CreateIndex
CREATE INDEX "bank_accounts_currency_idx" ON "bank_accounts"("currency");

-- CreateIndex
CREATE INDEX "bank_accounts_iban_idx" ON "bank_accounts"("iban");

-- CreateIndex
CREATE INDEX "bank_accounts_accountNumber_idx" ON "bank_accounts"("accountNumber");

-- CreateIndex
CREATE INDEX "bank_accounts_companyId_isActive_idx" ON "bank_accounts"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "bank_accounts_createdAt_idx" ON "bank_accounts"("createdAt");

-- CreateIndex
CREATE INDEX "bank_accounts_updatedAt_idx" ON "bank_accounts"("updatedAt");

-- CreateIndex
CREATE INDEX "digital_wallets_companyId_createdAt_idx" ON "digital_wallets"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "digital_wallets_isActive_createdAt_idx" ON "digital_wallets"("isActive", "createdAt");

-- CreateIndex
CREATE INDEX "digital_wallets_walletType_createdAt_idx" ON "digital_wallets"("walletType", "createdAt");

-- CreateIndex
CREATE INDEX "digital_wallets_walletName_idx" ON "digital_wallets"("walletName");

-- CreateIndex
CREATE INDEX "digital_wallets_walletAddress_idx" ON "digital_wallets"("walletAddress");

-- CreateIndex
CREATE INDEX "digital_wallets_currency_idx" ON "digital_wallets"("currency");

-- CreateIndex
CREATE INDEX "digital_wallets_blockchain_idx" ON "digital_wallets"("blockchain");

-- CreateIndex
CREATE INDEX "digital_wallets_companyId_isActive_idx" ON "digital_wallets"("companyId", "isActive");

-- CreateIndex
CREATE INDEX "digital_wallets_companyId_walletType_idx" ON "digital_wallets"("companyId", "walletType");

-- CreateIndex
CREATE INDEX "digital_wallets_createdAt_idx" ON "digital_wallets"("createdAt");

-- CreateIndex
CREATE INDEX "digital_wallets_updatedAt_idx" ON "digital_wallets"("updatedAt");

-- CreateIndex
CREATE INDEX "bookkeeping_entries_companyId_date_idx" ON "bookkeeping_entries"("companyId", "date");

-- CreateIndex
CREATE INDEX "bookkeeping_entries_companyId_type_category_idx" ON "bookkeeping_entries"("companyId", "type", "category");

-- CreateIndex
CREATE UNIQUE INDEX "company_accounts_companyId_type_name_key" ON "company_accounts"("companyId", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_linkedEntryId_key" ON "transactions"("linkedEntryId");

-- CreateIndex
CREATE INDEX "transactions_companyId_date_idx" ON "transactions"("companyId", "date");

-- CreateIndex
CREATE INDEX "transactions_companyId_accountId_idx" ON "transactions"("companyId", "accountId");

-- CreateIndex
CREATE INDEX "transactions_companyId_status_reconciliationStatus_idx" ON "transactions"("companyId", "status", "reconciliationStatus");

-- CreateIndex
CREATE INDEX "transactions_companyId_category_subcategory_idx" ON "transactions"("companyId", "category", "subcategory");

-- CreateIndex
CREATE INDEX "transactions_date_currency_idx" ON "transactions"("date", "currency");

-- CreateIndex
CREATE INDEX "transactions_accountId_status_idx" ON "transactions"("accountId", "status");

-- CreateIndex
CREATE INDEX "transactions_linkedEntryId_idx" ON "transactions"("linkedEntryId");

-- CreateIndex
CREATE INDEX "transactions_isDeleted_deletedAt_idx" ON "transactions"("isDeleted", "deletedAt");

-- CreateIndex
CREATE INDEX "transaction_attachments_transactionId_idx" ON "transaction_attachments"("transactionId");

-- CreateIndex
CREATE INDEX "journal_entries_companyId_date_idx" ON "journal_entries"("companyId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "journal_entries_companyId_entryNumber_key" ON "journal_entries"("companyId", "entryNumber");

-- CreateIndex
CREATE INDEX "calendar_events_createdAt_id_idx" ON "calendar_events"("createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_date_createdAt_id_idx" ON "calendar_events"("date", "createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_type_createdAt_id_idx" ON "calendar_events"("type", "createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_priority_createdAt_id_idx" ON "calendar_events"("priority", "createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_companyId_createdAt_id_idx" ON "calendar_events"("companyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_date_type_createdAt_id_idx" ON "calendar_events"("date", "type", "createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_companyId_date_createdAt_id_idx" ON "calendar_events"("companyId", "date", "createdAt", "id");

-- CreateIndex
CREATE INDEX "calendar_events_type_idx" ON "calendar_events"("type");

-- CreateIndex
CREATE INDEX "calendar_events_priority_idx" ON "calendar_events"("priority");

-- CreateIndex
CREATE INDEX "calendar_events_date_idx" ON "calendar_events"("date");

-- CreateIndex
CREATE INDEX "notes_createdAt_id_idx" ON "notes"("createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_eventId_createdAt_id_idx" ON "notes"("eventId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_companyId_createdAt_id_idx" ON "notes"("companyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_priority_createdAt_id_idx" ON "notes"("priority", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_isCompleted_createdAt_id_idx" ON "notes"("isCompleted", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_isStandalone_createdAt_id_idx" ON "notes"("isStandalone", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_companyId_isCompleted_createdAt_id_idx" ON "notes"("companyId", "isCompleted", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_eventId_isCompleted_createdAt_id_idx" ON "notes"("eventId", "isCompleted", "createdAt", "id");

-- CreateIndex
CREATE INDEX "notes_priority_idx" ON "notes"("priority");

-- CreateIndex
CREATE INDEX "notes_isCompleted_idx" ON "notes"("isCompleted");

-- CreateIndex
CREATE INDEX "notes_isStandalone_idx" ON "notes"("isStandalone");

-- CreateIndex
CREATE INDEX "business_cards_companyId_createdAt_id_idx" ON "business_cards"("companyId", "createdAt", "id");

-- CreateIndex
CREATE INDEX "business_cards_isArchived_createdAt_id_idx" ON "business_cards"("isArchived", "createdAt", "id");

-- CreateIndex
CREATE INDEX "business_cards_template_createdAt_id_idx" ON "business_cards"("template", "createdAt", "id");

-- CreateIndex
CREATE INDEX "business_cards_createdAt_id_idx" ON "business_cards"("createdAt", "id");
