import { BookkeepingEntry } from '@/types';

export interface DataRecoveryReport {
  totalEntries: number;
  expenseEntries: number;
  incomeEntries: number;
  cogsEntries: number;
  invalidEntries: number;
  possibleDataLoss: boolean;
  storageFormat: 'array' | 'object' | 'unknown';
  recommendations: string[];
}

export class DataRecoveryService {
  private static readonly BOOKKEEPING_ENTRIES_KEY = 'app-bookkeeping-entries';
  
  /**
   * Analyzes the current localStorage data to detect potential data loss
   */
  static analyzeLocalStorageData(): DataRecoveryReport {
    try {
      const savedEntries = localStorage.getItem(this.BOOKKEEPING_ENTRIES_KEY);
      
      if (!savedEntries) {
        return {
          totalEntries: 0,
          expenseEntries: 0,
          incomeEntries: 0,
          cogsEntries: 0,
          invalidEntries: 0,
          possibleDataLoss: false,
          storageFormat: 'unknown',
          recommendations: ['No bookkeeping data found in localStorage']
        };
      }

      const parsed = JSON.parse(savedEntries);
      const storageFormat = Array.isArray(parsed) ? 'array' : 'object';
      
      let entries: unknown[];
      if (Array.isArray(parsed)) {
        entries = parsed;
      } else if (parsed && typeof parsed === 'object') {
        entries = Object.values(parsed);
      } else {
        return {
          totalEntries: 0,
          expenseEntries: 0,
          incomeEntries: 0,
          cogsEntries: 0,
          invalidEntries: 0,
          possibleDataLoss: true,
          storageFormat: 'unknown',
          recommendations: ['Invalid data format detected - manual recovery required']
        };
      }

      const stats = this.analyzeEntries(entries);
      const recommendations = this.generateRecommendations(stats, storageFormat);

      return {
        ...stats,
        storageFormat,
        recommendations
      };
      
    } catch (error) {
      console.error('Error analyzing localStorage data:', error);
      return {
        totalEntries: 0,
        expenseEntries: 0,
        incomeEntries: 0,
        cogsEntries: 0,
        invalidEntries: 0,
        possibleDataLoss: true,
        storageFormat: 'unknown',
        recommendations: ['Error reading localStorage - data may be corrupted']
      };
    }
  }

  private static analyzeEntries(entries: unknown[]): Omit<DataRecoveryReport, 'storageFormat' | 'recommendations'> {
    const expenseEntries = 0;
    const incomeEntries = 0;
    const cogsEntries = 0;
    const invalidEntries = 0;
    const possibleDataLoss = false;

    entries.forEach(entry => {
      if (!entry || typeof entry !== 'object') {
        invalidEntries++;
        return;
      }

      switch (entry.type) {
        case 'expense':
          expenseEntries++;
          break;
        case 'income':
          incomeEntries++;
          break;
        case 'cogs':
          cogsEntries++;
          break;
        default:
          invalidEntries++;
      }
    });

    // Check for suspicious patterns that might indicate data loss
    const totalValidEntries = expenseEntries + incomeEntries + cogsEntries;
    
    // If we have income but very few or no expenses, this might indicate data loss
    if (incomeEntries > 0 && expenseEntries === 0) {
      possibleDataLoss = true;
    }
    
    // If we have many income entries but suspiciously few expenses (less than 10% ratio)
    if (incomeEntries > 10 && expenseEntries < incomeEntries * 0.1) {
      possibleDataLoss = true;
    }

    return {
      totalEntries: entries.length,
      expenseEntries,
      incomeEntries,
      cogsEntries,
      invalidEntries,
      possibleDataLoss
    };
  }

  private static generateRecommendations(
    stats: Omit<DataRecoveryReport, 'storageFormat' | 'recommendations'>, 
    storageFormat: 'array' | 'object' | 'unknown'
  ): string[] {
    const recommendations: string[] = [];

    if (stats.possibleDataLoss) {
      recommendations.push('⚠️ Possible data loss detected - expense entries may have been removed during a recent update');
      recommendations.push('📋 Check if you have a backup of your bookkeeping data');
      recommendations.push('💾 Consider exporting your current data before making any changes');
    }

    if (storageFormat === 'object') {
      recommendations.push('🔧 Data is stored in legacy object format - will be converted to array format');
    }

    if (stats.invalidEntries > 0) {
      recommendations.push(`🚨 Found ${stats.invalidEntries} invalid entries that may need cleanup`);
    }

    if (stats.expenseEntries === 0 && stats.incomeEntries > 0) {
      recommendations.push('❗ No expense entries found despite having income entries - this is unusual');
      recommendations.push('📞 Consider contacting support if you previously had expense entries');
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ Data appears to be in good condition');
    }

    return recommendations;
  }

  /**
   * Creates a backup of current localStorage data
   */
  static createDataBackup(): string {
    try {
      const data = localStorage.getItem(this.BOOKKEEPING_ENTRIES_KEY);
      const timestamp = new Date().toISOString();
      const backup = {
        timestamp,
        data: data ? JSON.parse(data) : null,
        version: 'pre-recovery'
      };
      return JSON.stringify(backup, null, 2);
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Failed to create data backup');
    }
  }

  /**
   * Validates that expense entries have not been accidentally filtered out
   */
  static validateExpenseEntries(entries: BookkeepingEntry[]): {
    isValid: boolean;
    issues: string[];
    suggestions: string[];
  } {
    const issues: string[] = [];
    const suggestions: string[] = [];

    const expenseEntries = entries.filter(entry => entry.type === 'expense');
    const incomeEntries = entries.filter(entry => entry.type === 'income');

    // Check for suspicious patterns
    if (incomeEntries.length > 0 && expenseEntries.length === 0) {
      issues.push('No expense entries found despite having income entries');
      suggestions.push('Check if expense entries were accidentally deleted during migration');
    }

    if (incomeEntries.length > 5 && expenseEntries.length < incomeEntries.length * 0.1) {
      issues.push('Very low expense to income ratio detected');
      suggestions.push('Verify that all expense entries are present');
    }

    // Check for entries with isFromInvoice flag that might have been affected
    const affectedEntries = entries.filter(entry => 
      entry.type === 'expense' && (entry as any).isFromInvoice
    );

    if (affectedEntries.length === 0 && incomeEntries.some(entry => (entry as any).isFromInvoice)) {
      issues.push('Found invoice-related income but no invoice-related expenses');
      suggestions.push('Invoice-related expense entries may have been affected by the recent fix');
    }

    return {
      isValid: issues.length === 0,
      issues,
      suggestions
    };
  }

  /**
   * Logs a detailed report to the console for debugging
   */
  static logDetailedReport(): void {
    const report = this.analyzeLocalStorageData();
    
    console.group('📊 Data Recovery Analysis Report');
    
    
    if (report.possibleDataLoss) {
    }
    
    console.groupEnd();
  }
}

// Make it available globally for browser console debugging
if (typeof window !== 'undefined') {
  (window as any).DataRecoveryService = DataRecoveryService;
}