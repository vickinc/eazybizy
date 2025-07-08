import { JournalEntryFormData, JournalEntryLineFormData, ChartOfAccount, AccountType } from '@/types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface BusinessRule {
  id: string;
  name: string;
  description: string;
  validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]) => ValidationResult;
}

export class JournalEntryValidationService {
  /**
   * QuickBooks-style business rules for journal entries
   */
  private static businessRules: BusinessRule[] = [
    {
      id: 'balance-validation',
      name: 'Balance Validation',
      description: 'Debits must equal credits',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const totalDebits = formData.lines.reduce((sum, line) => sum + (parseFloat(line.debit) || 0), 0);
        const totalCredits = formData.lines.reduce((sum, line) => sum + (parseFloat(line.credit) || 0), 0);
        const difference = Math.abs(totalDebits - totalCredits);

        if (difference > 0.01) {
          return {
            isValid: false,
            errors: [`Entry is out of balance by ${difference.toFixed(2)}. Debits: ${totalDebits.toFixed(2)}, Credits: ${totalCredits.toFixed(2)}`],
            warnings: []
          };
        }

        return { isValid: true, errors: [], warnings: [] };
      }
    },

    {
      id: 'minimum-lines',
      name: 'Minimum Lines',
      description: 'At least 2 lines required for double-entry',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const validLines = formData.lines.filter(line => 
          line.accountId && ((parseFloat(line.debit) || 0) > 0 || (parseFloat(line.credit) || 0) > 0)
        );

        if (validLines.length < 2) {
          return {
            isValid: false,
            errors: ['At least 2 lines with valid accounts and amounts are required'],
            warnings: []
          };
        }

        return { isValid: true, errors: [], warnings: [] };
      }
    },

    {
      id: 'account-existence',
      name: 'Account Existence',
      description: 'All referenced accounts must exist in chart of accounts',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const errors: string[] = [];
        const chartAccountIds = new Set(chartOfAccounts.map(acc => acc.id));

        formData.lines.forEach((line, index) => {
          if (line.accountId && !chartAccountIds.has(line.accountId)) {
            errors.push(`Line ${index + 1}: Account not found in chart of accounts`);
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    },

    {
      id: 'inactive-accounts',
      name: 'Active Accounts Only',
      description: 'Cannot use inactive accounts',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const errors: string[] = [];
        const accountMap = new Map(chartOfAccounts.map(acc => [acc.id, acc]));

        formData.lines.forEach((line, index) => {
          if (line.accountId) {
            const account = accountMap.get(line.accountId);
            if (account && !account.isActive) {
              errors.push(`Line ${index + 1}: Account "${account.name}" is inactive`);
            }
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    },

    {
      id: 'header-accounts',
      name: 'Detail Accounts Only',
      description: 'Cannot post to header accounts',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const errors: string[] = [];
        const accountMap = new Map(chartOfAccounts.map(acc => [acc.id, acc]));

        formData.lines.forEach((line, index) => {
          if (line.accountId) {
            const account = accountMap.get(line.accountId);
            if (account && account.accountType === 'Header') {
              errors.push(`Line ${index + 1}: Cannot post to header account "${account.name}". Use a detail account instead.`);
            }
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    },

    {
      id: 'dual-amount-validation',
      name: 'Single Amount per Line',
      description: 'Each line should have either debit or credit, not both',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const errors: string[] = [];

        formData.lines.forEach((line, index) => {
          const debit = parseFloat(line.debit) || 0;
          const credit = parseFloat(line.credit) || 0;

          if (debit > 0 && credit > 0) {
            errors.push(`Line ${index + 1}: Cannot have both debit and credit amounts on the same line`);
          }

          if (debit === 0 && credit === 0 && line.accountId) {
            errors.push(`Line ${index + 1}: Must specify either debit or credit amount`);
          }

          if (debit < 0 || credit < 0) {
            errors.push(`Line ${index + 1}: Amounts cannot be negative`);
          }
        });

        return {
          isValid: errors.length === 0,
          errors,
          warnings: []
        };
      }
    },

    {
      id: 'date-validation',
      name: 'Valid Date',
      description: 'Date must be valid and not in the future',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!formData.date) {
          errors.push('Date is required');
          return { isValid: false, errors, warnings };
        }

        const entryDate = new Date(formData.date);
        const today = new Date();
        const futureLimit = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days in future

        if (isNaN(entryDate.getTime())) {
          errors.push('Invalid date format');
        } else if (entryDate > futureLimit) {
          errors.push('Date cannot be more than 7 days in the future');
        } else if (entryDate > today) {
          warnings.push('Date is in the future');
        }

        // Check if date is too old (more than 2 years)
        const twoYearsAgo = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
        if (entryDate < twoYearsAgo) {
          warnings.push('Date is more than 2 years old. Consider if this entry should be in the current period.');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
    },

    {
      id: 'description-validation',
      name: 'Description Required',
      description: 'Description is required and should be meaningful',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const errors: string[] = [];
        const warnings: string[] = [];

        if (!formData.description || formData.description.trim().length === 0) {
          errors.push('Description is required');
        } else if (formData.description.trim().length < 3) {
          warnings.push('Description should be more descriptive');
        } else if (formData.description.trim().length > 500) {
          errors.push('Description is too long (maximum 500 characters)');
        }

        return {
          isValid: errors.length === 0,
          errors,
          warnings
        };
      }
    },

    {
      id: 'revenue-expense-logic',
      name: 'Revenue/Expense Account Logic',
      description: 'Validate typical credit/debit patterns for revenue and expense accounts',
      validate: (formData: JournalEntryFormData, chartOfAccounts: ChartOfAccount[]): ValidationResult => {
        const warnings: string[] = [];
        const accountMap = new Map(chartOfAccounts.map(acc => [acc.id, acc]));

        formData.lines.forEach((line, index) => {
          if (line.accountId) {
            const account = accountMap.get(line.accountId);
            if (account) {
              const debit = parseFloat(line.debit) || 0;
              const credit = parseFloat(line.credit) || 0;

              // Revenue accounts typically have credits (increases)
              if (account.type === 'Revenue' && debit > 0 && credit === 0) {
                warnings.push(`Line ${index + 1}: Revenue account "${account.name}" typically receives credits. Consider if this debit is correct.`);
              }

              // Expense accounts typically have debits (increases)
              if (account.type === 'Expense' && credit > 0 && debit === 0) {
                warnings.push(`Line ${index + 1}: Expense account "${account.name}" typically receives debits. Consider if this credit is correct.`);
              }

              // Asset accounts typically have debit balances
              if (account.type === 'Assets' && credit > debit && account.category?.includes('Cash')) {
                warnings.push(`Line ${index + 1}: Cash/Asset account "${account.name}" typically has debit balances. Large credit may indicate negative balance.`);
              }
            }
          }
        });

        return {
          isValid: true,
          errors: [],
          warnings
        };
      }
    }
  ];

  /**
   * Validate journal entry form data with comprehensive business rules
   */
  static validateJournalEntry(
    formData: JournalEntryFormData, 
    chartOfAccounts: ChartOfAccount[],
    enforceWarningsAsErrors: boolean = false
  ): ValidationResult {
    const allErrors: string[] = [];
    const allWarnings: string[] = [];

    // Run all business rules
    for (const rule of this.businessRules) {
      const result = rule.validate(formData, chartOfAccounts);
      allErrors.push(...result.errors);
      allWarnings.push(...result.warnings);
    }

    // Convert warnings to errors if enforcement is enabled
    if (enforceWarningsAsErrors) {
      allErrors.push(...allWarnings);
      allWarnings.length = 0;
    }

    return {
      isValid: allErrors.length === 0,
      errors: allErrors,
      warnings: allWarnings
    };
  }

  /**
   * Get all available business rules
   */
  static getBusinessRules(): BusinessRule[] {
    return [...this.businessRules];
  }

  /**
   * Validate individual business rule by ID
   */
  static validateRule(
    ruleId: string, 
    formData: JournalEntryFormData, 
    chartOfAccounts: ChartOfAccount[]
  ): ValidationResult | null {
    const rule = this.businessRules.find(r => r.id === ruleId);
    if (!rule) return null;
    
    return rule.validate(formData, chartOfAccounts);
  }

  /**
   * Account-specific validation helpers
   */
  static validateAccountUsage(
    accountId: string, 
    amount: number, 
    isDebit: boolean, 
    chartOfAccounts: ChartOfAccount[]
  ): ValidationResult {
    const account = chartOfAccounts.find(acc => acc.id === accountId);
    if (!account) {
      return {
        isValid: false,
        errors: ['Account not found'],
        warnings: []
      };
    }

    const warnings: string[] = [];
    
    // Normal balance validation
    const normalDebitAccounts: AccountType[] = ['Assets', 'Expense'];
    const normalCreditAccounts: AccountType[] = ['Liability', 'Equity', 'Revenue'];
    
    if (normalDebitAccounts.includes(account.type) && !isDebit && amount > 0) {
      warnings.push(`${account.type} accounts typically have debit balances`);
    }
    
    if (normalCreditAccounts.includes(account.type) && isDebit && amount > 0) {
      warnings.push(`${account.type} accounts typically have credit balances`);
    }

    return {
      isValid: true,
      errors: [],
      warnings
    };
  }

  /**
   * Get validation summary for display
   */
  static getValidationSummary(result: ValidationResult): string {
    if (result.isValid && result.warnings.length === 0) {
      return '✅ All validations passed';
    }
    
    const parts: string[] = [];
    
    if (result.errors.length > 0) {
      parts.push(`❌ ${result.errors.length} error${result.errors.length === 1 ? '' : 's'}`);
    }
    
    if (result.warnings.length > 0) {
      parts.push(`⚠️ ${result.warnings.length} warning${result.warnings.length === 1 ? '' : 's'}`);
    }
    
    return parts.join(', ');
  }
}