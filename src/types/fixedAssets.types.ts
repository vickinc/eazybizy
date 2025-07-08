// Fixed Assets Types

export interface FixedAsset {
  id: string;
  code: string;
  name: string;
  description: string;
  category: AssetCategory;
  subcategory?: string;
  status: AssetStatus;
  
  // Acquisition details
  acquisitionDate: string;
  acquisitionCost: number;
  supplier?: string;
  invoiceNumber?: string;
  
  // Depreciation details
  depreciationMethod: DepreciationMethod;
  usefulLifeYears: number;
  residualValue: number;
  depreciationStartDate: string;
  accumulatedDepreciation: number;
  currentBookValue: number;
  
  // Location and assignment
  location?: string;
  assignedTo?: string;
  department?: string;
  
  // Disposal details (if applicable)
  disposalDate?: string;
  disposalMethod?: DisposalMethod;
  disposalPrice?: number;
  disposalReason?: string;
  
  // Accounting integration
  assetAccountCode?: string;
  depreciationAccountCode?: string;
  accumulatedDepreciationAccountCode?: string;
  
  // Metadata
  tags?: string[];
  notes?: string;
  attachments?: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastDepreciationDate?: string;
}

export interface FixedAssetFormData {
  code: string;
  name: string;
  description: string;
  category: AssetCategory;
  subcategory?: string;
  
  // Acquisition
  acquisitionDate: string;
  acquisitionCost: string;
  supplier?: string;
  invoiceNumber?: string;
  
  // Depreciation
  depreciationMethod: DepreciationMethod;
  usefulLifeYears: string;
  residualValue: string;
  depreciationStartDate: string;
  
  // Location
  location?: string;
  assignedTo?: string;
  department?: string;
  
  // Accounting
  assetAccountCode?: string;
  depreciationAccountCode?: string;
  accumulatedDepreciationAccountCode?: string;
  
  // Other
  notes?: string;
  tags?: string;
}

export type AssetCategory = 
  | 'Land and Buildings'
  | 'Plant and Machinery'
  | 'Furniture and Fixtures'
  | 'Vehicles'
  | 'Computer Equipment'
  | 'Office Equipment'
  | 'Intangible Assets'
  | 'Leasehold Improvements'
  | 'Other Assets';

export type AssetStatus = 
  | 'active'
  | 'under_maintenance'
  | 'disposed'
  | 'written_off'
  | 'held_for_sale';

export type DepreciationMethod = 
  | 'straight_line'
  | 'declining_balance'
  | 'double_declining'
  | 'units_of_production'
  | 'sum_of_years';

export type DisposalMethod = 
  | 'sale'
  | 'scrap'
  | 'donation'
  | 'write_off'
  | 'trade_in'
  | 'theft_loss';

export interface DepreciationScheduleEntry {
  period: string;
  periodStart: string;
  periodEnd: string;
  openingBalance: number;
  depreciationAmount: number;
  closingBalance: number;
  accumulatedDepreciation: number;
}

export interface FixedAssetStats {
  total: number;
  totalCost: number;
  totalBookValue: number;
  totalDepreciation: number;
  byCategory: Record<AssetCategory, number>;
  byStatus: Record<AssetStatus, number>;
  byDepreciationMethod: Record<DepreciationMethod, number>;
  upcomingDisposals: number;
  fullyDepreciated: number;
}

export interface FixedAssetFilter {
  search: string;
  category: AssetCategory | 'all';
  status: AssetStatus | 'all';
  depreciationMethod: DepreciationMethod | 'all';
  location: string;
  department: string;
  acquisitionDateRange: {
    start: string;
    end: string;
  };
  bookValueRange: {
    min: number;
    max: number;
  };
}

export interface FixedAssetsTableSortConfig {
  field: 'code' | 'name' | 'category' | 'acquisitionDate' | 'bookValue' | 'status';
  direction: 'asc' | 'desc';
}

// Constants
export const ASSET_CATEGORIES: AssetCategory[] = [
  'Land and Buildings',
  'Plant and Machinery',
  'Furniture and Fixtures',
  'Vehicles',
  'Computer Equipment',
  'Office Equipment',
  'Intangible Assets',
  'Leasehold Improvements',
  'Other Assets'
];

export const ASSET_STATUSES: AssetStatus[] = [
  'active',
  'under_maintenance',
  'disposed',
  'written_off',
  'held_for_sale'
];

export const DEPRECIATION_METHODS: DepreciationMethod[] = [
  'straight_line',
  'declining_balance',
  'double_declining',
  'units_of_production',
  'sum_of_years'
];

export const DISPOSAL_METHODS: DisposalMethod[] = [
  'sale',
  'scrap',
  'donation',
  'write_off',
  'trade_in',
  'theft_loss'
];

// Helper type for depreciation calculation parameters
export interface DepreciationParams {
  method: DepreciationMethod;
  cost: number;
  residualValue: number;
  usefulLife: number;
  currentYear: number;
  unitsProduced?: number;
  totalUnitsExpected?: number;
}

// Asset transaction types for audit trail
export interface AssetTransaction {
  id: string;
  assetId: string;
  type: 'acquisition' | 'depreciation' | 'revaluation' | 'disposal' | 'maintenance';
  date: string;
  amount: number;
  description: string;
  createdBy?: string;
  createdAt: string;
}