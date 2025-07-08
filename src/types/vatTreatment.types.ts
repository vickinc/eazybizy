export interface VATTreatment {
  id: string;
  code: string; // e.g., "VAT22", "VAT9", "EXEMPT"
  name: string; // e.g., "Value Added Tax 22%"
  description: string;
  rate: number; // Tax rate percentage (0-100)
  isActive: boolean;
  category: VATCategory;
  applicability: VATApplicability[];
  isDefault: boolean; // Whether this is a system default treatment
  createdAt: string;
  updatedAt: string;
}

export interface VATTreatmentFormData {
  code: string;
  name: string;
  description: string;
  rate: string; // Form input as string, converted to number in business logic
  category: VATCategory;
  applicability: VATApplicability[];
  isActive: boolean;
}

export type VATCategory = 
  | 'standard' 
  | 'reduced' 
  | 'exempt' 
  | 'special'
  | 'acquisition'
  | 'margin'
  | 'property';

export type VATApplicability = 
  | 'sales' 
  | 'purchases' 
  | 'assets' 
  | 'services'
  | 'import'
  | 'export';

export interface VATTreatmentStats {
  total: number;
  active: number;
  inactive: number;
  byCategory: {
    [key in VATCategory]: number;
  };
}

export interface VATTreatmentFilter {
  search: string;
  category: VATCategory | 'all';
  isActive: boolean | 'all';
  applicability: VATApplicability | 'all';
  rateRange: {
    min: number;
    max: number;
  };
}

export interface VATTreatmentTableSortConfig {
  field: 'code' | 'name' | 'rate' | 'category' | 'createdAt';
  direction: 'asc' | 'desc';
}

// Constants for form options and validation
export const VAT_CATEGORIES: VATCategory[] = [
  'standard',
  'reduced', 
  'exempt',
  'special',
  'acquisition',
  'margin',
  'property'
];

export const VAT_APPLICABILITIES: VATApplicability[] = [
  'sales',
  'purchases',
  'assets',
  'services',
  'import',
  'export'
];

export const VAT_CATEGORY_DESCRIPTIONS = {
  'standard': 'Standard VAT rate for most goods and services',
  'reduced': 'Reduced VAT rate for specific goods/services',
  'exempt': 'VAT exempt transactions',
  'special': 'Special VAT schemes and treatments',
  'acquisition': 'VAT on acquisition of assets',
  'margin': 'Margin scheme taxation',
  'property': 'Property and real estate related VAT'
} as const;

export const VAT_APPLICABILITY_DESCRIPTIONS = {
  'sales': 'Apply to sales transactions',
  'purchases': 'Apply to purchase transactions',
  'assets': 'Apply to asset acquisitions',
  'services': 'Apply to service transactions',
  'import': 'Apply to import transactions',
  'export': 'Apply to export transactions'
} as const;

// Default VAT treatments based on current system
export const DEFAULT_VAT_TREATMENTS: Omit<VATTreatment, 'id' | 'createdAt' | 'updatedAt'>[] = [
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
    code: 'VAT_22',
    name: 'Value Added Tax 22%',
    description: 'Standard VAT rate of 22%',
    rate: 22,
    isActive: true,
    category: 'standard',
    applicability: ['sales', 'purchases', 'services'],
    isDefault: true
  },
  {
    code: 'VAT_9',
    name: 'Value Added Tax 9%',
    description: 'Reduced VAT rate of 9%',
    rate: 9,
    isActive: true,
    category: 'reduced',
    applicability: ['sales', 'purchases', 'services'],
    isDefault: true
  },
  {
    code: 'VAT_0',
    name: 'Value Added Tax 0%',
    description: 'Zero-rated VAT for specific goods and services',
    rate: 0,
    isActive: true,
    category: 'exempt',
    applicability: ['sales', 'purchases', 'export'],
    isDefault: true
  },
  {
    code: 'VAT_EXEMPT',
    name: 'Turnover exempt from VAT',
    description: 'Transactions completely exempt from VAT',
    rate: 0,
    isActive: true,
    category: 'exempt',
    applicability: ['sales', 'services'],
    isDefault: true
  },
  {
    code: 'VAT_ACQUISITION',
    name: 'VAT on acquisition of non-current assets',
    description: 'Special VAT treatment for non-current asset acquisitions',
    rate: 0,
    isActive: true,
    category: 'acquisition',
    applicability: ['assets', 'purchases'],
    isDefault: true
  },
  {
    code: 'VAT_MARGIN',
    name: 'Taxation on the profit margin',
    description: 'Margin scheme taxation for second-hand goods, works of art, antiques and collectors items',
    rate: 0,
    isActive: true,
    category: 'margin',
    applicability: ['sales'],
    isDefault: true
  },
  {
    code: 'VAT_PROPERTY',
    name: 'Immovable property and scrap metal',
    description: 'Special VAT treatment for immovable property and scrap metal transactions',
    rate: 0,
    isActive: true,
    category: 'property',
    applicability: ['sales', 'purchases'],
    isDefault: true
  }
];