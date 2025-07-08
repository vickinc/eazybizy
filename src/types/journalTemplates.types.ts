export interface JournalEntryTemplate {
  id: string;
  name: string;
  description: string;
  category: 'payroll' | 'depreciation' | 'accruals' | 'adjustments' | 'recurring' | 'other';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  lastUsed?: string;
  usageCount: number;
  
  // Template structure
  templateData: {
    description: string;
    reference?: string;
    lines: JournalEntryTemplateLine[];
  };
}

export interface JournalEntryTemplateLine {
  id: string;
  accountId: string;
  accountCode?: string;
  accountName?: string;
  description: string;
  debitFormula?: string;  // Formula or fixed amount
  creditFormula?: string; // Formula or fixed amount
  isVariable: boolean;    // Whether user needs to input amount
  sortOrder: number;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: 'number' | 'text' | 'date' | 'account';
  required: boolean;
  defaultValue?: string | number;
  description?: string;
}

export interface JournalTemplateFormData {
  templateId: string;
  description: string;
  reference?: string;
  date: string;
  variables: Record<string, string | number>;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: JournalEntryTemplate[];
}

// Common template types
export const TEMPLATE_CATEGORIES: Record<string, { name: string; description: string; icon: string }> = {
  payroll: {
    name: 'Payroll',
    description: 'Salary, wages, and payroll-related entries',
    icon: 'Users'
  },
  depreciation: {
    name: 'Depreciation',
    description: 'Monthly depreciation and asset write-offs',
    icon: 'TrendingDown'
  },
  accruals: {
    name: 'Accruals',
    description: 'Accrued expenses and revenue recognition',
    icon: 'Calendar'
  },
  adjustments: {
    name: 'Adjustments',
    description: 'Period-end and adjusting entries',
    icon: 'Settings'
  },
  recurring: {
    name: 'Recurring',
    description: 'Monthly recurring entries',
    icon: 'RotateCw'
  },
  other: {
    name: 'Other',
    description: 'Custom and miscellaneous templates',
    icon: 'FileText'
  }
};