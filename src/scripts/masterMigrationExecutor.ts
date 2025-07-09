/**
 * Master Migration Executor
 * 
 * Orchestrates the complete migration from localStorage to PostgreSQL database
 * with comprehensive error handling, progress tracking, and rollback capabilities.
 */

import { PrismaClient } from '@prisma/client';

interface MigrationResult {
  module: string;
  success: boolean;
  recordsMigrated: number;
  errors: string[];
  duration: number;
}

interface MigrationProgress {
  totalModules: number;
  completedModules: number;
  currentModule: string;
  overallProgress: number;
  results: MigrationResult[];
}

class MasterMigrationExecutor {
  private prisma: PrismaClient;
  private progress: MigrationProgress;
  private rollbackData: Map<string, any[]> = new Map();

  constructor() {
    this.prisma = new PrismaClient();
    this.progress = {
      totalModules: 7,
      completedModules: 0,
      currentModule: '',
      overallProgress: 0,
      results: []
    };
  }

  /**
   * Execute complete migration with progress tracking and rollback support
   */
  async executeMigration(): Promise<{success: boolean, results: MigrationResult[]}> {
    
    const migrationModules = [
      { name: 'Companies', migrator: this.migrateCompanies },
      { name: 'Chart of Accounts', migrator: this.migrateChartOfAccounts },
      { name: 'Clients', migrator: this.migrateClients },
      { name: 'Products', migrator: this.migrateProducts },
      { name: 'Invoices', migrator: this.migrateInvoices },
      { name: 'Transactions', migrator: this.migrateTransactions },
      { name: 'Bookkeeping Entries', migrator: this.migrateBookkeepingEntries }
    ];

    const allSuccessful = true;

    try {
      // Connect to database
      await this.prisma.$connect();
      
      for (const module of migrationModules) {
        this.progress.currentModule = module.name;
        
        const startTime = Date.now();
        
        try {
          const result = await module.migrator.call(this);
          const duration = Date.now() - startTime;
          
          this.progress.results.push({
            module: module.name,
            success: true,
            recordsMigrated: result.recordsMigrated,
            errors: [],
            duration
          });
          
          
        } catch (error) {
          const duration = Date.now() - startTime;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          
          this.progress.results.push({
            module: module.name,
            success: false,
            recordsMigrated: 0,
            errors: [errorMessage],
            duration
          });
          
          console.error(`❌ ${module.name}: Migration failed - ${errorMessage}`);
          allSuccessful = false;
        }
        
        this.progress.completedModules++;
        this.progress.overallProgress = (this.progress.completedModules / this.progress.totalModules) * 100;
        
        this.printProgress();
      }

      if (!allSuccessful) {
      }

    } catch (error) {
      console.error('💥 Critical migration error:', error);
      allSuccessful = false;
    } finally {
      await this.prisma.$disconnect();
    }

    this.printFinalSummary();
    
    return {
      success: allSuccessful,
      results: this.progress.results
    };
  }

  /**
   * Rollback migration - restore localStorage data and clear database
   */
  async rollbackMigration(): Promise<void> {
    
    try {
      await this.prisma.$connect();
      
      // Clear database tables in reverse dependency order
      await this.prisma.bookkeepingEntry.deleteMany();
      await this.prisma.transaction.deleteMany();
      await this.prisma.invoiceItem.deleteMany();
      await this.prisma.invoice.deleteMany();
      await this.prisma.product.deleteMany();
      await this.prisma.client.deleteMany();
      await this.prisma.chartOfAccount.deleteMany();
      await this.prisma.company.deleteMany();
      
      
      // Restore localStorage data
      for (const [key, data] of this.rollbackData) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(key, JSON.stringify(data));
        }
      }
      
      
    } catch (error) {
      console.error('❌ Rollback failed:', error);
    } finally {
      await this.prisma.$disconnect();
    }
  }

  /**
   * Migrate Companies
   */
  private async migrateCompanies(): Promise<{recordsMigrated: number}> {
    const storageKey = 'companies';
    const companies = this.getLocalStorageData(storageKey);
    
    if (!companies.length) return { recordsMigrated: 0 };
    
    // Backup for rollback
    this.rollbackData.set(storageKey, companies);
    
    const transformedCompanies = companies.map((company: unknown) => ({
      tradingName: company.tradingName || company.name,
      legalName: company.legalName,
      registrationNumber: company.registrationNumber,
      vatNumber: company.vatNumber,
      address: company.address,
      city: company.city,
      zipCode: company.zipCode,
      country: company.country,
      phone: company.phone,
      email: company.email,
      website: company.website,
      industry: company.industry,
      logo: company.logo,
      notes: company.notes,
      currency: company.currency || 'USD',
      language: company.language || 'en',
      timezone: company.timezone || 'UTC',
      fiscalYearStart: company.fiscalYearStart || '01-01',
      isActive: company.isActive !== false,
      createdAt: company.createdAt ? new Date(company.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    await this.prisma.company.createMany({
      data: transformedCompanies,
      skipDuplicates: true
    });
    
    return { recordsMigrated: transformedCompanies.length };
  }

  /**
   * Migrate Chart of Accounts
   */
  private async migrateChartOfAccounts(): Promise<{recordsMigrated: number}> {
    const storageKey = 'chartOfAccounts';
    const accounts = this.getLocalStorageData(storageKey);
    
    if (!accounts.length) return { recordsMigrated: 0 };
    
    this.rollbackData.set(storageKey, accounts);
    
    const transformedAccounts = accounts.map((account: unknown) => ({
      code: account.code,
      name: account.name,
      type: account.type,
      accountType: account.accountType || 'Detail',
      parentId: account.parentId,
      companyId: account.companyId || 1,
      description: account.description,
      isActive: account.isActive !== false,
      balance: account.balance || 0,
      currency: account.currency || 'USD',
      vat: account.vat || 'Standard',
      createdAt: account.createdAt ? new Date(account.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    await this.prisma.chartOfAccount.createMany({
      data: transformedAccounts,
      skipDuplicates: true
    });
    
    return { recordsMigrated: transformedAccounts.length };
  }

  /**
   * Migrate Clients
   */
  private async migrateClients(): Promise<{recordsMigrated: number}> {
    const storageKey = 'clients';
    const clients = this.getLocalStorageData(storageKey);
    
    if (!clients.length) return { recordsMigrated: 0 };
    
    this.rollbackData.set(storageKey, clients);
    
    const transformedClients = clients.map((client: unknown) => ({
      name: client.name,
      email: client.email,
      phone: client.phone,
      address: client.address,
      city: client.city,
      zipCode: client.zipCode,
      country: client.country,
      website: client.website,
      industry: client.industry,
      companyId: client.companyId || 1,
      clientType: client.clientType || 'Individual',
      contactPersonName: client.contactPersonName,
      contactPersonPosition: client.contactPersonPosition,
      registrationNumber: client.registrationNumber,
      vatNumber: client.vatNumber,
      passportNumber: client.passportNumber,
      dateOfBirth: client.dateOfBirth,
      status: client.status || 'ACTIVE',
      notes: client.notes,
      createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    await this.prisma.client.createMany({
      data: transformedClients,
      skipDuplicates: true
    });
    
    return { recordsMigrated: transformedClients.length };
  }

  /**
   * Migrate Products
   */
  private async migrateProducts(): Promise<{recordsMigrated: number}> {
    const storageKey = 'products';
    const products = this.getLocalStorageData(storageKey);
    
    if (!products.length) return { recordsMigrated: 0 };
    
    this.rollbackData.set(storageKey, products);
    
    const transformedProducts = products.map((product: unknown) => ({
      name: product.name,
      description: product.description,
      price: product.price || 0,
      currency: product.currency || 'USD',
      sku: product.sku,
      category: product.category,
      companyId: product.companyId || 1,
      isActive: product.isActive !== false,
      stockQuantity: product.stockQuantity || 0,
      unit: product.unit || 'piece',
      taxRate: product.taxRate || 0,
      createdAt: product.createdAt ? new Date(product.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    await this.prisma.product.createMany({
      data: transformedProducts,
      skipDuplicates: true
    });
    
    return { recordsMigrated: transformedProducts.length };
  }

  /**
   * Migrate Invoices
   */
  private async migrateInvoices(): Promise<{recordsMigrated: number}> {
    const storageKey = 'invoices';
    const invoices = this.getLocalStorageData(storageKey);
    
    if (!invoices.length) return { recordsMigrated: 0 };
    
    this.rollbackData.set(storageKey, invoices);
    
    // First create invoices
    const transformedInvoices = invoices.map((invoice: unknown) => ({
      invoiceNumber: invoice.invoiceNumber,
      clientId: invoice.clientId,
      clientName: invoice.clientName,
      clientEmail: invoice.clientEmail,
      clientAddress: invoice.clientAddress,
      fromCompanyId: invoice.fromCompanyId || 1,
      subtotal: invoice.subtotal || 0,
      taxRate: invoice.taxRate || 0,
      taxAmount: invoice.taxAmount || 0,
      totalAmount: invoice.totalAmount || 0,
      currency: invoice.currency || 'USD',
      status: invoice.status || 'DRAFT',
      issueDate: invoice.issueDate || new Date().toISOString().split('T')[0],
      dueDate: invoice.dueDate || new Date().toISOString().split('T')[0],
      template: invoice.template || 'standard',
      notes: invoice.notes,
      createdAt: invoice.createdAt ? new Date(invoice.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    const createdInvoices = await Promise.all(
      transformedInvoices.map(invoice => this.prisma.invoice.create({ data: invoice }))
    );
    
    // Then create invoice items
    const itemsCreated = 0;
    for (const i = 0; i < invoices.length; i++) {
      const originalInvoice = invoices[i];
      const createdInvoice = createdInvoices[i];
      
      if (originalInvoice.items?.length) {
        const items = originalInvoice.items.map((item: unknown) => ({
          invoiceId: createdInvoice.id,
          productId: item.productId,
          productName: item.productName || item.name,
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || item.price || 0,
          currency: item.currency || originalInvoice.currency || 'USD',
          total: item.total || (item.quantity * item.unitPrice) || 0
        }));
        
        await this.prisma.invoiceItem.createMany({ data: items });
        itemsCreated += items.length;
      }
    }
    
    return { recordsMigrated: transformedInvoices.length };
  }

  /**
   * Migrate Transactions
   */
  private async migrateTransactions(): Promise<{recordsMigrated: number}> {
    const storageKey = 'transactions';
    const transactions = this.getLocalStorageData(storageKey);
    
    if (!transactions.length) return { recordsMigrated: 0 };
    
    this.rollbackData.set(storageKey, transactions);
    
    const transformedTransactions = transactions.map((transaction: unknown) => ({
      type: transaction.type?.toUpperCase() || 'EXPENSE',
      amount: transaction.amount || 0,
      currency: transaction.currency || 'USD',
      description: transaction.description,
      category: transaction.category,
      subcategory: transaction.subcategory,
      date: transaction.date || new Date().toISOString().split('T')[0],
      companyId: transaction.companyId || 1,
      accountId: transaction.accountId,
      accountType: transaction.accountType || 'BANK',
      reference: transaction.reference,
      status: transaction.status || 'COMPLETED',
      reconciliationStatus: transaction.reconciliationStatus || 'PENDING',
      notes: transaction.notes,
      createdAt: transaction.createdAt ? new Date(transaction.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    await this.prisma.transaction.createMany({
      data: transformedTransactions,
      skipDuplicates: true
    });
    
    return { recordsMigrated: transformedTransactions.length };
  }

  /**
   * Migrate Bookkeeping Entries
   */
  private async migrateBookkeepingEntries(): Promise<{recordsMigrated: number}> {
    const storageKey = 'bookkeepingEntries';
    const entries = this.getLocalStorageData(storageKey);
    
    if (!entries.length) return { recordsMigrated: 0 };
    
    this.rollbackData.set(storageKey, entries);
    
    const transformedEntries = entries.map((entry: unknown) => ({
      type: entry.type?.toUpperCase() || 'EXPENSE',
      category: entry.category,
      subcategory: entry.subcategory,
      description: entry.description,
      amount: entry.amount || 0,
      currency: entry.currency || 'USD',
      date: entry.date || new Date().toISOString().split('T')[0],
      companyId: entry.companyId || 1,
      reference: entry.reference,
      notes: entry.notes,
      accountId: entry.accountId,
      accountType: entry.accountType || 'BANK',
      chartOfAccountsId: entry.chartOfAccountsId,
      createdAt: entry.createdAt ? new Date(entry.createdAt) : new Date(),
      updatedAt: new Date()
    }));
    
    await this.prisma.bookkeepingEntry.createMany({
      data: transformedEntries,
      skipDuplicates: true
    });
    
    return { recordsMigrated: transformedEntries.length };
  }

  /**
   * Helper method to get localStorage data
   */
  private getLocalStorageData(key: string): unknown[] {
    if (typeof window === 'undefined') {
      console.warn(`⚠️  Cannot access localStorage for ${key} (server environment)`);
      return [];
    }
    
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.warn(`⚠️  Failed to parse localStorage data for ${key}:`, error);
      return [];
    }
  }

  /**
   * Print migration progress
   */
  private printProgress(): void {
    const progressBar = '█'.repeat(Math.floor(this.progress.overallProgress / 10)) + 
                       '░'.repeat(10 - Math.floor(this.progress.overallProgress / 10));
    
  }

  /**
   * Print final migration summary
   */
  private printFinalSummary(): void {
    
    const totalMigrated = 0;
    const successfulModules = 0;
    
    for (const result of this.progress.results) {
      const status = result.success ? '✅' : '❌';
      const duration = `${result.duration}ms`;
      
      
      if (result.success) {
        totalMigrated += result.recordsMigrated;
        successfulModules++;
      } else {
        result.errors.forEach(error => console.log(`   Error: ${error}`));
      }
    }
    
    
    const overallSuccess = successfulModules === this.progress.totalModules;
    
    if (overallSuccess) {
    } else {
      console.log('   1. Review error messages above');
    }
    
  }
}

// Export for use in different environments
export { MasterMigrationExecutor };

// CLI execution
if (require.main === module) {
  const executor = new MasterMigrationExecutor();
  
  const args = process.argv.slice(2);
  const command = args[0];
  
  if (command === 'rollback') {
    executor.rollbackMigration()
      .then(() => process.exit(0))
      .catch(error => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    executor.executeMigration()
      .then(({ success }) => process.exit(success ? 0 : 1))
      .catch(error => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  }
}