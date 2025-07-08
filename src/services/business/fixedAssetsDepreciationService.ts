import { 
  FixedAsset, 
  DepreciationMethod, 
  DepreciationParams,
  DepreciationScheduleEntry 
} from '@/types/fixedAssets.types';

export class FixedAssetsDepreciationService {
  /**
   * Calculate depreciation for a given period
   */
  static calculateDepreciation(params: DepreciationParams): number {
    const { method, cost, residualValue, usefulLife, currentYear, unitsProduced, totalUnitsExpected } = params;

    // Ensure we don't depreciate below residual value
    const depreciableAmount = cost - residualValue;
    if (depreciableAmount <= 0) return 0;

    switch (method) {
      case 'straight_line':
        return this.calculateStraightLine(depreciableAmount, usefulLife);

      case 'declining_balance':
        return this.calculateDecliningBalance(cost, residualValue, usefulLife, currentYear, 1);

      case 'double_declining':
        return this.calculateDecliningBalance(cost, residualValue, usefulLife, currentYear, 2);

      case 'units_of_production':
        if (!unitsProduced || !totalUnitsExpected) return 0;
        return this.calculateUnitsOfProduction(depreciableAmount, unitsProduced, totalUnitsExpected);

      case 'sum_of_years':
        return this.calculateSumOfYears(depreciableAmount, usefulLife, currentYear);

      default:
        return 0;
    }
  }

  /**
   * Straight-line depreciation
   */
  private static calculateStraightLine(depreciableAmount: number, usefulLife: number): number {
    if (usefulLife <= 0) return 0;
    return depreciableAmount / usefulLife;
  }

  /**
   * Declining balance depreciation (can be single or double)
   */
  private static calculateDecliningBalance(
    cost: number,
    residualValue: number,
    usefulLife: number,
    currentYear: number,
    factor: number = 1
  ): number {
    if (usefulLife <= 0 || currentYear < 1) return 0;

    const rate = (factor / usefulLife);
    let bookValue = cost;
    let totalDepreciation = 0;

    // Calculate depreciation for previous years
    for (let year = 1; year < currentYear; year++) {
      const yearDepreciation = bookValue * rate;
      totalDepreciation += yearDepreciation;
      bookValue = cost - totalDepreciation;
    }

    // Calculate depreciation for current year
    const currentYearDepreciation = bookValue * rate;
    
    // Ensure we don't depreciate below residual value
    const maxDepreciation = bookValue - residualValue;
    return Math.min(currentYearDepreciation, maxDepreciation);
  }

  /**
   * Units of production depreciation
   */
  private static calculateUnitsOfProduction(
    depreciableAmount: number,
    unitsProduced: number,
    totalUnitsExpected: number
  ): number {
    if (totalUnitsExpected <= 0) return 0;
    const depreciationPerUnit = depreciableAmount / totalUnitsExpected;
    return depreciationPerUnit * unitsProduced;
  }

  /**
   * Sum of years' digits depreciation
   */
  private static calculateSumOfYears(
    depreciableAmount: number,
    usefulLife: number,
    currentYear: number
  ): number {
    if (usefulLife <= 0 || currentYear < 1 || currentYear > usefulLife) return 0;

    // Calculate sum of years
    const sumOfYears = (usefulLife * (usefulLife + 1)) / 2;
    
    // Calculate depreciation fraction for current year
    const remainingYears = usefulLife - currentYear + 1;
    const fraction = remainingYears / sumOfYears;
    
    return depreciableAmount * fraction;
  }

  /**
   * Generate a complete depreciation schedule for an asset
   */
  static generateDepreciationSchedule(asset: FixedAsset): DepreciationScheduleEntry[] {
    const schedule: DepreciationScheduleEntry[] = [];
    const startDate = new Date(asset.depreciationStartDate);
    const acquisitionCost = asset.acquisitionCost;
    const residualValue = asset.residualValue;
    const usefulLife = asset.usefulLifeYears;
    
    let accumulatedDepreciation = 0;
    let bookValue = acquisitionCost;

    for (let year = 1; year <= usefulLife && bookValue > residualValue; year++) {
      const periodStart = new Date(startDate);
      periodStart.setFullYear(periodStart.getFullYear() + year - 1);
      
      const periodEnd = new Date(periodStart);
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      periodEnd.setDate(periodEnd.getDate() - 1);

      const openingBalance = bookValue;
      
      const depreciationAmount = this.calculateDepreciation({
        method: asset.depreciationMethod,
        cost: acquisitionCost,
        residualValue: residualValue,
        usefulLife: usefulLife,
        currentYear: year
      });

      // Ensure we don't depreciate below residual value
      const actualDepreciation = Math.min(depreciationAmount, bookValue - residualValue);
      
      accumulatedDepreciation += actualDepreciation;
      bookValue = acquisitionCost - accumulatedDepreciation;

      schedule.push({
        period: `Year ${year}`,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString(),
        openingBalance: openingBalance,
        depreciationAmount: actualDepreciation,
        closingBalance: bookValue,
        accumulatedDepreciation: accumulatedDepreciation
      });
    }

    return schedule;
  }

  /**
   * Calculate current period depreciation for an asset
   */
  static calculateCurrentPeriodDepreciation(asset: FixedAsset): number {
    const currentDate = new Date();
    const depreciationStartDate = new Date(asset.depreciationStartDate);
    
    // Check if depreciation has started
    if (currentDate < depreciationStartDate) return 0;
    
    // Check if asset is fully depreciated
    if (asset.currentBookValue <= asset.residualValue) return 0;
    
    // Calculate years since depreciation started
    const yearsElapsed = Math.floor(
      (currentDate.getTime() - depreciationStartDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
    );
    
    const currentYear = yearsElapsed + 1;
    
    // Don't depreciate beyond useful life
    if (currentYear > asset.usefulLifeYears) return 0;
    
    return this.calculateDepreciation({
      method: asset.depreciationMethod,
      cost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLife: asset.usefulLifeYears,
      currentYear: currentYear
    });
  }

  /**
   * Update asset with latest depreciation calculations
   */
  static updateAssetDepreciation(asset: FixedAsset): FixedAsset {
    const currentDate = new Date();
    const depreciationStartDate = new Date(asset.depreciationStartDate);
    
    // Check if depreciation should be calculated
    if (currentDate < depreciationStartDate || asset.status !== 'active') {
      return asset;
    }
    
    // Calculate total depreciation up to current date
    const monthsElapsed = Math.floor(
      (currentDate.getTime() - depreciationStartDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    );
    
    const yearsElapsed = monthsElapsed / 12;
    let totalDepreciation = 0;
    
    // Calculate depreciation for each year up to current
    for (let year = 1; year <= Math.ceil(yearsElapsed) && year <= asset.usefulLifeYears; year++) {
      const yearDepreciation = this.calculateDepreciation({
        method: asset.depreciationMethod,
        cost: asset.acquisitionCost,
        residualValue: asset.residualValue,
        usefulLife: asset.usefulLifeYears,
        currentYear: year
      });
      
      // For the current year, prorate based on months
      if (year === Math.ceil(yearsElapsed)) {
        const monthsInCurrentYear = (yearsElapsed % 1) * 12;
        totalDepreciation += (yearDepreciation * monthsInCurrentYear) / 12;
      } else {
        totalDepreciation += yearDepreciation;
      }
    }
    
    // Ensure we don't depreciate below residual value
    const maxDepreciation = asset.acquisitionCost - asset.residualValue;
    totalDepreciation = Math.min(totalDepreciation, maxDepreciation);
    
    return {
      ...asset,
      accumulatedDepreciation: totalDepreciation,
      currentBookValue: asset.acquisitionCost - totalDepreciation,
      lastDepreciationDate: currentDate.toISOString(),
      updatedAt: currentDate.toISOString()
    };
  }

  /**
   * Check if an asset needs depreciation update
   */
  static needsDepreciationUpdate(asset: FixedAsset): boolean {
    if (asset.status !== 'active') return false;
    if (asset.currentBookValue <= asset.residualValue) return false;
    
    const lastUpdate = asset.lastDepreciationDate ? new Date(asset.lastDepreciationDate) : new Date(asset.depreciationStartDate);
    const currentDate = new Date();
    
    // Update if more than a month has passed
    const monthsSinceUpdate = Math.floor(
      (currentDate.getTime() - lastUpdate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    );
    
    return monthsSinceUpdate >= 1;
  }

  /**
   * Calculate monthly depreciation for an asset
   */
  static calculateMonthlyDepreciation(asset: FixedAsset): number {
    if (asset.status !== 'active') return 0;
    if (asset.currentBookValue <= asset.residualValue) return 0;
    
    // Get annual depreciation
    const currentYear = this.getCurrentDepreciationYear(asset);
    const params: DepreciationParams = {
      method: asset.depreciationMethod,
      cost: asset.acquisitionCost,
      residualValue: asset.residualValue,
      usefulLife: asset.usefulLifeYears,
      currentYear
    };
    
    const annualDepreciation = this.calculateDepreciation(params);
    
    // Convert to monthly (divide by 12)
    const monthlyDepreciation = annualDepreciation / 12;
    
    // Ensure we don't depreciate below residual value
    const remainingDepreciable = asset.currentBookValue - asset.residualValue;
    
    return Math.min(monthlyDepreciation, remainingDepreciable);
  }

  /**
   * Get the current depreciation year for an asset
   */
  private static getCurrentDepreciationYear(asset: FixedAsset): number {
    const startDate = new Date(asset.depreciationStartDate);
    const currentDate = new Date();
    
    const yearsDiff = (currentDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    
    return Math.floor(yearsDiff) + 1; // Start from year 1
  }

  /**
   * Calculate disposal gain or loss
   */
  static calculateDisposalGainLoss(asset: FixedAsset, disposalPrice: number): number {
    return disposalPrice - asset.currentBookValue;
  }
}