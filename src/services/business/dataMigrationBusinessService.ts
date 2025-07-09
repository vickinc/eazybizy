import { BookkeepingBusinessService } from './bookkeepingBusinessService';
import { ChartOfAccountsBusinessService } from './chartOfAccountsBusinessService';
import { BookkeepingStorageService } from '../storage';
import { Income, Expense, JournalEntry, JournalEntryFormData } from '@/types/bookkeeping.types';
import { ChartOfAccount } from '@/types/chartOfAccounts.types';

export interface MigrationResult {
  success: boolean;
  totalProcessed: number;
  migratedCount: number;
  skippedCount: number;
  errorCount: number;
  errors: string[];
  migratedEntries: JournalEntry[];
}

export interface MigrationOptions {
  includeIncomeEntries: boolean;
  includeExpenseEntries: boolean;
  markAsPosted: boolean;
  deleteOriginalData: boolean;
  companyId?: number;
  dateRange?: {
    start: string;
    end: string;
  };
}

export class DataMigrationBusinessService {
  /**
   * Migrates income and expense entries to journal entries
   */
  static async migrateToJournalEntries(options: MigrationOptions): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      totalProcessed: 0,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      migratedEntries: []
    };

    try {
      // Get chart of accounts for mapping
      const chartOfAccounts = ChartOfAccountsBusinessService.getAllAccounts();
      
      // Migrate income entries
      if (options.includeIncomeEntries) {
        const incomeResult = await this.migrateIncomeEntries(options, chartOfAccounts);
        this.mergeResults(result, incomeResult);
      }

      // Migrate expense entries
      if (options.includeExpenseEntries) {
        const expenseResult = await this.migrateExpenseEntries(options, chartOfAccounts);
        this.mergeResults(result, expenseResult);
      }

      // Delete original data if requested
      if (options.deleteOriginalData && result.migratedCount > 0) {
        this.cleanupOriginalData(options);
      }

      result.success = result.errorCount === 0 || result.migratedCount > 0;
      
    } catch (error) {
      result.errors.push(`Migration failed: ${(error as Error).message}`);
      result.errorCount++;
    }

    return result;
  }

  /**
   * Migrates income entries to journal entries
   */
  private static async migrateIncomeEntries(
    options: MigrationOptions, 
    chartOfAccounts: ChartOfAccount[]
  ): Promise<Partial<MigrationResult>> {
    const result: Partial<MigrationResult> = {
      totalProcessed: 0,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      migratedEntries: []
    };

    try {
      // Get all income entries (filter bookkeeping entries by type)
      let incomeEntries = BookkeepingStorageService.getAll().filter(entry => entry.type === 'income') as Income[];
      
      // Filter by company if specified
      if (options.companyId !== undefined) {
        incomeEntries = incomeEntries.filter(entry => entry.companyId === options.companyId);
      }

      // Filter by date range if specified
      if (options.dateRange) {
        incomeEntries = incomeEntries.filter(entry => 
          entry.date >= options.dateRange!.start && entry.date <= options.dateRange!.end
        );
      }

      result.totalProcessed = incomeEntries.length;

      for (const income of incomeEntries) {
        try {
          const journalEntry = this.convertIncomeToJournalEntry(income, chartOfAccounts, options);
          if (journalEntry) {
            const createdEntry = BookkeepingBusinessService.createJournalEntry(journalEntry);
            result.migratedEntries!.push(createdEntry);
            result.migratedCount!++;
          } else {
            result.skippedCount!++;
            result.errors!.push(`Skipped income entry ${income.id}: Unable to map accounts`);
          }
        } catch (error) {
          result.errorCount!++;
          result.errors!.push(`Error migrating income ${income.id}: ${(error as Error).message}`);
        }
      }

    } catch (error) {
      result.errors!.push(`Error processing income entries: ${(error as Error).message}`);
      result.errorCount!++;
    }

    return result;
  }

  /**
   * Migrates expense entries to journal entries
   */
  private static async migrateExpenseEntries(
    options: MigrationOptions, 
    chartOfAccounts: ChartOfAccount[]
  ): Promise<Partial<MigrationResult>> {
    const result: Partial<MigrationResult> = {
      totalProcessed: 0,
      migratedCount: 0,
      skippedCount: 0,
      errorCount: 0,
      errors: [],
      migratedEntries: []
    };

    try {
      // Get all expense entries (filter bookkeeping entries by type)
      let expenseEntries = BookkeepingStorageService.getAll().filter(entry => entry.type === 'expense') as Expense[];
      
      // Filter by company if specified
      if (options.companyId !== undefined) {
        expenseEntries = expenseEntries.filter(entry => entry.companyId === options.companyId);
      }

      // Filter by date range if specified
      if (options.dateRange) {
        expenseEntries = expenseEntries.filter(entry => 
          entry.date >= options.dateRange!.start && entry.date <= options.dateRange!.end
        );
      }

      result.totalProcessed! += expenseEntries.length;

      for (const expense of expenseEntries) {
        try {
          const journalEntry = this.convertExpenseToJournalEntry(expense, chartOfAccounts, options);
          if (journalEntry) {
            const createdEntry = BookkeepingBusinessService.createJournalEntry(journalEntry);
            result.migratedEntries!.push(createdEntry);
            result.migratedCount!++;
          } else {
            result.skippedCount!++;
            result.errors!.push(`Skipped expense entry ${expense.id}: Unable to map accounts`);
          }
        } catch (error) {
          result.errorCount!++;
          result.errors!.push(`Error migrating expense ${expense.id}: ${(error as Error).message}`);
        }
      }

    } catch (error) {
      result.errors!.push(`Error processing expense entries: ${(error as Error).message}`);
      result.errorCount!++;
    }

    return result;
  }

  /**
   * Converts an income entry to journal entry format
   */
  private static convertIncomeToJournalEntry(
    income: Income, 
    chartOfAccounts: ChartOfAccount[],
    options: MigrationOptions
  ): JournalEntryFormData | null {
    // Find accounts for mapping
    const bankAccount = this.findAccountByType(chartOfAccounts, 'asset', 'bank');
    const revenueAccount = this.findAccountByCode(chartOfAccounts, income.category) || 
                          this.findAccountByType(chartOfAccounts, 'revenue');

    if (!bankAccount || !revenueAccount) {
      return null;
    }

    return {
      date: income.date,
      description: `Income: ${income.description}`,
      reference: income.invoiceNumber || `INC-${income.id}`,
      lines: [
        {
          accountId: bankAccount.id,
          description: `Received payment - ${income.description}`,
          debitAmount: income.amount,
          creditAmount: 0
        },
        {
          accountId: revenueAccount.id,
          description: `Revenue - ${income.description}`,
          debitAmount: 0,
          creditAmount: income.amount
        }
      ],
      companyId: income.companyId,
      status: options.markAsPosted ? 'posted' : 'draft',
      source: 'auto-income'
    };
  }

  /**
   * Converts an expense entry to journal entry format
   */
  private static convertExpenseToJournalEntry(
    expense: Expense, 
    chartOfAccounts: ChartOfAccount[],
    options: MigrationOptions
  ): JournalEntryFormData | null {
    // Find accounts for mapping
    const expenseAccount = this.findAccountByCode(chartOfAccounts, expense.category) ||
                          this.findAccountByType(chartOfAccounts, 'expense');
    const bankAccount = this.findAccountByType(chartOfAccounts, 'asset', 'bank');

    if (!expenseAccount || !bankAccount) {
      return null;
    }

    return {
      date: expense.date,
      description: `Expense: ${expense.description}`,
      reference: expense.receipt || `EXP-${expense.id}`,
      lines: [
        {
          accountId: expenseAccount.id,
          description: `Expense - ${expense.description}`,
          debitAmount: expense.amount,
          creditAmount: 0
        },
        {
          accountId: bankAccount.id,
          description: `Payment - ${expense.description}`,
          debitAmount: 0,
          creditAmount: expense.amount
        }
      ],
      companyId: expense.companyId,
      status: options.markAsPosted ? 'posted' : 'draft',
      source: 'auto-expense'
    };
  }

  /**
   * Helper to find account by type and subtype
   */
  private static findAccountByType(
    accounts: ChartOfAccount[], 
    type: string, 
    subtype?: string
  ): ChartOfAccount | undefined {
    return accounts.find(account => 
      account.type === type && 
      (subtype ? account.subtype === subtype : true)
    );
  }

  /**
   * Helper to find account by code or name
   */
  private static findAccountByCode(
    accounts: ChartOfAccount[], 
    codeOrName: string
  ): ChartOfAccount | undefined {
    const searchTerm = codeOrName.toLowerCase();
    return accounts.find(account => 
      account.code.toLowerCase().includes(searchTerm) ||
      account.name.toLowerCase().includes(searchTerm)
    );
  }

  /**
   * Merges partial results into main result
   */
  private static mergeResults(main: MigrationResult, partial: Partial<MigrationResult>): void {
    main.totalProcessed += partial.totalProcessed || 0;
    main.migratedCount += partial.migratedCount || 0;
    main.skippedCount += partial.skippedCount || 0;
    main.errorCount += partial.errorCount || 0;
    main.errors.push(...(partial.errors || []));
    main.migratedEntries.push(...(partial.migratedEntries || []));
  }

  /**
   * Removes original income/expense data after successful migration
   */
  private static cleanupOriginalData(options: MigrationOptions): void {
    try {
      if (options.includeIncomeEntries) {
        // Note: You would need to implement a deleteAll method in storage services
      }

      if (options.includeExpenseEntries) {
        // Note: You would need to implement a deleteAll method in storage services
      }
    } catch (error) {
      console.error('Error cleaning up original data:', error);
    }
  }

  /**
   * Validates migration prerequisites
   */
  static validateMigrationPrerequisites(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      const accounts = ChartOfAccountsBusinessService.getAllAccounts();
      
      // Check for required account types
      const hasAssetAccount = accounts.some(acc => acc.type === 'asset');
      const hasRevenueAccount = accounts.some(acc => acc.type === 'revenue');
      const hasExpenseAccount = accounts.some(acc => acc.type === 'expense');

      if (!hasAssetAccount) {
        errors.push('No asset accounts found. Please create at least one bank/cash account.');
      }
      
      if (!hasRevenueAccount) {
        errors.push('No revenue accounts found. Please create revenue accounts for income categorization.');
      }
      
      if (!hasExpenseAccount) {
        errors.push('No expense accounts found. Please create expense accounts for expense categorization.');
      }

      // Check for bank account specifically
      const hasBankAccount = accounts.some(acc => acc.type === 'asset' && acc.subtype === 'bank');
      if (!hasBankAccount) {
        errors.push('No bank accounts found. Please create at least one bank account for cash transactions.');
      }

    } catch (error) {
      errors.push(`Error validating prerequisites: ${(error as Error).message}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Gets preview of what would be migrated
   */
  static getMigrationPreview(options: MigrationOptions): {
    incomeCount: number;
    expenseCount: number;
    totalAmount: number;
    dateRange: { start: string; end: string } | null;
  } {
    const incomeCount = 0;
    const expenseCount = 0;
    const totalAmount = 0;
    const minDate = '';
    const maxDate = '';

    try {
      if (options.includeIncomeEntries) {
        let incomeEntries = BookkeepingStorageService.getAll().filter(entry => entry.type === 'income') as Income[];
        
        if (options.companyId !== undefined) {
          incomeEntries = incomeEntries.filter(entry => entry.companyId === options.companyId);
        }
        
        if (options.dateRange) {
          incomeEntries = incomeEntries.filter(entry => 
            entry.date >= options.dateRange!.start && entry.date <= options.dateRange!.end
          );
        }

        incomeCount = incomeEntries.length;
        totalAmount += incomeEntries.reduce((sum, entry) => sum + entry.amount, 0);
        
        if (incomeEntries.length > 0) {
          const dates = incomeEntries.map(e => e.date).sort();
          if (!minDate || dates[0] < minDate) minDate = dates[0];
          if (!maxDate || dates[dates.length - 1] > maxDate) maxDate = dates[dates.length - 1];
        }
      }

      if (options.includeExpenseEntries) {
        let expenseEntries = BookkeepingStorageService.getAll().filter(entry => entry.type === 'expense') as Expense[];
        
        if (options.companyId !== undefined) {
          expenseEntries = expenseEntries.filter(entry => entry.companyId === options.companyId);
        }
        
        if (options.dateRange) {
          expenseEntries = expenseEntries.filter(entry => 
            entry.date >= options.dateRange!.start && entry.date <= options.dateRange!.end
          );
        }

        expenseCount = expenseEntries.length;
        totalAmount += expenseEntries.reduce((sum, entry) => sum + entry.amount, 0);
        
        if (expenseEntries.length > 0) {
          const dates = expenseEntries.map(e => e.date).sort();
          if (!minDate || dates[0] < minDate) minDate = dates[0];
          if (!maxDate || dates[dates.length - 1] > maxDate) maxDate = dates[dates.length - 1];
        }
      }

    } catch (error) {
      console.error('Error generating migration preview:', error);
    }

    return {
      incomeCount,
      expenseCount,
      totalAmount,
      dateRange: minDate && maxDate ? { start: minDate, end: maxDate } : null
    };
  }
}