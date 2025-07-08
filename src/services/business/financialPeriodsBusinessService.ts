import { 
  FinancialPeriod, 
  FinancialYear, 
  FinancialPeriodsSettings,
  PeriodType,
  PeriodFilter,
  PeriodFormData,
  PeriodClosingData,
  PeriodClosingEntry,
  AccountBalance,
  PeriodComparison,
  ComparativeAccountBalance,
  PeriodValidationRule,
  PERIOD_VALIDATION_RULES
} from '../../types/financialPeriods.types';
import { FinancialPeriodsStorageService } from '../storage/financialPeriodsStorageService';
import { ChartOfAccountsStorageService } from '../storage/chartOfAccountsStorageService';

export class FinancialPeriodsBusinessService {
  
  // Period Management
  static createPeriod(formData: PeriodFormData): FinancialPeriod {
    const now = new Date().toISOString();
    const period: FinancialPeriod = {
      id: this.generateId(),
      name: formData.name,
      startDate: formData.startDate,
      endDate: formData.endDate,
      periodType: formData.periodType,
      fiscalYear: formData.fiscalYear,
      isClosed: false,
      isActive: true,
      parentPeriodId: formData.parentPeriodId,
      createdAt: now,
      updatedAt: now
    };

    // Validate period before saving
    this.validatePeriod(period);
    
    FinancialPeriodsStorageService.savePeriod(period);
    return period;
  }

  static updatePeriod(periodId: string, updates: Partial<PeriodFormData>): FinancialPeriod {
    const existingPeriod = FinancialPeriodsStorageService.getPeriodById(periodId);
    if (!existingPeriod) {
      throw new Error('Period not found');
    }

    if (existingPeriod.isClosed) {
      throw new Error('Cannot update a closed period');
    }

    const updatedPeriod: FinancialPeriod = {
      ...existingPeriod,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.validatePeriod(updatedPeriod);
    FinancialPeriodsStorageService.savePeriod(updatedPeriod);
    return updatedPeriod;
  }

  static deletePeriod(periodId: string): void {
    const period = FinancialPeriodsStorageService.getPeriodById(periodId);
    if (!period) {
      throw new Error('Period not found');
    }

    if (period.isClosed) {
      throw new Error('Cannot delete a closed period');
    }

    // Check for dependent periods (child periods)
    const allPeriods = FinancialPeriodsStorageService.getAllPeriods();
    const dependentPeriods = allPeriods.filter(p => p.parentPeriodId === periodId);
    if (dependentPeriods.length > 0) {
      throw new Error('Cannot delete period with dependent sub-periods');
    }

    FinancialPeriodsStorageService.deletePeriod(periodId);
    FinancialPeriodsStorageService.deleteAccountBalances(periodId);
  }

  // Period Filtering and Querying
  static getFilteredPeriods(filter: PeriodFilter): FinancialPeriod[] {
    let periods = FinancialPeriodsStorageService.getAllPeriods();

    if (filter.fiscalYear !== 'all') {
      periods = periods.filter(p => p.fiscalYear === filter.fiscalYear);
    }

    if (filter.periodType !== 'all') {
      periods = periods.filter(p => p.periodType === filter.periodType);
    }

    if (filter.status !== 'all') {
      periods = periods.filter(p => 
        filter.status === 'closed' ? p.isClosed : !p.isClosed
      );
    }

    if (filter.dateRange) {
      periods = periods.filter(p => 
        p.startDate >= filter.dateRange!.startDate && 
        p.endDate <= filter.dateRange!.endDate
      );
    }

    return periods.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  static getCurrentPeriod(): FinancialPeriod | null {
    const periods = FinancialPeriodsStorageService.getAllPeriods();
    const today = new Date().toISOString().split('T')[0];
    
    return periods.find(p => 
      p.isActive && 
      !p.isClosed && 
      p.startDate <= today && 
      p.endDate >= today
    ) || null;
  }

  static getActivePeriods(): FinancialPeriod[] {
    return FinancialPeriodsStorageService.getAllPeriods()
      .filter(p => p.isActive)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }

  // Financial Year Management
  static createFinancialYear(year: number, settings: FinancialPeriodsSettings): FinancialYear {
    const startDate = this.calculateFiscalYearStart(year, settings);
    const endDate = this.calculateFiscalYearEnd(year, settings);
    
    const financialYear: FinancialYear = {
      id: this.generateId(),
      year,
      startDate,
      endDate,
      isActive: true,
      periods: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    FinancialPeriodsStorageService.saveYear(financialYear);

    // Auto-create periods if enabled
    if (settings.autoCreatePeriods) {
      this.autoCreatePeriods(financialYear, settings);
    }

    return financialYear;
  }

  static autoCreatePeriods(year: FinancialYear, settings: FinancialPeriodsSettings): FinancialPeriod[] {
    const periods: FinancialPeriod[] = [];
    
    // Create annual period
    const annualPeriod = this.createPeriod({
      name: `FY ${year.year}`,
      startDate: year.startDate,
      endDate: year.endDate,
      periodType: 'Annual',
      fiscalYear: year.year
    });
    periods.push(annualPeriod);

    // Create quarterly periods based on default type
    if (settings.defaultPeriodType === 'Quarterly' || settings.defaultPeriodType === 'Monthly') {
      const quarterlyPeriods = this.createQuarterlyPeriods(year, annualPeriod.id);
      periods.push(...quarterlyPeriods);

      if (settings.defaultPeriodType === 'Monthly') {
        quarterlyPeriods.forEach(quarter => {
          const monthlyPeriods = this.createMonthlyPeriods(quarter);
          periods.push(...monthlyPeriods);
        });
      }
    }

    return periods;
  }

  private static createQuarterlyPeriods(year: FinancialYear, parentId: string): FinancialPeriod[] {
    const periods: FinancialPeriod[] = [];
    const startDate = new Date(year.startDate);
    
    for (let quarter = 1; quarter <= 4; quarter++) {
      const quarterStart = new Date(startDate);
      quarterStart.setMonth(startDate.getMonth() + (quarter - 1) * 3);
      
      const quarterEnd = new Date(quarterStart);
      quarterEnd.setMonth(quarterStart.getMonth() + 3);
      quarterEnd.setDate(quarterEnd.getDate() - 1);
      
      const period = this.createPeriod({
        name: `Q${quarter} ${year.year}`,
        startDate: quarterStart.toISOString().split('T')[0],
        endDate: quarterEnd.toISOString().split('T')[0],
        periodType: 'Quarterly',
        fiscalYear: year.year,
        parentPeriodId: parentId
      });
      
      periods.push(period);
    }
    
    return periods;
  }

  private static createMonthlyPeriods(quarterPeriod: FinancialPeriod): FinancialPeriod[] {
    const periods: FinancialPeriod[] = [];
    const startDate = new Date(quarterPeriod.startDate);
    const endDate = new Date(quarterPeriod.endDate);
    
    let currentMonth = new Date(startDate);
    let monthNumber = 1;
    
    while (currentMonth <= endDate) {
      const monthStart = new Date(currentMonth);
      const monthEnd = new Date(currentMonth);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setDate(monthEnd.getDate() - 1);
      
      if (monthEnd > endDate) {
        monthEnd.setTime(endDate.getTime());
      }
      
      const period = this.createPeriod({
        name: `${monthStart.toLocaleString('default', { month: 'long' })} ${quarterPeriod.fiscalYear}`,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0],
        periodType: 'Monthly',
        fiscalYear: quarterPeriod.fiscalYear,
        parentPeriodId: quarterPeriod.id
      });
      
      periods.push(period);
      
      currentMonth.setMonth(currentMonth.getMonth() + 1);
      monthNumber++;
    }
    
    return periods;
  }

  // Period Closing
  static closePeriod(periodId: string, closedBy: string, notes?: string): PeriodClosingData {
    const period = FinancialPeriodsStorageService.getPeriodById(periodId);
    if (!period) {
      throw new Error('Period not found');
    }

    if (period.isClosed) {
      throw new Error('Period is already closed');
    }

    // Validate period can be closed
    this.validatePeriodClosing(period);

    // Generate closing entries
    const closingEntries = this.generateClosingEntries(periodId);
    const retainedEarningsTransfer = this.calculateRetainedEarningsTransfer(closingEntries);
    const finalBalances = this.calculateFinalBalances(periodId);

    const closingData: PeriodClosingData = {
      periodId,
      closingEntries,
      retainedEarningsTransfer,
      finalBalances,
      closedBy,
      closedAt: new Date().toISOString(),
      notes
    };

    // Save closing data
    FinancialPeriodsStorageService.savePeriodClosing(closingData);

    // Update period status
    const updatedPeriod: FinancialPeriod = {
      ...period,
      isClosed: true,
      closedAt: closingData.closedAt,
      closedBy,
      updatedAt: new Date().toISOString()
    };

    FinancialPeriodsStorageService.savePeriod(updatedPeriod);

    return closingData;
  }

  static reopenPeriod(periodId: string): void {
    const period = FinancialPeriodsStorageService.getPeriodById(periodId);
    if (!period) {
      throw new Error('Period not found');
    }

    if (!period.isClosed) {
      throw new Error('Period is not closed');
    }

    const settings = this.getSettings();
    if (!settings?.allowPriorPeriodAdjustments) {
      throw new Error('Prior period adjustments are not allowed');
    }

    // Remove closing data
    // Note: In a real system, you might want to keep audit trail
    const updatedPeriod: FinancialPeriod = {
      ...period,
      isClosed: false,
      closedAt: undefined,
      closedBy: undefined,
      updatedAt: new Date().toISOString()
    };

    FinancialPeriodsStorageService.savePeriod(updatedPeriod);
  }

  // Period Comparison
  static comparePeriods(currentPeriodId: string, comparativePeriodId: string): PeriodComparison {
    const currentPeriod = FinancialPeriodsStorageService.getPeriodById(currentPeriodId);
    const comparativePeriod = FinancialPeriodsStorageService.getPeriodById(comparativePeriodId);

    if (!currentPeriod || !comparativePeriod) {
      throw new Error('One or both periods not found');
    }

    const currentBalances = FinancialPeriodsStorageService.getAccountBalances(currentPeriodId);
    const comparativeBalances = FinancialPeriodsStorageService.getAccountBalances(comparativePeriodId);

    const accountBalances = this.calculateComparativeBalances(currentBalances, comparativeBalances);

    return {
      currentPeriod,
      comparativePeriod,
      accountBalances
    };
  }

  // Settings Management
  static getSettings(): FinancialPeriodsSettings | null {
    return FinancialPeriodsStorageService.getSettings();
  }

  static saveSettings(settings: Partial<FinancialPeriodsSettings>): FinancialPeriodsSettings {
    const existing = this.getSettings();
    const now = new Date().toISOString();
    
    const newSettings: FinancialPeriodsSettings = {
      fiscalYearStartMonth: 1,
      fiscalYearStartDay: 1,
      defaultPeriodType: 'Annual',
      autoCreatePeriods: true,
      requirePeriodClosing: true,
      allowPriorPeriodAdjustments: false,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      ...existing,
      ...settings
    };

    FinancialPeriodsStorageService.saveSettings(newSettings);
    return newSettings;
  }

  // Validation
  static validatePeriod(period: FinancialPeriod): void {
    const errors: string[] = [];
    const existingPeriods = FinancialPeriodsStorageService.getAllPeriods()
      .filter(p => p.id !== period.id);

    // Check date validity
    if (new Date(period.startDate) >= new Date(period.endDate)) {
      errors.push('Start date must be before end date');
    }

    // Check for overlapping periods
    const overlapping = existingPeriods.find(p => 
      p.fiscalYear === period.fiscalYear &&
      ((period.startDate >= p.startDate && period.startDate <= p.endDate) ||
       (period.endDate >= p.startDate && period.endDate <= p.endDate) ||
       (period.startDate <= p.startDate && period.endDate >= p.endDate))
    );

    if (overlapping) {
      errors.push(`Period overlaps with existing period: ${overlapping.name}`);
    }

    if (errors.length > 0) {
      throw new Error(errors.join('; '));
    }
  }

  private static validatePeriodClosing(period: FinancialPeriod): void {
    // Check if there are any open child periods
    const allPeriods = FinancialPeriodsStorageService.getAllPeriods();
    const openChildPeriods = allPeriods.filter(p => 
      p.parentPeriodId === period.id && !p.isClosed
    );

    if (openChildPeriods.length > 0) {
      throw new Error('Cannot close period with open sub-periods');
    }
  }

  // Utility methods
  private static generateId(): string {
    return `period_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static calculateFiscalYearStart(year: number, settings: FinancialPeriodsSettings): string {
    const date = new Date(year, settings.fiscalYearStartMonth - 1, settings.fiscalYearStartDay);
    return date.toISOString().split('T')[0];
  }

  private static calculateFiscalYearEnd(year: number, settings: FinancialPeriodsSettings): string {
    const date = new Date(year + 1, settings.fiscalYearStartMonth - 1, settings.fiscalYearStartDay - 1);
    return date.toISOString().split('T')[0];
  }

  private static generateClosingEntries(periodId: string): PeriodClosingEntry[] {
    // This would integrate with your transaction system
    // For now, return empty array - to be implemented with transaction integration
    return [];
  }

  private static calculateRetainedEarningsTransfer(closingEntries: PeriodClosingEntry[]) {
    const netIncome = closingEntries.reduce((sum, entry) => {
      if (entry.entryType === 'Income') return sum + entry.creditAmount - entry.debitAmount;
      if (entry.entryType === 'Expense') return sum + entry.debitAmount - entry.creditAmount;
      return sum;
    }, 0);

    return {
      netIncome,
      retainedEarningsAccountId: '', // Would be set from settings
      transferDate: new Date().toISOString(),
      description: `Net income transfer for period`
    };
  }

  private static calculateFinalBalances(periodId: string): AccountBalance[] {
    // This would calculate balances from the transaction system
    // For now, return empty array - to be implemented with transaction integration
    return [];
  }

  private static calculateComparativeBalances(
    currentBalances: AccountBalance[], 
    comparativeBalances: AccountBalance[]
  ): ComparativeAccountBalance[] {
    const comparativeMap = new Map(
      comparativeBalances.map(b => [b.accountId, b.closingBalance])
    );

    return currentBalances.map(current => {
      const comparativeBalance = comparativeMap.get(current.accountId) || 0;
      const variance = current.closingBalance - comparativeBalance;
      const variancePercentage = comparativeBalance !== 0 
        ? (variance / Math.abs(comparativeBalance)) * 100 
        : 0;

      return {
        accountId: current.accountId,
        accountCode: current.accountCode,
        accountName: current.accountName,
        accountType: current.accountType,
        currentBalance: current.closingBalance,
        comparativeBalance,
        variance,
        variancePercentage
      };
    });
  }
}