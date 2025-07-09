import { BookkeepingEntry, CompanyAccount } from '@/types';

const BOOKKEEPING_ENTRIES_KEY = 'app-bookkeeping-entries';
const BOOKKEEPING_ACCOUNTS_KEY = 'app-bookkeeping-accounts';

interface IntegrityCheckResult {
  isValid: boolean;
  issues: string[];
  entriesBefore: number;
  entriesAfter: number;
  expensesBefore: number;
  expensesAfter: number;
}

export class BookkeepingStorageService {
  static getEntries(): BookkeepingEntry[] {
    try {
      const savedEntries = localStorage.getItem(BOOKKEEPING_ENTRIES_KEY);
      if (savedEntries) {
        const parsed = JSON.parse(savedEntries);
        
        // Handle case where entries might be stored as an object
        let entries: BookkeepingEntry[];
        if (Array.isArray(parsed)) {
          entries = parsed;
        } else if (parsed && typeof parsed === 'object') {
          // If it's an object, try to extract array values
          entries = Object.values(parsed);
          console.warn('Bookkeeping entries were stored as object, converting to array');
        } else {
          console.error('Invalid bookkeeping entries format:', typeof parsed);
          return [];
        }
        
        return this.migrateEntriesWithIntegrityCheck(entries);
      }
    } catch (error) {
      console.error('Error loading bookkeeping entries from localStorage:', error);
    }
    return [];
  }

  static saveEntries(entries: BookkeepingEntry[]): boolean {
    try {
      // Validate entries before saving
      const validation = this.validateEntriesBeforeSave(entries);
      if (!validation.isValid) {
        console.error('Validation failed before saving entries:', validation.issues);
        // Still save but log the issues
        validation.issues.forEach(issue => console.warn('⚠️', issue));
      }

      // Ensure we're saving as an array
      if (!Array.isArray(entries)) {
        console.error('Attempted to save non-array entries format');
        return false;
      }

      localStorage.setItem(BOOKKEEPING_ENTRIES_KEY, JSON.stringify(entries));
      window.dispatchEvent(new StorageEvent('storage', {
        key: BOOKKEEPING_ENTRIES_KEY,
        newValue: JSON.stringify(entries),
        storageArea: localStorage,
      }));
      
      // Log successful save with statistics
      const stats = this.getEntriesStatistics(entries);
      
      return true;
    } catch (error) {
      console.error('Error saving bookkeeping entries to localStorage:', error);
      return false;
    }
  }

  static getAccounts(): CompanyAccount[] {
    try {
      const savedAccounts = localStorage.getItem(BOOKKEEPING_ACCOUNTS_KEY);
      if (savedAccounts) {
        const parsed = JSON.parse(savedAccounts);
        
        // Handle case where accounts might be stored as an object
        if (Array.isArray(parsed)) {
          return parsed as CompanyAccount[];
        } else if (parsed && typeof parsed === 'object') {
          // If it's an object, try to extract array values
          console.warn('Bookkeeping accounts were stored as object, converting to array');
          return Object.values(parsed) as CompanyAccount[];
        } else {
          console.error('Invalid bookkeeping accounts format:', typeof parsed);
          return [];
        }
      }
    } catch (error) {
      console.error('Error loading bookkeeping accounts from localStorage:', error);
    }
    return [];
  }

  static saveAccounts(accounts: CompanyAccount[]): boolean {
    try {
      localStorage.setItem(BOOKKEEPING_ACCOUNTS_KEY, JSON.stringify(accounts));
      window.dispatchEvent(new StorageEvent('storage', {
        key: BOOKKEEPING_ACCOUNTS_KEY,
        newValue: JSON.stringify(accounts),
        storageArea: localStorage,
      }));
      return true;
    } catch (error) {
      console.error('Error saving bookkeeping accounts to localStorage:', error);
      return false;
    }
  }

  private static migrateEntries(entries: BookkeepingEntry[]): BookkeepingEntry[] {
    // Ensure entries is an array
    if (!Array.isArray(entries)) {
      console.error('Invalid entries format, expected array but got:', typeof entries);
      return [];
    }
    
    return entries.map((entry: unknown) => {
      // Fix COGS entries and round to 2 decimal places
      if (entry.type === 'income' && entry.isFromInvoice) {
        return {
          ...entry,
          cogs: entry.cogs ? this.roundToTwoDecimals(entry.cogs) : 0,
          cogsPaid: entry.cogsPaid ? this.roundToTwoDecimals(entry.cogsPaid) : 0
        };
      }
      return entry;
    }).filter((entry: unknown) => {
      // Remove old auto-generated COGS entries (legacy cleanup)
      // Only filter out entries that have type 'cogs' (not 'expense')
      if (entry.type === 'cogs' && entry.isFromInvoice) {
        return false;
      }
      return true;
    });
  }

  private static roundToTwoDecimals(num: number): number {
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }

  /**
   * Enhanced migration with integrity checking
   */
  private static migrateEntriesWithIntegrityCheck(entries: BookkeepingEntry[]): BookkeepingEntry[] {
    // Ensure entries is an array
    if (!Array.isArray(entries)) {
      console.error('Invalid entries format, expected array but got:', typeof entries);
      return [];
    }

    // Get statistics before migration
    const beforeStats = this.getEntriesStatistics(entries);
    
    // Perform the migration
    const migratedEntries = this.migrateEntries(entries);
    
    // Get statistics after migration
    const afterStats = this.getEntriesStatistics(migratedEntries);
    
    // Check for potential data loss
    const integrityCheck: IntegrityCheckResult = {
      isValid: true,
      issues: [],
      entriesBefore: beforeStats.total,
      entriesAfter: afterStats.total,
      expensesBefore: beforeStats.expenses,
      expensesAfter: afterStats.expenses
    };

    if (afterStats.total < beforeStats.total) {
      const lostEntries = beforeStats.total - afterStats.total;
      integrityCheck.isValid = false;
      integrityCheck.issues.push(`⚠️ Lost ${lostEntries} entries during migration`);
    }

    if (afterStats.expenses < beforeStats.expenses) {
      const lostExpenses = beforeStats.expenses - afterStats.expenses;
      integrityCheck.isValid = false;
      integrityCheck.issues.push(`❗ Lost ${lostExpenses} expense entries during migration`);
    }

    // Log the results
    if (!integrityCheck.isValid) {
      console.error('🚨 Data integrity issues detected during migration:', integrityCheck);
      integrityCheck.issues.forEach(issue => console.error(issue));
    } else {
      // console.log('✅ Migration completed successfully:', {
      //   entriesProcessed: afterStats.total,
      //   expensesRetained: afterStats.expenses,
      //   incomeRetained: afterStats.income
      // });
    }

    return migratedEntries;
  }

  /**
   * Get statistics about entries array
   */
  private static getEntriesStatistics(entries: unknown[]): {
    total: number;
    expenses: number;
    income: number;
    cogs: number;
    invalid: number;
  } {
    const stats = {
      total: entries.length,
      expenses: 0,
      income: 0,
      cogs: 0,
      invalid: 0
    };

    entries.forEach(entry => {
      if (!entry || typeof entry !== 'object') {
        stats.invalid++;
        return;
      }

      switch (entry.type) {
        case 'expense':
          stats.expenses++;
          break;
        case 'income':
          stats.income++;
          break;
        case 'cogs':
          stats.cogs++;
          break;
        default:
          stats.invalid++;
      }
    });

    return stats;
  }

  /**
   * Validate entries before saving
   */
  private static validateEntriesBeforeSave(entries: BookkeepingEntry[]): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    if (!Array.isArray(entries)) {
      issues.push('Entries is not an array');
      return { isValid: false, issues };
    }

    const stats = this.getEntriesStatistics(entries);
    
    // Check for suspicious patterns
    if (stats.income > 0 && stats.expenses === 0) {
      issues.push('No expense entries found despite having income entries');
    }

    if (stats.invalid > 0) {
      issues.push(`Found ${stats.invalid} invalid entries`);
    }

    // Check for required fields
    entries.forEach((entry, index) => {
      if (!entry.id) {
        issues.push(`Entry at index ${index} missing required ID`);
      }
      if (!entry.type || !['income', 'expense', 'cogs'].includes(entry.type)) {
        issues.push(`Entry at index ${index} has invalid type: ${entry.type}`);
      }
      if (!entry.amount || typeof entry.amount !== 'number') {
        issues.push(`Entry at index ${index} has invalid amount: ${entry.amount}`);
      }
    });

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Create a backup before any destructive operations
   */
  static createBackup(): string {
    try {
      const data = localStorage.getItem(BOOKKEEPING_ENTRIES_KEY);
      const timestamp = new Date().toISOString();
      const backup = {
        timestamp,
        data: data ? JSON.parse(data) : null,
        version: 'pre-operation'
      };
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create data backup');
    }
  }

  /**
   * Check data integrity without loading into memory
   */
  static checkDataIntegrity(): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    try {
      const savedEntries = localStorage.getItem(BOOKKEEPING_ENTRIES_KEY);
      
      if (!savedEntries) {
        return {
          isValid: true,
          issues: [],
          recommendations: ['No data found - this may be a new installation']
        };
      }

      const parsed = JSON.parse(savedEntries);
      const issues: string[] = [];
      const recommendations: string[] = [];

      // Check storage format
      if (!Array.isArray(parsed) && typeof parsed === 'object') {
        issues.push('Data stored in legacy object format');
        recommendations.push('Data will be automatically converted to array format on next load');
      } else if (!Array.isArray(parsed)) {
        issues.push('Data stored in invalid format');
        recommendations.push('Manual data recovery may be required');
        return { isValid: false, issues, recommendations };
      }

      const entries = Array.isArray(parsed) ? parsed : Object.values(parsed);
      const stats = this.getEntriesStatistics(entries);

      // Check for suspicious patterns
      if (stats.income > 0 && stats.expenses === 0) {
        issues.push('No expense entries found despite having income entries');
        recommendations.push('Check if expense entries were lost during a recent update');
      }

      if (stats.invalid > 0) {
        issues.push(`Found ${stats.invalid} invalid entries`);
        recommendations.push('Clean up invalid entries to improve data quality');
      }

      return {
        isValid: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        isValid: false,
        issues: ['Error reading localStorage data'],
        recommendations: ['Check browser console for detailed error information']
      };
    }
  }
}