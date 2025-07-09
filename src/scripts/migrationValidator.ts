/**
 * Migration Validator
 * 
 * Validates data integrity after migration and provides detailed reports
 * on the success of the localStorage to PostgreSQL migration.
 */

import { PrismaClient } from '@prisma/client';

interface ValidationResult {
  module: string;
  localStorageCount: number;
  databaseCount: number;
  isValid: boolean;
  issues: string[];
}

interface ValidationSummary {
  totalModules: number;
  validModules: number;
  totalLocalStorageRecords: number;
  totalDatabaseRecords: number;
  overallValid: boolean;
  results: ValidationResult[];
}

class MigrationValidator {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Validate complete migration integrity
   */
  async validateMigration(): Promise<ValidationSummary> {
    
    const results: ValidationResult[] = [];
    
    try {
      await this.prisma.$connect();
      
      // Validate each module
      results.push(await this.validateCompanies());
      results.push(await this.validateChartOfAccounts());
      results.push(await this.validateClients());
      results.push(await this.validateProducts());
      results.push(await this.validateInvoices());
      results.push(await this.validateTransactions());
      results.push(await this.validateBookkeepingEntries());
      
    } catch (error) {
      console.error('💥 Validation error:', error);
    } finally {
      await this.prisma.$disconnect();
    }

    const summary = this.generateSummary(results);
    this.printValidationReport(summary);
    
    return summary;
  }

  /**
   * Validate Companies migration
   */
  private async validateCompanies(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('companies');
    const dbCount = await this.prisma.company.count();
    
    const issues: string[] = [];
    
    // Check basic count match
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check for required fields
    if (dbCount > 0) {
      const companiesWithoutName = await this.prisma.company.count({
        where: { tradingName: { equals: null } }
      });
      
      if (companiesWithoutName > 0) {
        issues.push(`${companiesWithoutName} companies missing trading name`);
      }
    }
    
    return {
      module: 'Companies',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate Chart of Accounts migration
   */
  private async validateChartOfAccounts(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('chartOfAccounts');
    const dbCount = await this.prisma.chartOfAccount.count();
    
    const issues: string[] = [];
    
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check for duplicate codes
    if (dbCount > 0) {
      const duplicateCodes = await this.prisma.$queryRaw`
        SELECT code, COUNT(*) as count 
        FROM "ChartOfAccount" 
        GROUP BY code 
        HAVING COUNT(*) > 1
      ` as any[];
      
      if (duplicateCodes.length > 0) {
        issues.push(`${duplicateCodes.length} duplicate account codes found`);
      }
    }
    
    return {
      module: 'Chart of Accounts',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate Clients migration
   */
  private async validateClients(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('clients');
    const dbCount = await this.prisma.client.count();
    
    const issues: string[] = [];
    
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check for duplicate emails
    if (dbCount > 0) {
      const duplicateEmails = await this.prisma.$queryRaw`
        SELECT email, COUNT(*) as count 
        FROM "Client" 
        WHERE email IS NOT NULL 
        GROUP BY email 
        HAVING COUNT(*) > 1
      ` as any[];
      
      if (duplicateEmails.length > 0) {
        issues.push(`${duplicateEmails.length} duplicate email addresses found`);
      }
    }
    
    return {
      module: 'Clients',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate Products migration
   */
  private async validateProducts(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('products');
    const dbCount = await this.prisma.product.count();
    
    const issues: string[] = [];
    
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check for products with invalid prices
    if (dbCount > 0) {
      const invalidPrices = await this.prisma.product.count({
        where: { price: { lt: 0 } }
      });
      
      if (invalidPrices > 0) {
        issues.push(`${invalidPrices} products with negative prices`);
      }
    }
    
    return {
      module: 'Products',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate Invoices migration
   */
  private async validateInvoices(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('invoices');
    const dbCount = await this.prisma.invoice.count();
    
    const issues: string[] = [];
    
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check invoice items integrity
    const itemsCount = await this.prisma.invoiceItem.count();
    const localItemsCount = localData.reduce((sum, invoice) => 
      sum + (invoice.items?.length || 0), 0
    );
    
    if (localItemsCount !== itemsCount) {
      issues.push(`Items count mismatch: localStorage(${localItemsCount}) vs Database(${itemsCount})`);
    }
    
    // Check for duplicate invoice numbers
    if (dbCount > 0) {
      const duplicateNumbers = await this.prisma.$queryRaw`
        SELECT "invoiceNumber", COUNT(*) as count 
        FROM "Invoice" 
        GROUP BY "invoiceNumber" 
        HAVING COUNT(*) > 1
      ` as any[];
      
      if (duplicateNumbers.length > 0) {
        issues.push(`${duplicateNumbers.length} duplicate invoice numbers found`);
      }
    }
    
    return {
      module: 'Invoices',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate Transactions migration
   */
  private async validateTransactions(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('transactions');
    const dbCount = await this.prisma.transaction.count();
    
    const issues: string[] = [];
    
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check for transactions with invalid amounts
    if (dbCount > 0) {
      const invalidAmounts = await this.prisma.transaction.count({
        where: { amount: { lte: 0 } }
      });
      
      if (invalidAmounts > 0) {
        issues.push(`${invalidAmounts} transactions with invalid amounts`);
      }
    }
    
    return {
      module: 'Transactions',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Validate Bookkeeping Entries migration
   */
  private async validateBookkeepingEntries(): Promise<ValidationResult> {
    const localData = this.getLocalStorageData('bookkeepingEntries');
    const dbCount = await this.prisma.bookkeepingEntry.count();
    
    const issues: string[] = [];
    
    if (localData.length !== dbCount) {
      issues.push(`Count mismatch: localStorage(${localData.length}) vs Database(${dbCount})`);
    }
    
    // Check for entries with invalid amounts
    if (dbCount > 0) {
      const invalidAmounts = await this.prisma.bookkeepingEntry.count({
        where: { amount: { lte: 0 } }
      });
      
      if (invalidAmounts > 0) {
        issues.push(`${invalidAmounts} entries with invalid amounts`);
      }
    }
    
    return {
      module: 'Bookkeeping Entries',
      localStorageCount: localData.length,
      databaseCount: dbCount,
      isValid: issues.length === 0,
      issues
    };
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
   * Generate validation summary
   */
  private generateSummary(results: ValidationResult[]): ValidationSummary {
    const validModules = results.filter(r => r.isValid).length;
    const totalLocalStorageRecords = results.reduce((sum, r) => sum + r.localStorageCount, 0);
    const totalDatabaseRecords = results.reduce((sum, r) => sum + r.databaseCount, 0);
    
    return {
      totalModules: results.length,
      validModules,
      totalLocalStorageRecords,
      totalDatabaseRecords,
      overallValid: validModules === results.length,
      results
    };
  }

  /**
   * Print detailed validation report
   */
  private printValidationReport(summary: ValidationSummary): void {
    
    for (const result of summary.results) {
      const status = result.isValid ? '✅' : '❌';
      const localCount = result.localStorageCount.toString().padStart(5);
      const dbCount = result.databaseCount.toString().padStart(5);
      const match = result.localStorageCount === result.databaseCount ? '✓' : '✗';
      
      
      if (result.issues.length > 0) {
        result.issues.forEach(issue => {
        });
      }
    }
    
    
    const overallStatus = summary.overallValid ? '🎉 VALIDATION PASSED' : '⚠️  VALIDATION ISSUES FOUND';
    
    if (summary.overallValid) {
    } else {
    }
    
  }
}

// Export for use in different environments
export { MigrationValidator };

// CLI execution
if (require.main === module) {
  const validator = new MigrationValidator();
  
  validator.validateMigration()
    .then((summary) => process.exit(summary.overallValid ? 0 : 1))
    .catch(error => {
      console.error('Validation failed:', error);
      process.exit(1);
    });
}