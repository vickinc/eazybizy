import { 
  FixedAsset,
  FixedAssetFormData,
  FixedAssetStats,
  FixedAssetFilter,
  TableSortConfig,
  AssetCategory,
  AssetStatus,
  DepreciationMethod,
  ASSET_CATEGORIES
} from '@/types/fixedAssets.types';
import { FixedAssetsStorageService } from '@/services/storage/fixedAssetsStorageService';
import { FixedAssetsDepreciationService } from './fixedAssetsDepreciationService';

export class FixedAssetsBusinessService {
  static generateAssetId(): string {
    return `asset_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  static createAssetFromFormData(formData: FixedAssetFormData): FixedAsset {
    const now = new Date().toISOString();
    const acquisitionCost = parseFloat(formData.acquisitionCost);
    const residualValue = parseFloat(formData.residualValue);
    
    // Parse tags from comma-separated string
    const tags = formData.tags 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const newAsset: FixedAsset = {
      id: this.generateAssetId(),
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      subcategory: formData.subcategory,
      status: 'active',
      
      // Acquisition details
      acquisitionDate: formData.acquisitionDate,
      acquisitionCost: acquisitionCost,
      supplier: formData.supplier?.trim(),
      invoiceNumber: formData.invoiceNumber?.trim(),
      
      // Depreciation details
      depreciationMethod: formData.depreciationMethod,
      usefulLifeYears: parseFloat(formData.usefulLifeYears),
      residualValue: residualValue,
      depreciationStartDate: formData.depreciationStartDate,
      accumulatedDepreciation: 0,
      currentBookValue: acquisitionCost,
      
      // Location and assignment
      location: formData.location?.trim(),
      assignedTo: formData.assignedTo?.trim(),
      department: formData.department?.trim(),
      
      // Accounting integration
      assetAccountCode: formData.assetAccountCode?.trim(),
      depreciationAccountCode: formData.depreciationAccountCode?.trim(),
      accumulatedDepreciationAccountCode: formData.accumulatedDepreciationAccountCode?.trim(),
      
      // Metadata
      tags: tags,
      notes: formData.notes?.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    // Calculate initial depreciation if needed
    return FixedAssetsDepreciationService.updateAssetDepreciation(newAsset);
  }

  static updateAssetFromFormData(existingAsset: FixedAsset, formData: FixedAssetFormData): FixedAsset {
    const acquisitionCost = parseFloat(formData.acquisitionCost);
    const residualValue = parseFloat(formData.residualValue);
    
    // Parse tags from comma-separated string
    const tags = formData.tags 
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : [];

    const updatedAsset: FixedAsset = {
      ...existingAsset,
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      subcategory: formData.subcategory,
      
      // Acquisition details
      acquisitionDate: formData.acquisitionDate,
      acquisitionCost: acquisitionCost,
      supplier: formData.supplier?.trim(),
      invoiceNumber: formData.invoiceNumber?.trim(),
      
      // Depreciation details
      depreciationMethod: formData.depreciationMethod,
      usefulLifeYears: parseFloat(formData.usefulLifeYears),
      residualValue: residualValue,
      depreciationStartDate: formData.depreciationStartDate,
      
      // Location and assignment
      location: formData.location?.trim(),
      assignedTo: formData.assignedTo?.trim(),
      department: formData.department?.trim(),
      
      // Accounting integration
      assetAccountCode: formData.assetAccountCode?.trim(),
      depreciationAccountCode: formData.depreciationAccountCode?.trim(),
      accumulatedDepreciationAccountCode: formData.accumulatedDepreciationAccountCode?.trim(),
      
      // Metadata
      tags: tags,
      notes: formData.notes?.trim(),
      updatedAt: new Date().toISOString()
    };

    // Recalculate depreciation if key parameters changed
    if (
      existingAsset.acquisitionCost !== acquisitionCost ||
      existingAsset.residualValue !== residualValue ||
      existingAsset.depreciationMethod !== formData.depreciationMethod ||
      existingAsset.usefulLifeYears !== parseFloat(formData.usefulLifeYears) ||
      existingAsset.depreciationStartDate !== formData.depreciationStartDate
    ) {
      return FixedAssetsDepreciationService.updateAssetDepreciation(updatedAsset);
    }

    return updatedAsset;
  }

  static filterAssets(assets: FixedAsset[], filter: FixedAssetFilter): FixedAsset[] {
    return assets.filter(asset => {
      // Search filter
      if (filter.search) {
        const searchTerm = filter.search.toLowerCase();
        const matchesSearch = 
          asset.code.toLowerCase().includes(searchTerm) ||
          asset.name.toLowerCase().includes(searchTerm) ||
          asset.description.toLowerCase().includes(searchTerm) ||
          (asset.location && asset.location.toLowerCase().includes(searchTerm)) ||
          (asset.assignedTo && asset.assignedTo.toLowerCase().includes(searchTerm)) ||
          (asset.department && asset.department.toLowerCase().includes(searchTerm)) ||
          (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(searchTerm)));
        
        if (!matchesSearch) return false;
      }

      // Category filter
      if (filter.category !== 'all' && asset.category !== filter.category) {
        return false;
      }

      // Status filter
      if (filter.status !== 'all' && asset.status !== filter.status) {
        return false;
      }

      // Depreciation method filter
      if (filter.depreciationMethod !== 'all' && asset.depreciationMethod !== filter.depreciationMethod) {
        return false;
      }

      // Location filter
      if (filter.location && (!asset.location || !asset.location.toLowerCase().includes(filter.location.toLowerCase()))) {
        return false;
      }

      // Department filter
      if (filter.department && (!asset.department || !asset.department.toLowerCase().includes(filter.department.toLowerCase()))) {
        return false;
      }

      // Acquisition date range filter
      if (filter.acquisitionDateRange.start || filter.acquisitionDateRange.end) {
        const acquisitionDate = new Date(asset.acquisitionDate);
        if (filter.acquisitionDateRange.start && acquisitionDate < new Date(filter.acquisitionDateRange.start)) {
          return false;
        }
        if (filter.acquisitionDateRange.end && acquisitionDate > new Date(filter.acquisitionDateRange.end)) {
          return false;
        }
      }

      // Book value range filter
      if (filter.bookValueRange.min !== 0 || filter.bookValueRange.max !== Number.MAX_VALUE) {
        if (asset.currentBookValue < filter.bookValueRange.min || asset.currentBookValue > filter.bookValueRange.max) {
          return false;
        }
      }

      return true;
    });
  }

  static sortAssets(assets: FixedAsset[], sortConfig: TableSortConfig): FixedAsset[] {
    const sorted = [...assets].sort((a, b) => {
      let aValue: unknown;
      let bValue: unknown;

      switch (sortConfig.field) {
        case 'code':
          aValue = a.code;
          bValue = b.code;
          break;
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'acquisitionDate':
          aValue = new Date(a.acquisitionDate).getTime();
          bValue = new Date(b.acquisitionDate).getTime();
          break;
        case 'bookValue':
          aValue = a.currentBookValue;
          bValue = b.currentBookValue;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }

  static calculateStats(assets: FixedAsset[]): FixedAssetStats {
    const stats: FixedAssetStats = {
      total: assets.length,
      totalCost: 0,
      totalBookValue: 0,
      totalDepreciation: 0,
      byCategory: {} as Record<AssetCategory, number>,
      byStatus: {} as Record<AssetStatus, number>,
      byDepreciationMethod: {} as Record<DepreciationMethod, number>,
      upcomingDisposals: 0,
      fullyDepreciated: 0
    };

    // Initialize category counts
    ASSET_CATEGORIES.forEach(category => {
      stats.byCategory[category] = 0;
    });

    // Initialize status counts
    const statuses: AssetStatus[] = ['active', 'under_maintenance', 'disposed', 'written_off', 'held_for_sale'];
    statuses.forEach(status => {
      stats.byStatus[status] = 0;
    });

    // Initialize depreciation method counts
    const methods: DepreciationMethod[] = ['straight_line', 'declining_balance', 'double_declining', 'units_of_production', 'sum_of_years'];
    methods.forEach(method => {
      stats.byDepreciationMethod[method] = 0;
    });

    // Calculate stats
    assets.forEach(asset => {
      stats.totalCost += asset.acquisitionCost;
      stats.totalBookValue += asset.currentBookValue;
      stats.totalDepreciation += asset.accumulatedDepreciation;
      
      stats.byCategory[asset.category]++;
      stats.byStatus[asset.status]++;
      stats.byDepreciationMethod[asset.depreciationMethod]++;
      
      if (asset.status === 'held_for_sale') {
        stats.upcomingDisposals++;
      }
      
      if (asset.currentBookValue <= asset.residualValue) {
        stats.fullyDepreciated++;
      }
    });

    return stats;
  }

  static exportToCSV(assets: FixedAsset[]): string {
    const headers = [
      'Code',
      'Name',
      'Description',
      'Category',
      'Status',
      'Acquisition Date',
      'Acquisition Cost',
      'Depreciation Method',
      'Useful Life (Years)',
      'Residual Value',
      'Accumulated Depreciation',
      'Current Book Value',
      'Location',
      'Assigned To',
      'Department',
      'Supplier',
      'Invoice Number',
      'Tags',
      'Notes'
    ];

    const rows = assets.map(asset => [
      asset.code,
      asset.name,
      asset.description,
      asset.category,
      asset.status,
      new Date(asset.acquisitionDate).toLocaleDateString(),
      asset.acquisitionCost.toFixed(2),
      asset.depreciationMethod.replace('_', ' '),
      asset.usefulLifeYears.toString(),
      asset.residualValue.toFixed(2),
      asset.accumulatedDepreciation.toFixed(2),
      asset.currentBookValue.toFixed(2),
      asset.location || '',
      asset.assignedTo || '',
      asset.department || '',
      asset.supplier || '',
      asset.invoiceNumber || '',
      asset.tags?.join('; ') || '',
      asset.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    return csvContent;
  }

  static initializeDefaultAssets(): FixedAsset[] {
    const defaultAssets: Partial<FixedAssetFormData>[] = [
      {
        code: 'BLDG-001',
        name: 'Head Office Building',
        description: 'Main corporate headquarters building',
        category: 'Land and Buildings',
        acquisitionDate: '2020-01-15',
        acquisitionCost: '2500000',
        depreciationMethod: 'straight_line',
        usefulLifeYears: '50',
        residualValue: '500000',
        depreciationStartDate: '2020-02-01',
        location: 'Downtown Business District',
        department: 'Corporate'
      },
      {
        code: 'VEH-001',
        name: 'Delivery Van - Toyota Hiace',
        description: 'Company delivery vehicle',
        category: 'Vehicles',
        acquisitionDate: '2022-03-10',
        acquisitionCost: '45000',
        depreciationMethod: 'declining_balance',
        usefulLifeYears: '5',
        residualValue: '9000',
        depreciationStartDate: '2022-04-01',
        location: 'Main Warehouse',
        assignedTo: 'Logistics Department'
      },
      {
        code: 'COMP-001',
        name: 'Server Room Equipment',
        description: 'Dell PowerEdge servers and networking equipment',
        category: 'Computer Equipment',
        acquisitionDate: '2021-06-15',
        acquisitionCost: '85000',
        depreciationMethod: 'double_declining',
        usefulLifeYears: '3',
        residualValue: '5000',
        depreciationStartDate: '2021-07-01',
        location: 'IT Server Room',
        department: 'Information Technology'
      },
      {
        code: 'FURN-001',
        name: 'Office Furniture Set',
        description: 'Desks, chairs, and filing cabinets for main office',
        category: 'Furniture and Fixtures',
        acquisitionDate: '2020-08-20',
        acquisitionCost: '25000',
        depreciationMethod: 'straight_line',
        usefulLifeYears: '10',
        residualValue: '2500',
        depreciationStartDate: '2020-09-01',
        location: 'Main Office',
        department: 'Administration'
      },
      {
        code: 'MACH-001',
        name: 'CNC Milling Machine',
        description: 'Haas VF-2SS vertical milling machine',
        category: 'Plant and Machinery',
        acquisitionDate: '2021-11-05',
        acquisitionCost: '125000',
        depreciationMethod: 'units_of_production',
        usefulLifeYears: '10',
        residualValue: '15000',
        depreciationStartDate: '2021-12-01',
        location: 'Manufacturing Floor',
        department: 'Production'
      }
    ];

    const assets: FixedAsset[] = [];
    
    defaultAssets.forEach(assetData => {
      const formData: FixedAssetFormData = {
        code: assetData.code || '',
        name: assetData.name || '',
        description: assetData.description || '',
        category: assetData.category || 'Other Assets',
        subcategory: assetData.subcategory,
        acquisitionDate: assetData.acquisitionDate || new Date().toISOString().split('T')[0],
        acquisitionCost: assetData.acquisitionCost || '0',
        supplier: assetData.supplier,
        invoiceNumber: assetData.invoiceNumber,
        depreciationMethod: assetData.depreciationMethod || 'straight_line',
        usefulLifeYears: assetData.usefulLifeYears || '5',
        residualValue: assetData.residualValue || '0',
        depreciationStartDate: assetData.depreciationStartDate || new Date().toISOString().split('T')[0],
        location: assetData.location,
        assignedTo: assetData.assignedTo,
        department: assetData.department,
        assetAccountCode: assetData.assetAccountCode,
        depreciationAccountCode: assetData.depreciationAccountCode,
        accumulatedDepreciationAccountCode: assetData.accumulatedDepreciationAccountCode,
        notes: assetData.notes,
        tags: ''
      };
      
      const asset = this.createAssetFromFormData(formData);
      assets.push(asset);
    });

    // Save to storage
    FixedAssetsStorageService.saveAssets(assets);
    
    return assets;
  }

  static getAllAssets(): FixedAsset[] {
    const assets = FixedAssetsStorageService.getAssets();
    
    // Update depreciation for assets that need it
    const updatedAssets = assets.map(asset => {
      if (FixedAssetsDepreciationService.needsDepreciationUpdate(asset)) {
        return FixedAssetsDepreciationService.updateAssetDepreciation(asset);
      }
      return asset;
    });
    
    // Save updated assets if any were changed
    if (updatedAssets.some((asset, index) => asset !== assets[index])) {
      FixedAssetsStorageService.saveAssets(updatedAssets);
    }
    
    return updatedAssets;
  }

  static getAssetsByStatus(status: AssetStatus): FixedAsset[] {
    return this.getAllAssets().filter(asset => asset.status === status);
  }

  static getAssetsByCategory(category: AssetCategory): FixedAsset[] {
    return this.getAllAssets().filter(asset => asset.category === category);
  }

  static searchAssets(searchTerm: string): FixedAsset[] {
    const term = searchTerm.toLowerCase();
    return this.getAllAssets().filter(asset => 
      asset.code.toLowerCase().includes(term) ||
      asset.name.toLowerCase().includes(term) ||
      asset.description.toLowerCase().includes(term) ||
      (asset.location && asset.location.toLowerCase().includes(term)) ||
      (asset.tags && asset.tags.some(tag => tag.toLowerCase().includes(term)))
    );
  }

  static disposeAsset(
    asset: FixedAsset,
    disposalData: {
      disposalDate: string;
      disposalMethod: string;
      disposalPrice: number;
      disposalReason: string;
    }
  ): FixedAsset {
    return {
      ...asset,
      status: 'disposed',
      disposalDate: disposalData.disposalDate,
      disposalMethod: disposalData.disposalMethod as any,
      disposalPrice: disposalData.disposalPrice,
      disposalReason: disposalData.disposalReason,
      updatedAt: new Date().toISOString()
    };
  }

  // IFRS Compliance Methods

  /**
   * IAS 16.73 - Component depreciation
   * Break down major assets into components with different useful lives
   */
  static generateIFRSComponentBreakdown(asset: FixedAsset): {
    majorComponents: Array<{
      componentName: string;
      cost: number;
      usefulLife: number;
      depreciationMethod: DepreciationMethod;
      percentage: number;
    }>;
    totalCost: number;
  } {
    // Standard component breakdown based on asset category
    let components: Array<{
      componentName: string;
      percentage: number;
      usefulLife: number;
      depreciationMethod: DepreciationMethod;
    }> = [];

    switch (asset.category) {
      case 'Land and Buildings':
        components = [
          { componentName: 'Land', percentage: 20, usefulLife: 0, depreciationMethod: 'straight_line' }, // Land doesn't depreciate
          { componentName: 'Building Structure', percentage: 60, usefulLife: 50, depreciationMethod: 'straight_line' },
          { componentName: 'Roof and External Works', percentage: 15, usefulLife: 25, depreciationMethod: 'straight_line' },
          { componentName: 'Mechanical Systems', percentage: 5, usefulLife: 15, depreciationMethod: 'straight_line' }
        ];
        break;
      case 'Plant and Machinery':
        components = [
          { componentName: 'Main Equipment', percentage: 70, usefulLife: asset.usefulLifeYears, depreciationMethod: asset.depreciationMethod },
          { componentName: 'Control Systems', percentage: 20, usefulLife: Math.floor(asset.usefulLifeYears * 0.6), depreciationMethod: 'straight_line' },
          { componentName: 'Installation and Setup', percentage: 10, usefulLife: asset.usefulLifeYears, depreciationMethod: 'straight_line' }
        ];
        break;
      case 'Vehicles':
        components = [
          { componentName: 'Engine and Drivetrain', percentage: 60, usefulLife: asset.usefulLifeYears, depreciationMethod: asset.depreciationMethod },
          { componentName: 'Body and Interior', percentage: 30, usefulLife: Math.floor(asset.usefulLifeYears * 1.2), depreciationMethod: 'straight_line' },
          { componentName: 'Electronics and Accessories', percentage: 10, usefulLife: Math.floor(asset.usefulLifeYears * 0.5), depreciationMethod: 'declining_balance' }
        ];
        break;
      default:
        // Single component for simpler assets
        components = [
          { componentName: asset.name, percentage: 100, usefulLife: asset.usefulLifeYears, depreciationMethod: asset.depreciationMethod }
        ];
    }

    const majorComponents = components.map(comp => ({
      componentName: comp.componentName,
      cost: asset.acquisitionCost * (comp.percentage / 100),
      usefulLife: comp.usefulLife,
      depreciationMethod: comp.depreciationMethod,
      percentage: comp.percentage
    }));

    return {
      majorComponents,
      totalCost: asset.acquisitionCost
    };
  }

  /**
   * IAS 36 - Impairment Testing
   * Test if carrying amount exceeds recoverable amount
   */
  static performImpairmentTest(asset: FixedAsset, params: {
    fairValueLessSellingCosts?: number;
    valueInUse?: number;
    marketIndications?: string[];
    externalEvidence?: string[];
  }): {
    carryingAmount: number;
    recoverableAmount: number;
    impairmentLoss: number;
    impairmentRequired: boolean;
    impairmentReasons: string[];
  } {
    const carryingAmount = asset.currentBookValue;
    
    // Calculate recoverable amount (higher of fair value less costs to sell and value in use)
    const fairValueLessCosts = params.fairValueLessSellingCosts || 0;
    const valueInUse = params.valueInUse || 0;
    const recoverableAmount = Math.max(fairValueLessCosts, valueInUse);
    
    const impairmentLoss = Math.max(0, carryingAmount - recoverableAmount);
    const impairmentRequired = impairmentLoss > 0;
    
    const impairmentReasons: string[] = [];
    if (impairmentRequired) {
      if (params.marketIndications?.length) {
        impairmentReasons.push('Market value decline: ' + params.marketIndications.join(', '));
      }
      if (params.externalEvidence?.length) {
        impairmentReasons.push('External evidence: ' + params.externalEvidence.join(', '));
      }
      if (recoverableAmount === fairValueLessCosts && fairValueLessCosts > 0) {
        impairmentReasons.push('Based on fair value less selling costs');
      } else if (recoverableAmount === valueInUse && valueInUse > 0) {
        impairmentReasons.push('Based on value in use calculation');
      }
    }

    return {
      carryingAmount,
      recoverableAmount,
      impairmentLoss,
      impairmentRequired,
      impairmentReasons
    };
  }

  /**
   * IAS 16.29 - Revaluation Model
   * Support for fair value revaluation instead of cost model
   */
  static performRevaluation(asset: FixedAsset, params: {
    newFairValue: number;
    revaluationDate: string;
    valuationMethod: 'market_approach' | 'cost_approach' | 'income_approach';
    valuerId: string;
    valuationReport?: string;
  }): {
    revaluedAsset: FixedAsset;
    revaluationSurplus: number;
    revaluationDeficit: number;
    revaluationReserve: number;
    adjustments: Array<{
      description: string;
      amount: number;
      accountImpact: string;
    }>;
  } {
    const carryingAmount = asset.currentBookValue;
    const revaluationGain = params.newFairValue - carryingAmount;
    
    let revaluationSurplus = 0;
    const revaluationDeficit = 0;
    
    if (revaluationGain > 0) {
      revaluationSurplus = revaluationGain;
    } else {
      revaluationDeficit = Math.abs(revaluationGain);
    }

    // Reset accumulated depreciation and adjust cost
    const revaluedAsset: FixedAsset = {
      ...asset,
      acquisitionCost: params.newFairValue,
      accumulatedDepreciation: 0,
      currentBookValue: params.newFairValue,
      lastDepreciationDate: params.revaluationDate,
      updatedAt: new Date().toISOString()
    };

    const adjustments = [
      {
        description: 'Reset accumulated depreciation to zero',
        amount: asset.accumulatedDepreciation,
        accountImpact: 'Debit Accumulated Depreciation'
      },
      {
        description: 'Adjust asset cost to fair value',
        amount: params.newFairValue - asset.acquisitionCost,
        accountImpact: revaluationGain > 0 ? 'Credit Revaluation Reserve' : 'Debit Revaluation Loss'
      }
    ];

    return {
      revaluedAsset,
      revaluationSurplus,
      revaluationDeficit,
      revaluationReserve: revaluationSurplus, // Accumulated in equity
      adjustments
    };
  }

  /**
   * IAS 16.43 - Useful life review
   * Annual review of useful life and depreciation method
   */
  static reviewUsefulLife(asset: FixedAsset, params: {
    newUsefulLife?: number;
    newDepreciationMethod?: DepreciationMethod;
    newResidualValue?: number;
    reviewDate: string;
    reviewReasons: string[];
  }): {
    updatedAsset: FixedAsset;
    changeInDepreciation: number;
    prospectiveAdjustment: boolean;
    adjustmentReasons: string[];
  } {
    const originalAnnualDepreciation = FixedAssetsDepreciationService.calculateDepreciation({
      method: asset.depreciationMethod,
      cost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLife: asset.usefulLifeYears,
      currentYear: 1
    });

    const updatedAsset: FixedAsset = {
      ...asset,
      usefulLifeYears: params.newUsefulLife || asset.usefulLifeYears,
      depreciationMethod: params.newDepreciationMethod || asset.depreciationMethod,
      residualValue: params.newResidualValue !== undefined ? params.newResidualValue : asset.residualValue,
      updatedAt: new Date().toISOString()
    };

    const newAnnualDepreciation = FixedAssetsDepreciationService.calculateDepreciation({
      method: updatedAsset.depreciationMethod,
      cost: updatedAsset.acquisitionCost,
      residualValue: updatedAsset.residualValue,
      usefulLife: updatedAsset.usefulLifeYears,
      currentYear: 1
    });

    const changeInDepreciation = newAnnualDepreciation - originalAnnualDepreciation;

    return {
      updatedAsset,
      changeInDepreciation,
      prospectiveAdjustment: true, // IAS 8 requires prospective application
      adjustmentReasons: params.reviewReasons
    };
  }

  /**
   * Generate IFRS disclosure requirements
   */
  static generateIFRSDisclosures(assets: FixedAsset[]): {
    reconciliationMovement: {
      category: AssetCategory;
      openingBalance: number;
      additions: number;
      disposals: number;
      depreciation: number;
      impairment: number;
      revaluation: number;
      closingBalance: number;
    }[];
    depreciationMethods: {
      category: AssetCategory;
      method: DepreciationMethod;
      usefulLifeRange: string;
      residualValuePolicy: string;
    }[];
    commitments: {
      contractualCommitments: number;
      capitalExpenditureAuthorized: number;
      capitalExpenditureContracted: number;
    };
    restrictionsAndPledges: string[];
  } {
    const categories = Array.from(new Set(assets.map(asset => asset.category)));
    
    const reconciliationMovement = categories.map(category => {
      const categoryAssets = assets.filter(asset => asset.category === category);
      
      return {
        category,
        openingBalance: categoryAssets.reduce((sum, asset) => sum + asset.acquisitionCost, 0),
        additions: categoryAssets.filter(asset => {
          const acquisitionDate = new Date(asset.acquisitionDate);
          const currentYear = new Date().getFullYear();
          return acquisitionDate.getFullYear() === currentYear;
        }).reduce((sum, asset) => sum + asset.acquisitionCost, 0),
        disposals: categoryAssets.filter(asset => asset.status === 'disposed').reduce((sum, asset) => sum + (asset.disposalPrice || 0), 0),
        depreciation: categoryAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0),
        impairment: 0, // Would need impairment tracking
        revaluation: 0, // Would need revaluation tracking
        closingBalance: categoryAssets.reduce((sum, asset) => sum + asset.currentBookValue, 0)
      };
    });

    const depreciationMethods = categories.map(category => {
      const categoryAssets = assets.filter(asset => asset.category === category);
      const usefulLives = categoryAssets.map(asset => asset.usefulLifeYears);
      const minLife = Math.min(...usefulLives);
      const maxLife = Math.max(...usefulLives);
      
      return {
        category,
        method: categoryAssets[0]?.depreciationMethod || 'straight_line',
        usefulLifeRange: minLife === maxLife ? `${minLife} years` : `${minLife}-${maxLife} years`,
        residualValuePolicy: 'Estimated based on expected disposal value at end of useful life'
      };
    });

    return {
      reconciliationMovement,
      depreciationMethods,
      commitments: {
        contractualCommitments: 0,
        capitalExpenditureAuthorized: 0,
        capitalExpenditureContracted: 0
      },
      restrictionsAndPledges: ['No assets are pledged as security for liabilities']
    };
  }
}