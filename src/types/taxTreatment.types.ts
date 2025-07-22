export interface TaxTreatment {
  id: string;
  code: string; // e.g., "TAX22", "TAX9", "EXEMPT"
  name: string; // e.g., "VAT/Sales Tax/GST 22%"
  description: string;
  rate: number; // Tax rate percentage (0-100)
  isActive: boolean;
  category: TaxCategory;
  applicability: TaxApplicability[];
  isDefault: boolean; // Whether this is a system default treatment
  createdAt: string;
  updatedAt: string;
}

export interface TaxTreatmentFormData {
  code: string;
  name: string;
  description: string;
  rate: string; // Form input as string, converted to number in business logic
  category: TaxCategory;
  applicability: TaxApplicability[];
  isActive: boolean;
}

export type TaxCategory = 
  | 'standard' 
  | 'reduced' 
  | 'exempt' 
  | 'special'
  | 'acquisition'
  | 'margin'
  | 'property';

export type TaxApplicability = 
  | 'sales' 
  | 'purchases' 
  | 'assets' 
  | 'services'
  | 'import'
  | 'export';

export interface TaxTreatmentStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: {
    [key in TaxCategory]: number;
  };
}

export interface TaxTreatmentFilter {
  search: string;
  category: TaxCategory | 'all';
  isActive: boolean | 'all';
  applicability: TaxApplicability | 'all';
  rateRange: {
    min: number;
    max: number;
  };
}

export interface TaxTreatmentTableSortConfig {
  field: 'code' | 'name' | 'rate' | 'category' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Constants for form options and validation
export const TAX_CATEGORIES: TaxCategory[] = [
  'standard',
  'reduced', 
  'exempt',
  'special',
  'acquisition',
  'margin',
  'property'
];

export const TAX_APPLICABILITIES: TaxApplicability[] = [
  'sales',
  'purchases',
  'assets',
  'services',
  'import',
  'export'
];

export const TAX_CATEGORY_DESCRIPTIONS = {
  'standard': 'Standard tax rate (VAT/Sales Tax/GST) for most goods and services',
  'reduced': 'Reduced tax rate (VAT/Sales Tax/GST) for specific goods/services',
  'exempt': 'Tax exempt transactions',
  'special': 'Special tax schemes and treatments',
  'acquisition': 'Tax (VAT/Sales Tax/GST) on acquisition of assets',
  'margin': 'Margin scheme taxation',
  'property': 'Property and real estate related tax (VAT/Sales Tax/GST)'
} as const;

export const TAX_APPLICABILITY_DESCRIPTIONS = {
  'sales': 'Apply to sales transactions',
  'purchases': 'Apply to purchase transactions',
  'assets': 'Apply to asset acquisitions',
  'services': 'Apply to service transactions',
  'import': 'Apply to import transactions',
  'export': 'Apply to export transactions'
} as const;

// Default tax treatments based on current system
export const DEFAULT_TAX_TREATMENTS: Omit<TaxTreatment, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    code: 'NOT_TURNOVER',
    name: 'Not included in Turnover',
    description: 'Transactions not subject to turnover taxation',
    rate: 0,
    isActive: true,
    category: 'exempt',
    applicability: ['sales', 'purchases'],
    isDefault: true
  },
  {
    code: 'TAX_22',
    name: 'VAT/Sales Tax/GST 22%',
    description: 'Standard tax rate (VAT/Sales Tax/GST) of 22%',
    rate: 22,
    isActive: true,
    category: 'standard',
    applicability: ['sales', 'purchases', 'services'],
    isDefault: true
  },
  {
    code: 'TAX_9',
    name: 'VAT/Sales Tax/GST 9%',
    description: 'Reduced tax rate (VAT/Sales Tax/GST) of 9%',
    rate: 9,
    isActive: true,
    category: 'reduced',
    applicability: ['sales', 'purchases', 'services'],
    isDefault: true
  },
  {
    code: 'TAX_0',
    name: 'VAT/Sales Tax/GST 0%',
    description: 'Zero-rated tax (VAT/Sales Tax/GST) for specific goods and services',
    rate: 0,
    isActive: true,
    category: 'exempt',
    applicability: ['sales', 'purchases', 'export'],
    isDefault: true
  },
  {
    code: 'TAX_EXEMPT',
    name: 'Turnover exempt from tax (VAT/Sales Tax/GST)',
    description: 'Transactions completely exempt from tax (VAT/Sales Tax/GST)',
    rate: 0,
    isActive: true,
    category: 'exempt',
    applicability: ['sales', 'services'],
    isDefault: true
  },
  {
    code: 'TAX_ACQUISITION',
    name: 'Tax (VAT/Sales Tax/GST) on acquisition of non-current assets',
    description: 'Special tax treatment for non-current asset acquisitions',
    rate: 0,
    isActive: true,
    category: 'acquisition',
    applicability: ['assets', 'purchases'],
    isDefault: true
  },
  {
    code: 'TAX_MARGIN',
    name: 'Taxation on the profit margin',
    description: 'Margin scheme taxation for second-hand goods, works of art, antiques and collectors items',
    rate: 0,
    isActive: true,
    category: 'margin',
    applicability: ['sales'],
    isDefault: true
  },
  {
    code: 'TAX_PROPERTY',
    name: 'Immovable property and scrap metal',
    description: 'Special tax treatment for immovable property and scrap metal transactions',
    rate: 0,
    isActive: true,
    category: 'property',
    applicability: ['sales', 'purchases'],
    isDefault: true
  }
];