import { 
  JournalEntryTemplate, 
  JournalEntryTemplateLine,
  JournalTemplateFormData,
  TemplateCategory,
  TEMPLATE_CATEGORIES
} from '@/types/journalTemplates.types';
import { JournalEntry, JournalEntryLine } from '@/types/bookkeeping.types';
import { ChartOfAccountsItem } from '@/types/chartOfAccounts.types';

export class JournalTemplateService {
  private static readonly STORAGE_KEY = 'app-journal-templates';

  // Get all templates
  static getAllTemplates(): JournalEntryTemplate[] {
    if (typeof window === 'undefined') return [];
    
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      // Initialize with default templates
      const defaultTemplates = this.getDefaultTemplates();
      this.saveTemplates(defaultTemplates);
      return defaultTemplates;
    }
    
    return JSON.parse(stored);
  }

  // Get templates by category
  static getTemplatesByCategory(): TemplateCategory[] {
    const templates = this.getAllTemplates();
    const categories: TemplateCategory[] = [];

    Object.entries(TEMPLATE_CATEGORIES).forEach(([id, categoryInfo]) => {
      const categoryTemplates = templates.filter(t => t.category === id && t.isActive);
      categories.push({
        id,
        name: categoryInfo.name,
        description: categoryInfo.description,
        icon: categoryInfo.icon,
        templates: categoryTemplates
      });
    });

    return categories;
  }

  // Get template by ID
  static getTemplateById(templateId: string): JournalEntryTemplate | null {
    const templates = this.getAllTemplates();
    return templates.find(t => t.id === templateId) || null;
  }

  // Save templates
  private static saveTemplates(templates: JournalEntryTemplate[]): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(templates));
  }

  // Create journal entry from template
  static createEntryFromTemplate(
    templateData: JournalTemplateFormData,
    chartOfAccounts: ChartOfAccountsItem[]
  ): Partial<JournalEntry> {
    const template = this.getTemplateById(templateData.templateId);
    if (!template) {
      throw new Error('Template not found');
    }

    // Update template usage statistics
    this.updateTemplateUsage(templateData.templateId);

    // Process template lines
    const lines: JournalEntryLine[] = template.templateData.lines.map((templateLine, index) => {
      const account = chartOfAccounts.find(acc => acc.id === templateLine.accountId);
      
      let debitAmount = 0;
      let creditAmount = 0;

      // Process amounts based on formulas or variables
      if (templateLine.debitFormula) {
        debitAmount = this.evaluateFormula(templateLine.debitFormula, templateData.variables);
      }
      if (templateLine.creditFormula) {
        creditAmount = this.evaluateFormula(templateLine.creditFormula, templateData.variables);
      }

      return {
        id: `line-${Date.now()}-${index}`,
        accountId: templateLine.accountId,
        accountCode: account?.code || templateLine.accountCode || '',
        accountName: account?.name || templateLine.accountName || 'Unknown Account',
        description: this.processTemplateString(templateLine.description, templateData.variables),
        debit: debitAmount,
        credit: creditAmount
      };
    });

    // Calculate totals
    const totalDebits = lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredits = lines.reduce((sum, line) => sum + line.credit, 0);

    return {
      description: this.processTemplateString(template.templateData.description, templateData.variables),
      reference: templateData.reference || template.templateData.reference,
      date: templateData.date,
      lines,
      totalDebits,
      totalCredits,
      isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
      source: 'template',
      status: 'draft'
    };
  }

  // Update template usage statistics
  private static updateTemplateUsage(templateId: string): void {
    const templates = this.getAllTemplates();
    const templateIndex = templates.findIndex(t => t.id === templateId);
    
    if (templateIndex !== -1) {
      templates[templateIndex].usageCount += 1;
      templates[templateIndex].lastUsed = new Date().toISOString();
      this.saveTemplates(templates);
    }
  }

  // Evaluate formula with variables
  private static evaluateFormula(formula: string, variables: Record<string, string | number>): number {
    try {
      // Simple formula evaluation - replace variables and calculate
      let processedFormula = formula;
      
      // Replace variables like {amount}, {salary}, etc.
      Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`\\{${key}\\}`, 'g');
        processedFormula = processedFormula.replace(regex, String(value));
      });

      // Basic math evaluation (be careful with eval in production)
      // This is a simplified version - consider using a proper expression parser
      if (/^[\d\s+\-*/().]+$/.test(processedFormula)) {
        return eval(processedFormula);
      }
      
      // If it's just a number
      const numValue = parseFloat(processedFormula);
      return isNaN(numValue) ? 0 : numValue;
    } catch {
      return 0;
    }
  }

  // Process template strings with variables
  private static processTemplateString(template: string, variables: Record<string, string | number>): string {
    let processed = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      processed = processed.replace(regex, String(value));
    });
    
    return processed;
  }

  // Get popular templates (most used)
  static getPopularTemplates(limit: number = 5): JournalEntryTemplate[] {
    const templates = this.getAllTemplates();
    return templates
      .filter(t => t.isActive)
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
  }

  // Get recently used templates
  static getRecentTemplates(limit: number = 5): JournalEntryTemplate[] {
    const templates = this.getAllTemplates();
    return templates
      .filter(t => t.isActive && t.lastUsed)
      .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
      .slice(0, limit);
  }

  // Create default templates
  private static getDefaultTemplates(): JournalEntryTemplate[] {
    const now = new Date().toISOString();
    
    return [
      // Payroll Templates
      {
        id: 'payroll-salary',
        name: 'Monthly Salary',
        description: 'Record monthly salary expenses',
        category: 'payroll',
        isActive: true,
        createdBy: 'system',
        createdAt: now,
        usageCount: 0,
        templateData: {
          description: 'Monthly salary - {month}',
          lines: [
            {
              id: 'sal-1',
              accountId: 'salaries-expense',
              accountCode: '6100',
              accountName: 'Salaries Expense',
              description: 'Gross salary',
              debitFormula: '{grossSalary}',
              creditFormula: '',
              isVariable: true,
              sortOrder: 1
            },
            {
              id: 'sal-2',
              accountId: 'payroll-payable',
              accountCode: '2300',
              accountName: 'Salaries Payable',
              description: 'Net salary payable',
              debitFormula: '',
              creditFormula: '{netSalary}',
              isVariable: true,
              sortOrder: 2
            },
            {
              id: 'sal-3',
              accountId: 'tax-payable',
              accountCode: '2310',
              accountName: 'Payroll Tax Payable',
              description: 'Payroll taxes withheld',
              debitFormula: '',
              creditFormula: '{grossSalary} - {netSalary}',
              isVariable: false,
              sortOrder: 3
            }
          ]
        }
      },

      // Depreciation Templates
      {
        id: 'depreciation-monthly',
        name: 'Monthly Depreciation',
        description: 'Record monthly depreciation expense',
        category: 'depreciation',
        isActive: true,
        createdBy: 'system',
        createdAt: now,
        usageCount: 0,
        templateData: {
          description: 'Monthly depreciation - {month}',
          lines: [
            {
              id: 'dep-1',
              accountId: 'depreciation-expense',
              accountCode: '6200',
              accountName: 'Depreciation Expense',
              description: 'Monthly depreciation',
              debitFormula: '{depreciationAmount}',
              creditFormula: '',
              isVariable: true,
              sortOrder: 1
            },
            {
              id: 'dep-2',
              accountId: 'accumulated-depreciation',
              accountCode: '1520',
              accountName: 'Accumulated Depreciation',
              description: 'Accumulated depreciation',
              debitFormula: '',
              creditFormula: '{depreciationAmount}',
              isVariable: false,
              sortOrder: 2
            }
          ]
        }
      },

      // Accrual Templates
      {
        id: 'accrued-expense',
        name: 'Accrued Expense',
        description: 'Record accrued expenses',
        category: 'accruals',
        isActive: true,
        createdBy: 'system',
        createdAt: now,
        usageCount: 0,
        templateData: {
          description: 'Accrued {expenseType} - {period}',
          lines: [
            {
              id: 'acc-1',
              accountId: 'expense-account',
              accountCode: '6000',
              accountName: 'Operating Expense',
              description: 'Accrued expense',
              debitFormula: '{amount}',
              creditFormula: '',
              isVariable: true,
              sortOrder: 1
            },
            {
              id: 'acc-2',
              accountId: 'accrued-payable',
              accountCode: '2400',
              accountName: 'Accrued Expenses Payable',
              description: 'Accrued liability',
              debitFormula: '',
              creditFormula: '{amount}',
              isVariable: false,
              sortOrder: 2
            }
          ]
        }
      },

      // Recurring Templates
      {
        id: 'rent-expense',
        name: 'Monthly Rent',
        description: 'Record monthly rent expense',
        category: 'recurring',
        isActive: true,
        createdBy: 'system',
        createdAt: now,
        usageCount: 0,
        templateData: {
          description: 'Monthly rent - {month}',
          lines: [
            {
              id: 'rent-1',
              accountId: 'rent-expense',
              accountCode: '6300',
              accountName: 'Rent Expense',
              description: 'Monthly office rent',
              debitFormula: '{rentAmount}',
              creditFormula: '',
              isVariable: true,
              sortOrder: 1
            },
            {
              id: 'rent-2',
              accountId: 'cash',
              accountCode: '1000',
              accountName: 'Cash',
              description: 'Rent payment',
              debitFormula: '',
              creditFormula: '{rentAmount}',
              isVariable: false,
              sortOrder: 2
            }
          ]
        }
      },

      // Adjustment Templates
      {
        id: 'bank-reconciliation',
        name: 'Bank Reconciliation Adjustment',
        description: 'Correct bank reconciliation differences',
        category: 'adjustments',
        isActive: true,
        createdBy: 'system',
        createdAt: now,
        usageCount: 0,
        templateData: {
          description: 'Bank reconciliation adjustment - {reason}',
          lines: [
            {
              id: 'bank-1',
              accountId: 'cash',
              accountCode: '1000',
              accountName: 'Cash',
              description: 'Bank adjustment',
              debitFormula: '{adjustmentAmount}',
              creditFormula: '',
              isVariable: true,
              sortOrder: 1
            },
            {
              id: 'bank-2',
              accountId: 'misc-expense',
              accountCode: '6900',
              accountName: 'Miscellaneous Expense',
              description: 'Bank fees or adjustments',
              debitFormula: '',
              creditFormula: '{adjustmentAmount}',
              isVariable: false,
              sortOrder: 2
            }
          ]
        }
      }
    ];
  }
}