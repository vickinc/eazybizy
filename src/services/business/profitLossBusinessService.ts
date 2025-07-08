import { BookkeepingEntry, Company, ChartOfAccount } from '@/types';
import { 
  ProfitLossData, 
  FinancialStatementItem, 
  FinancialStatementSection,
  StatementPeriod,
  StatementMetadata,
  CalculationContext,
  StatementValidationResult,
  StatementCalculationResult
} from '@/types/financialStatements.types';
import { FixedAsset } from '@/types/fixedAssets.types';
import { IFRSSettings, CompanySettings } from '@/types/settings.types';
import { ChartOfAccountsBusinessService } from './chartOfAccountsBusinessService';
import { BookkeepingBusinessService } from './bookkeepingBusinessService';
import { CurrencyService } from './currencyService';
import { FixedAssetsBusinessService } from './fixedAssetsBusinessService';
import { FixedAssetsDepreciationService } from './fixedAssetsDepreciationService';

export interface PLSection {
  name: string;
  categories: string[];
  total: number;
  items: Array<{
    category: string;
    amount: number;
    count: number;
    formattedAmount: string;
  }>;
  formattedTotal: string;
}

export interface PLData {
  revenue: PLSection;
  cogs: PLSection;
  grossProfit: number;
  operatingExpenses: PLSection;
  operatingIncome: number;
  otherIncome: PLSection;
  otherExpenses: PLSection;
  netOtherIncome: number;
  netIncome: number;
  totalRevenue: number;
  totalExpenses: number;
  grossProfitMargin: number;
  operatingMargin: number;
  netProfitMargin: number;
  formattedGrossProfit: string;
  formattedOperatingIncome: string;
  formattedNetIncome: string;
  formattedTotalRevenue: string;
  formattedTotalExpenses: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PLSummary {
  totalRevenue: number;
  totalExpenses: number;
  netIncome: number;
  grossProfitMargin: number;
  netProfitMargin: number;
  operatingMargin: number;
  formattedTotalRevenue: string;
  formattedTotalExpenses: string;
  formattedNetIncome: string;
  hasData: boolean;
}

export interface PLComparison {
  revenue: { current: number; comparison: number; change: number; changeFormatted: string };
  expenses: { current: number; comparison: number; change: number; changeFormatted: string };
  netIncome: { current: number; comparison: number; change: number; changeFormatted: string };
}

export interface EnhancedPLData {
  plData: PLData;
  summary: PLSummary;
  comparison?: PLComparison;
  periodName: string;
  companyName: string;
  hasRevenue: boolean;
  hasExpenses: boolean;
  isEmpty: boolean;
}

export class ProfitLossBusinessService {
  static readonly REVENUE_CATEGORIES = [
    'Sales Revenue', 'Service Revenue', 'Product Sales',
    'Consulting', 'Licensing'
  ];

  static readonly COGS_CATEGORIES = [
    'COGS', 'Cost of Service'
  ];

  static readonly OPERATING_EXPENSE_CATEGORIES = [
    'Payroll and benefits', 'Rent and utilities', 'Supplies and equipment',
    'Marketing and advertising', 'Insurance', 'Professional services',
    'Subscriptions and software', 'Maintenance and repairs'
  ];

  static readonly OTHER_INCOME_CATEGORIES = [
    'Interest Income', 'Investment Returns'
  ];

  static readonly OTHER_EXPENSE_CATEGORIES = [
    'Interest Expense', 'Taxes', 'Debt payments', 'Travel and entertainment',
    'Inventory costs', 'Other'
  ];

  /**
   * Generate IFRS-compliant Profit & Loss Statement
   */
  static async generateIFRSProfitLoss(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): Promise<StatementCalculationResult<ProfitLossData>> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const validation: StatementValidationResult[] = [];

    try {
      // Get all accounts from Chart of Accounts
      const allAccounts = ChartOfAccountsBusinessService.getAllAccounts();
      
      // Get account balances for current period
      const currentBalances = await this.getAccountBalances(allAccounts, currentPeriod);
      
      // Get prior period balances if comparative reporting is enabled
      let priorBalances: { [accountId: string]: number } = {};
      if (priorPeriod) {
        priorBalances = await this.getAccountBalances(allAccounts, priorPeriod);
      }

      // Create calculation context
      const context: CalculationContext = {
        currentPeriod,
        priorPeriod,
        functionalCurrency: ifrsSettings?.functionalCurrency || 'USD',
        materialityThreshold: ifrsSettings?.materialityThreshold || 5,
        roundingPrecision: ifrsSettings?.roundingPrecision || 2,
        consolidationRequired: ifrsSettings?.consolidationRequired || false,
        ifrsCompliant: ifrsSettings?.accountingStandard === 'IFRS',
        auditRequired: ifrsSettings?.externalAuditRequired || false
      };

      // Build metadata
      const metadata = this.buildStatementMetadata(currentPeriod, priorPeriod, context, companySettings);

      // Calculate P&L sections using IFRS structure
      const revenue = this.calculateRevenueSection(allAccounts, currentBalances, priorBalances, context);
      const costOfSales = this.calculateCostOfSalesSection(allAccounts, currentBalances, priorBalances, context);
      const operatingExpenses = this.calculateOperatingExpensesSection(allAccounts, currentBalances, priorBalances, context);
      const financeIncome = this.calculateFinanceIncomeSection(allAccounts, currentBalances, priorBalances, context);
      const financeCosts = this.calculateFinanceCostsSection(allAccounts, currentBalances, priorBalances, context);
      const taxExpense = this.calculateTaxExpenseSection(allAccounts, currentBalances, priorBalances, context);

      // Calculate key metrics
      const grossProfit = this.calculateMetric(revenue.total, costOfSales.total, revenue.priorTotal, costOfSales.priorTotal, context);
      const operatingProfit = this.calculateMetric(
        grossProfit.current - operatingExpenses.total, 
        0,
        grossProfit.prior ? grossProfit.prior - (operatingExpenses.priorTotal || 0) : undefined,
        0,
        context
      );
      const profitBeforeTax = this.calculateMetric(
        operatingProfit.current + financeIncome.total - financeCosts.total,
        0,
        operatingProfit.prior ? operatingProfit.prior + (financeIncome.priorTotal || 0) - (financeCosts.priorTotal || 0) : undefined,
        0,
        context
      );
      const profitForPeriod = this.calculateMetric(
        profitBeforeTax.current - taxExpense.total,
        0,
        profitBeforeTax.prior ? profitBeforeTax.prior - (taxExpense.priorTotal || 0) : undefined,
        0,
        context
      );

      // Validate IFRS compliance
      const ifrsValidation = this.validateIFRSPLCompliance(revenue, operatingExpenses, context);
      validation.push(...ifrsValidation);

      const profitLossData: ProfitLossData = {
        metadata,
        revenue,
        costOfSales,
        grossProfit: {
          ...grossProfit,
          margin: revenue.total !== 0 ? (grossProfit.current / revenue.total) * 100 : 0,
          priorMargin: (revenue.priorTotal && revenue.priorTotal !== 0 && grossProfit.prior) ? 
            (grossProfit.prior / revenue.priorTotal) * 100 : undefined
        },
        operatingExpenses,
        operatingProfit: {
          ...operatingProfit,
          margin: revenue.total !== 0 ? (operatingProfit.current / revenue.total) * 100 : 0,
          priorMargin: (revenue.priorTotal && revenue.priorTotal !== 0 && operatingProfit.prior) ? 
            (operatingProfit.prior / revenue.priorTotal) * 100 : undefined
        },
        financeIncome,
        financeCosts,
        profitBeforeTax: {
          ...profitBeforeTax,
          margin: revenue.total !== 0 ? (profitBeforeTax.current / revenue.total) * 100 : 0,
          priorMargin: (revenue.priorTotal && revenue.priorTotal !== 0 && profitBeforeTax.prior) ? 
            (profitBeforeTax.prior / revenue.priorTotal) * 100 : undefined
        },
        taxExpense,
        profitForPeriod: {
          ...profitForPeriod,
          margin: revenue.total !== 0 ? (profitForPeriod.current / revenue.total) * 100 : 0,
          priorMargin: (revenue.priorTotal && revenue.priorTotal !== 0 && profitForPeriod.prior) ? 
            (profitForPeriod.prior / revenue.priorTotal) * 100 : undefined
        }
      };

      return {
        data: profitLossData,
        validation,
        metadata,
        calculationTime: Date.now() - startTime,
        warnings
      };

    } catch (error) {
      throw new Error(`Failed to generate profit & loss statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get account balances for a specific period
   */
  private static async getAccountBalances(
    accounts: ChartOfAccount[], 
    period: StatementPeriod
  ): Promise<{ [accountId: string]: number }> {
    const balances: { [accountId: string]: number } = {};

    // Get journal entries for the period
    const journalEntries = BookkeepingBusinessService.getTransactionsByPeriod(
      new Date(period.startDate),
      new Date(period.endDate)
    );

    // Initialize all account balances to 0
    accounts.forEach(account => {
      balances[account.id] = 0;
    });

    // Calculate balances from journal entries
    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        const account = accounts.find(a => a.id === line.accountId);
        if (account) {
          // Apply normal balance rules for P&L accounts
          if (account.type === 'Revenue') {
            balances[account.id] += line.credit - line.debit;
          } else if (account.type === 'Expense') {
            balances[account.id] += line.debit - line.credit;
          }
        }
      });
    });

    return balances;
  }

  /**
   * Calculate Revenue section
   */
  private static calculateRevenueSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const revenueAccounts = accounts.filter(account => account.type === 'Revenue');
    return this.buildPLSection(revenueAccounts, currentBalances, priorBalances, context, 'Revenue');
  }

  /**
   * Calculate Cost of Sales section
   */
  private static calculateCostOfSalesSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const cogsAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      (account.category?.toLowerCase().includes('cost') || 
       account.name.toLowerCase().includes('cost of') ||
       account.subcategory === 'Cost of Sales')
    );
    return this.buildPLSection(cogsAccounts, currentBalances, priorBalances, context, 'Cost of Sales');
  }

  /**
   * Calculate Operating Expenses section
   */
  private static calculateOperatingExpensesSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const operatingAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      !account.category?.toLowerCase().includes('cost') &&
      !account.name.toLowerCase().includes('cost of') &&
      !account.name.toLowerCase().includes('interest') &&
      !account.name.toLowerCase().includes('tax') &&
      account.subcategory !== 'Cost of Sales' &&
      account.subcategory !== 'Finance Costs' &&
      account.subcategory !== 'Income Tax Expense'
    );
    
    // Build base operating expenses section
    const baseSection = this.buildPLSection(operatingAccounts, currentBalances, priorBalances, context, 'Operating Expenses');
    
    // Calculate and add depreciation expense from Fixed Assets
    const depreciationExpense = this.calculateDepreciationExpense(context);
    
    // Add depreciation as a separate line item if significant
    if (depreciationExpense.current > 0) {
      baseSection.items.push({
        id: 'depreciation-expense',
        name: 'Depreciation and amortization',
        value: depreciationExpense.current,
        formatted: this.formatCurrency(depreciationExpense.current, context),
        priorValue: depreciationExpense.prior,
        formattedPrior: depreciationExpense.prior ? this.formatCurrency(depreciationExpense.prior, context) : undefined,
        variance: depreciationExpense.variance,
        variancePercent: depreciationExpense.variancePercent,
        formattedVariance: depreciationExpense.formattedVariance,
        isSubtotal: false,
        level: 1,
        accountId: undefined,
        notes: ['Calculated from Fixed Assets depreciation schedule']
      });
      
      // Update section totals
      baseSection.total += depreciationExpense.current;
      baseSection.formatted = this.formatCurrency(baseSection.total, context);
      
      if (depreciationExpense.prior) {
        baseSection.priorTotal = (baseSection.priorTotal || 0) + depreciationExpense.prior;
        baseSection.formattedPrior = this.formatCurrency(baseSection.priorTotal, context);
        
        baseSection.variance = baseSection.total - baseSection.priorTotal;
        baseSection.variancePercent = baseSection.priorTotal !== 0 ? (baseSection.variance / baseSection.priorTotal) * 100 : 0;
        baseSection.formattedVariance = this.formatCurrency(baseSection.variance, context);
      }
    }
    
    return baseSection;
  }

  /**
   * Calculate Finance Income section
   */
  private static calculateFinanceIncomeSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const financeIncomeAccounts = accounts.filter(account => 
      account.type === 'Revenue' && 
      (account.name.toLowerCase().includes('interest') ||
       account.name.toLowerCase().includes('finance') ||
       account.subcategory === 'Finance Income')
    );
    
    // Build base finance income section
    const baseSection = this.buildPLSection(financeIncomeAccounts, currentBalances, priorBalances, context, 'Finance Income');
    
    // Calculate and add gains from asset disposals
    const assetDisposalGains = this.calculateAssetDisposalGains(context);
    
    // Add disposal gains as a separate line item if significant
    if (assetDisposalGains.current > 0) {
      baseSection.items.push({
        id: 'asset-disposal-gains',
        name: 'Gain on disposal of property, plant and equipment',
        value: assetDisposalGains.current,
        formatted: this.formatCurrency(assetDisposalGains.current, context),
        priorValue: assetDisposalGains.prior,
        formattedPrior: assetDisposalGains.prior ? this.formatCurrency(assetDisposalGains.prior, context) : undefined,
        variance: assetDisposalGains.variance,
        variancePercent: assetDisposalGains.variancePercent,
        formattedVariance: assetDisposalGains.formattedVariance,
        isSubtotal: false,
        level: 1,
        accountId: undefined,
        notes: ['Calculated from Fixed Assets disposal transactions']
      });
      
      // Update section totals
      baseSection.total += assetDisposalGains.current;
      baseSection.formatted = this.formatCurrency(baseSection.total, context);
      
      if (assetDisposalGains.prior) {
        baseSection.priorTotal = (baseSection.priorTotal || 0) + assetDisposalGains.prior;
        baseSection.formattedPrior = this.formatCurrency(baseSection.priorTotal, context);
        
        baseSection.variance = baseSection.total - baseSection.priorTotal;
        baseSection.variancePercent = baseSection.priorTotal !== 0 ? (baseSection.variance / baseSection.priorTotal) * 100 : 0;
        baseSection.formattedVariance = this.formatCurrency(baseSection.variance, context);
      }
    }
    
    return baseSection;
  }

  /**
   * Calculate Finance Costs section
   */
  private static calculateFinanceCostsSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const financeCostAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      (account.name.toLowerCase().includes('interest') ||
       account.name.toLowerCase().includes('finance') ||
       account.subcategory === 'Finance Costs')
    );
    
    // Build base finance costs section
    const baseSection = this.buildPLSection(financeCostAccounts, currentBalances, priorBalances, context, 'Finance Costs');
    
    // Calculate and add losses from asset disposals
    const assetDisposalLosses = this.calculateAssetDisposalLosses(context);
    
    // Add disposal losses as a separate line item if significant
    if (assetDisposalLosses.current > 0) {
      baseSection.items.push({
        id: 'asset-disposal-losses',
        name: 'Loss on disposal of property, plant and equipment',
        value: assetDisposalLosses.current,
        formatted: this.formatCurrency(assetDisposalLosses.current, context),
        priorValue: assetDisposalLosses.prior,
        formattedPrior: assetDisposalLosses.prior ? this.formatCurrency(assetDisposalLosses.prior, context) : undefined,
        variance: assetDisposalLosses.variance,
        variancePercent: assetDisposalLosses.variancePercent,
        formattedVariance: assetDisposalLosses.formattedVariance,
        isSubtotal: false,
        level: 1,
        accountId: undefined,
        notes: ['Calculated from Fixed Assets disposal transactions']
      });
      
      // Update section totals
      baseSection.total += assetDisposalLosses.current;
      baseSection.formatted = this.formatCurrency(baseSection.total, context);
      
      if (assetDisposalLosses.prior) {
        baseSection.priorTotal = (baseSection.priorTotal || 0) + assetDisposalLosses.prior;
        baseSection.formattedPrior = this.formatCurrency(baseSection.priorTotal, context);
        
        baseSection.variance = baseSection.total - baseSection.priorTotal;
        baseSection.variancePercent = baseSection.priorTotal !== 0 ? (baseSection.variance / baseSection.priorTotal) * 100 : 0;
        baseSection.formattedVariance = this.formatCurrency(baseSection.variance, context);
      }
    }
    
    return baseSection;
  }

  /**
   * Calculate Tax Expense section
   */
  private static calculateTaxExpenseSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const taxAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      (account.name.toLowerCase().includes('tax') ||
       account.subcategory === 'Income Tax Expense')
    );
    return this.buildPLSection(taxAccounts, currentBalances, priorBalances, context, 'Tax Expense');
  }

  /**
   * Build P&L section from accounts
   */
  private static buildPLSection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext,
    sectionName: string
  ): FinancialStatementSection {
    const items = accounts
      .filter(account => Math.abs(currentBalances[account.id] || 0) >= this.getMaterialityThreshold(context))
      .map(account => this.buildStatementItem(account, currentBalances, priorBalances, context));

    const total = items.reduce((sum, item) => sum + item.currentPeriod, 0);
    const priorTotal = context.priorPeriod ? items.reduce((sum, item) => sum + (item.priorPeriod || 0), 0) : undefined;
    const variance = priorTotal !== undefined ? total - priorTotal : undefined;
    const variancePercent = (priorTotal && priorTotal !== 0) ? (variance! / priorTotal) * 100 : undefined;

    return {
      name: sectionName,
      items,
      total,
      priorTotal,
      formattedTotal: this.formatCurrency(total, context),
      formattedPriorTotal: priorTotal !== undefined ? this.formatCurrency(priorTotal, context) : undefined,
      variance,
      variancePercent,
      formattedVariance: variance !== undefined ? this.formatCurrency(variance, context) : undefined
    };
  }

  /**
   * Calculate depreciation expense from Fixed Assets
   */
  private static calculateDepreciationExpense(context: CalculationContext): {
    current: number;
    prior?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  } {
    const fixedAssets = FixedAssetsBusinessService.getAllAssets();
    const activeAssets = fixedAssets.filter(asset => asset.status === 'active');
    
    // Calculate current period depreciation
    let currentDepreciation = 0;
    const currentDate = new Date(context.currentPeriod.endDate);
    const startDate = new Date(context.currentPeriod.startDate);
    
    // Calculate months in current period
    const monthsInPeriod = Math.round(
      (currentDate.getTime() - startDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
    );
    
    activeAssets.forEach(asset => {
      const monthlyDepreciation = FixedAssetsDepreciationService.calculateMonthlyDepreciation(asset);
      
      // Only include assets that started depreciating before or during this period
      const depreciationStartDate = new Date(asset.depreciationStartDate);
      if (depreciationStartDate <= currentDate) {
        // Calculate how many months of depreciation to include
        const assetMonths = Math.min(
          monthsInPeriod,
          Math.max(0, Math.round(
            (currentDate.getTime() - Math.max(depreciationStartDate.getTime(), startDate.getTime())) / (30.44 * 24 * 60 * 60 * 1000)
          ))
        );
        
        currentDepreciation += monthlyDepreciation * assetMonths;
      }
    });
    
    // Calculate prior period depreciation if available
    let priorDepreciation: number | undefined;
    if (context.priorPeriod) {
      priorDepreciation = 0;
      const priorEndDate = new Date(context.priorPeriod.endDate);
      const priorStartDate = new Date(context.priorPeriod.startDate);
      
      const priorMonthsInPeriod = Math.round(
        (priorEndDate.getTime() - priorStartDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000)
      );
      
      activeAssets.forEach(asset => {
        const monthlyDepreciation = FixedAssetsDepreciationService.calculateMonthlyDepreciation(asset);
        const depreciationStartDate = new Date(asset.depreciationStartDate);
        
        if (depreciationStartDate <= priorEndDate) {
          const assetMonths = Math.min(
            priorMonthsInPeriod,
            Math.max(0, Math.round(
              (priorEndDate.getTime() - Math.max(depreciationStartDate.getTime(), priorStartDate.getTime())) / (30.44 * 24 * 60 * 60 * 1000)
            ))
          );
          
          priorDepreciation! += monthlyDepreciation * assetMonths;
        }
      });
    }
    
    // Calculate variance
    const variance = priorDepreciation !== undefined ? currentDepreciation - priorDepreciation : undefined;
    const variancePercent = (priorDepreciation && priorDepreciation !== 0) ? (variance! / priorDepreciation) * 100 : undefined;
    const formattedVariance = variance !== undefined ? this.formatCurrency(variance, context) : undefined;
    
    return {
      current: currentDepreciation,
      prior: priorDepreciation,
      variance,
      variancePercent,
      formattedVariance
    };
  }

  /**
   * Calculate gains from asset disposals
   */
  private static calculateAssetDisposalGains(context: CalculationContext): {
    current: number;
    prior?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  } {
    const fixedAssets = FixedAssetsBusinessService.getAllAssets();
    
    // Filter assets disposed in current period with gains
    const currentPeriodStart = new Date(context.currentPeriod.startDate);
    const currentPeriodEnd = new Date(context.currentPeriod.endDate);
    
    const currentDisposalGains = fixedAssets.filter(asset => 
      asset.status === 'disposed' && 
      asset.disposalDate &&
      new Date(asset.disposalDate) >= currentPeriodStart &&
      new Date(asset.disposalDate) <= currentPeriodEnd &&
      asset.disposalPrice &&
      asset.disposalPrice > asset.currentBookValue
    ).reduce((sum, asset) => {
      const gain = FixedAssetsDepreciationService.calculateDisposalGainLoss(asset, asset.disposalPrice!);
      return sum + Math.max(0, gain); // Only gains
    }, 0);

    // Calculate prior period gains if available
    let priorDisposalGains: number | undefined;
    if (context.priorPeriod) {
      const priorPeriodStart = new Date(context.priorPeriod.startDate);
      const priorPeriodEnd = new Date(context.priorPeriod.endDate);
      
      priorDisposalGains = fixedAssets.filter(asset => 
        asset.status === 'disposed' && 
        asset.disposalDate &&
        new Date(asset.disposalDate) >= priorPeriodStart &&
        new Date(asset.disposalDate) <= priorPeriodEnd &&
        asset.disposalPrice &&
        asset.disposalPrice > asset.currentBookValue
      ).reduce((sum, asset) => {
        const gain = FixedAssetsDepreciationService.calculateDisposalGainLoss(asset, asset.disposalPrice!);
        return sum + Math.max(0, gain); // Only gains
      }, 0);
    }

    // Calculate variance
    const variance = priorDisposalGains !== undefined ? currentDisposalGains - priorDisposalGains : undefined;
    const variancePercent = (priorDisposalGains && priorDisposalGains !== 0) ? (variance! / priorDisposalGains) * 100 : undefined;
    const formattedVariance = variance !== undefined ? this.formatCurrency(variance, context) : undefined;

    return {
      current: currentDisposalGains,
      prior: priorDisposalGains,
      variance,
      variancePercent,
      formattedVariance
    };
  }

  /**
   * Calculate losses from asset disposals
   */
  private static calculateAssetDisposalLosses(context: CalculationContext): {
    current: number;
    prior?: number;
    variance?: number;
    variancePercent?: number;
    formattedVariance?: string;
  } {
    const fixedAssets = FixedAssetsBusinessService.getAllAssets();
    
    // Filter assets disposed in current period with losses
    const currentPeriodStart = new Date(context.currentPeriod.startDate);
    const currentPeriodEnd = new Date(context.currentPeriod.endDate);
    
    const currentDisposalLosses = fixedAssets.filter(asset => 
      asset.status === 'disposed' && 
      asset.disposalDate &&
      new Date(asset.disposalDate) >= currentPeriodStart &&
      new Date(asset.disposalDate) <= currentPeriodEnd &&
      (asset.disposalPrice || 0) < asset.currentBookValue
    ).reduce((sum, asset) => {
      const gainLoss = FixedAssetsDepreciationService.calculateDisposalGainLoss(asset, asset.disposalPrice || 0);
      return sum + Math.max(0, -gainLoss); // Only losses (convert to positive)
    }, 0);

    // Calculate prior period losses if available
    let priorDisposalLosses: number | undefined;
    if (context.priorPeriod) {
      const priorPeriodStart = new Date(context.priorPeriod.startDate);
      const priorPeriodEnd = new Date(context.priorPeriod.endDate);
      
      priorDisposalLosses = fixedAssets.filter(asset => 
        asset.status === 'disposed' && 
        asset.disposalDate &&
        new Date(asset.disposalDate) >= priorPeriodStart &&
        new Date(asset.disposalDate) <= priorPeriodEnd &&
        (asset.disposalPrice || 0) < asset.currentBookValue
      ).reduce((sum, asset) => {
        const gainLoss = FixedAssetsDepreciationService.calculateDisposalGainLoss(asset, asset.disposalPrice || 0);
        return sum + Math.max(0, -gainLoss); // Only losses (convert to positive)
      }, 0);
    }

    // Calculate variance
    const variance = priorDisposalLosses !== undefined ? currentDisposalLosses - priorDisposalLosses : undefined;
    const variancePercent = (priorDisposalLosses && priorDisposalLosses !== 0) ? (variance! / priorDisposalLosses) * 100 : undefined;
    const formattedVariance = variance !== undefined ? this.formatCurrency(variance, context) : undefined;

    return {
      current: currentDisposalLosses,
      prior: priorDisposalLosses,
      variance,
      variancePercent,
      formattedVariance
    };
  }

  /**
   * Build statement item from account
   */
  private static buildStatementItem(
    account: ChartOfAccount,
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementItem {
    const currentPeriod = currentBalances[account.id] || 0;
    const priorPeriod = context.priorPeriod ? (priorBalances[account.id] || 0) : undefined;
    const variance = priorPeriod !== undefined ? currentPeriod - priorPeriod : undefined;
    const variancePercent = (priorPeriod && priorPeriod !== 0) ? (variance! / priorPeriod) * 100 : undefined;

    return {
      code: account.code,
      name: account.name,
      currentPeriod,
      priorPeriod,
      variance,
      variancePercent,
      formattedCurrent: this.formatCurrency(currentPeriod, context),
      formattedPrior: priorPeriod !== undefined ? this.formatCurrency(priorPeriod, context) : undefined,
      formattedVariance: variance !== undefined ? this.formatCurrency(variance, context) : undefined,
      level: 1,
      ifrsReference: account.ifrsReference,
      materialityFlag: Math.abs(currentPeriod) >= this.getMaterialityThreshold(context)
    };
  }

  /**
   * Calculate metric with prior period comparison
   */
  private static calculateMetric(
    current: number,
    currentDeduction: number,
    prior: number | undefined,
    priorDeduction: number,
    context: CalculationContext
  ) {
    const currentResult = current - currentDeduction;
    const priorResult = prior !== undefined ? prior - priorDeduction : undefined;
    const variance = priorResult !== undefined ? currentResult - priorResult : undefined;
    const variancePercent = (priorResult && priorResult !== 0) ? (variance! / priorResult) * 100 : undefined;

    return {
      current: currentResult,
      prior: priorResult,
      formatted: this.formatCurrency(currentResult, context),
      formattedPrior: priorResult !== undefined ? this.formatCurrency(priorResult, context) : undefined,
      variance,
      variancePercent,
      formattedVariance: variance !== undefined ? this.formatCurrency(variance, context) : undefined
    };
  }

  /**
   * Validate IFRS P&L compliance
   */
  private static validateIFRSPLCompliance(
    revenue: FinancialStatementSection,
    operatingExpenses: FinancialStatementSection,
    context: CalculationContext
  ): StatementValidationResult[] {
    const validation: StatementValidationResult[] = [];

    if (context.ifrsCompliant) {
      // IFRS 15 - Revenue Recognition
      if (revenue.items.length === 0 && revenue.total === 0) {
        validation.push({
          statementType: 'ProfitLoss',
          ruleName: 'IFRS15_REVENUE',
          severity: 'info',
          message: 'No revenue recorded for the period',
          ifrsReference: 'IFRS 15'
        });
      }

      // IAS 1 - Comparative Information
      if (!context.priorPeriod) {
        validation.push({
          statementType: 'ProfitLoss',
          ruleName: 'IAS1_COMPARATIVE',
          severity: 'warning',
          message: 'IFRS requires comparative information for the preceding period',
          ifrsReference: 'IAS 1.38'
        });
      }

      // IAS 1 - Minimum Line Items
      const requiredLineItems = ['Revenue', 'Finance Costs', 'Tax Expense'];
      requiredLineItems.forEach(item => {
        // This is a simplified check - could be enhanced
        validation.push({
          statementType: 'ProfitLoss',
          ruleName: 'IAS1_MIN_ITEMS',
          severity: 'info',
          message: `Ensure ${item} is separately presented if material`,
          ifrsReference: 'IAS 1.82'
        });
      });
    }

    return validation;
  }

  /**
   * Helper methods
   */
  private static buildStatementMetadata(
    currentPeriod: StatementPeriod,
    priorPeriod: StatementPeriod | undefined,
    context: CalculationContext,
    companySettings?: CompanySettings
  ): StatementMetadata {
    return {
      companyName: companySettings?.companyName || 'Company Name',
      statementTitle: 'Statement of Profit or Loss',
      currentPeriod,
      priorPeriod,
      preparationDate: new Date().toISOString(),
      functionalCurrency: context.functionalCurrency,
      presentationCurrency: context.functionalCurrency,
      roundingUnit: 'units',
      materialityThreshold: context.materialityThreshold,
      ifrsCompliant: context.ifrsCompliant,
      auditStatus: context.auditRequired ? 'Unaudited' : undefined
    };
  }

  private static formatCurrency(amount: number, context: CalculationContext): string {
    return CurrencyService.formatAmount(amount, context.functionalCurrency);
  }

  private static getMaterialityThreshold(context: CalculationContext): number {
    // Simple materiality calculation - can be enhanced
    return 1000; // Fixed threshold for now
  }

  static formatCurrency(amount: number, currency: string = 'USD'): string {
    const symbol = currency === 'USD' ? '$' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : currency;
    const isNegative = amount < 0;
    return `${isNegative ? '-' : ''}${symbol}${Math.abs(amount).toLocaleString('en-US', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  }

  static getDateRange(periodType: string, startDate?: string, endDate?: string): DateRange | null {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (periodType) {
      case 'thisMonth':
        return {
          start: new Date(currentYear, currentMonth, 1),
          end: new Date(currentYear, currentMonth + 1, 0, 23, 59, 59)
        };
      case 'lastMonth':
        return {
          start: new Date(currentYear, currentMonth - 1, 1),
          end: new Date(currentYear, currentMonth, 0, 23, 59, 59)
        };
      case 'thisYear':
        return {
          start: new Date(currentYear, 0, 1),
          end: new Date(currentYear, 11, 31, 23, 59, 59)
        };
      case 'lastYear':
        return {
          start: new Date(currentYear - 1, 0, 1),
          end: new Date(currentYear - 1, 11, 31, 23, 59, 59)
        };
      case 'custom':
        return {
          start: startDate ? new Date(startDate) : new Date(currentYear, 0, 1),
          end: endDate ? new Date(endDate + 'T23:59:59') : new Date()
        };
      default:
        return null;
    }
  }

  static filterEntries(
    entries: BookkeepingEntry[], 
    periodType: string, 
    selectedCompany: number | 'all',
    startDate?: string, 
    endDate?: string
  ): BookkeepingEntry[] {
    let filtered = entries;

    // Filter by company
    if (selectedCompany !== 'all') {
      filtered = filtered.filter(entry => entry.companyId === selectedCompany);
    }

    // Filter by date range
    if (periodType !== 'allTime') {
      const dateRange = this.getDateRange(periodType, startDate, endDate);
      if (dateRange) {
        filtered = filtered.filter(entry => {
          const entryDate = new Date(entry.date);
          return entryDate >= dateRange.start && entryDate <= dateRange.end;
        });
      }
    }

    return filtered;
  }

  static createPLSection(
    name: string, 
    categories: string[], 
    filteredEntries: BookkeepingEntry[], 
    type: 'income' | 'expense'
  ): PLSection {
    const sectionEntries = filteredEntries.filter(entry => 
      entry.type === type && categories.includes(entry.category)
    );

    const items = categories.map(category => {
      const categoryEntries = sectionEntries.filter(entry => entry.category === category);
      const amount = categoryEntries.reduce((sum, entry) => sum + entry.amount, 0);
      return {
        category,
        amount,
        count: categoryEntries.length,
        formattedAmount: this.formatCurrency(amount)
      };
    }).filter(item => item.amount > 0 || item.count > 0);

    const total = sectionEntries.reduce((sum, entry) => sum + entry.amount, 0);

    return {
      name,
      categories,
      total,
      items,
      formattedTotal: this.formatCurrency(total)
    };
  }

  static calculatePLData(filteredEntries: BookkeepingEntry[]): PLData {
    // Revenue
    const revenue = this.createPLSection('Revenue', this.REVENUE_CATEGORIES, filteredEntries, 'income');
    
    // Add COGS from income entries (invoice-based COGS)
    const incomeWithCogs = filteredEntries.filter(entry => 
      entry.type === 'income' && entry.cogs && entry.cogs > 0
    );
    const invoiceCogs = incomeWithCogs.reduce((sum, entry) => sum + (entry.cogs || 0), 0);

    // COGS expenses
    const cogsExpenses = this.createPLSection('Cost of Goods Sold', this.COGS_CATEGORIES, filteredEntries, 'expense');
    cogsExpenses.total += invoiceCogs;
    cogsExpenses.formattedTotal = this.formatCurrency(cogsExpenses.total);

    if (invoiceCogs > 0) {
      cogsExpenses.items.push({
        category: 'Invoice COGS',
        amount: invoiceCogs,
        count: incomeWithCogs.length,
        formattedAmount: this.formatCurrency(invoiceCogs)
      });
    }

    // Operating expenses
    const operatingExpenses = this.createPLSection('Operating Expenses', this.OPERATING_EXPENSE_CATEGORIES, filteredEntries, 'expense');
    
    // Other income
    const otherIncome = this.createPLSection('Other Income', this.OTHER_INCOME_CATEGORIES, filteredEntries, 'income');
    
    // Other expenses
    const otherExpenses = this.createPLSection('Other Expenses', this.OTHER_EXPENSE_CATEGORIES, filteredEntries, 'expense');

    // Calculations
    const totalRevenue = revenue.total + otherIncome.total;
    const grossProfit = revenue.total - cogsExpenses.total;
    const operatingIncome = grossProfit - operatingExpenses.total;
    const netOtherIncome = otherIncome.total - otherExpenses.total;
    const netIncome = operatingIncome + netOtherIncome;
    const totalExpenses = cogsExpenses.total + operatingExpenses.total + otherExpenses.total;

    // Margins
    const grossProfitMargin = revenue.total > 0 ? (grossProfit / revenue.total) * 100 : 0;
    const operatingMargin = revenue.total > 0 ? (operatingIncome / revenue.total) * 100 : 0;
    const netProfitMargin = totalRevenue > 0 ? (netIncome / totalRevenue) * 100 : 0;

    return {
      revenue,
      cogs: cogsExpenses,
      grossProfit,
      operatingExpenses,
      operatingIncome,
      otherIncome,
      otherExpenses,
      netOtherIncome,
      netIncome,
      totalRevenue,
      totalExpenses,
      grossProfitMargin,
      operatingMargin,
      netProfitMargin,
      formattedGrossProfit: this.formatCurrency(grossProfit),
      formattedOperatingIncome: this.formatCurrency(operatingIncome),
      formattedNetIncome: this.formatCurrency(netIncome),
      formattedTotalRevenue: this.formatCurrency(totalRevenue),
      formattedTotalExpenses: this.formatCurrency(totalExpenses)
    };
  }

  static getPeriodDisplayName(periodType: string): string {
    switch (periodType) {
      case 'thisMonth': return 'This Month';
      case 'lastMonth': return 'Last Month';
      case 'thisYear': return 'This Year';
      case 'lastYear': return 'Last Year';
      case 'custom': return 'Custom Period';
      default: return 'All Time';
    }
  }

  static getCompanyName(selectedCompany: number | 'all', companies: Company[]): string {
    if (selectedCompany === 'all') return 'All Companies';
    const company = companies.find(c => c.id === selectedCompany);
    return company ? company.tradingName : 'Selected Company';
  }

  static calculatePercentageChange(current: number, comparison: number): number {
    if (comparison === 0) return current > 0 ? 100 : 0;
    return ((current - comparison) / Math.abs(comparison)) * 100;
  }

  static formatPercentageChange(change: number, isExpense: boolean = false): string {
    const isPositive = change > 0;
    const symbol = isExpense 
      ? (isPositive ? '↑' : '↓')
      : (isPositive ? '↑' : '↓');
    return `${symbol} ${Math.abs(change).toFixed(1)}%`;
  }

  static createPLSummary(plData: PLData): PLSummary {
    return {
      totalRevenue: plData.totalRevenue,
      totalExpenses: plData.totalExpenses,
      netIncome: plData.netIncome,
      grossProfitMargin: plData.grossProfitMargin,
      netProfitMargin: plData.netProfitMargin,
      operatingMargin: plData.operatingMargin,
      formattedTotalRevenue: plData.formattedTotalRevenue,
      formattedTotalExpenses: plData.formattedTotalExpenses,
      formattedNetIncome: plData.formattedNetIncome,
      hasData: plData.totalRevenue > 0 || plData.totalExpenses > 0
    };
  }

  static createPLComparison(currentPL: PLData, comparisonPL: PLData): PLComparison {
    const revenueChange = this.calculatePercentageChange(currentPL.totalRevenue, comparisonPL.totalRevenue);
    const expensesChange = this.calculatePercentageChange(currentPL.totalExpenses, comparisonPL.totalExpenses);
    const netIncomeChange = this.calculatePercentageChange(currentPL.netIncome, comparisonPL.netIncome);

    return {
      revenue: {
        current: currentPL.totalRevenue,
        comparison: comparisonPL.totalRevenue,
        change: revenueChange,
        changeFormatted: this.formatPercentageChange(revenueChange)
      },
      expenses: {
        current: currentPL.totalExpenses,
        comparison: comparisonPL.totalExpenses,
        change: expensesChange,
        changeFormatted: this.formatPercentageChange(expensesChange, true)
      },
      netIncome: {
        current: currentPL.netIncome,
        comparison: comparisonPL.netIncome,
        change: netIncomeChange,
        changeFormatted: this.formatPercentageChange(netIncomeChange)
      }
    };
  }

  static processEnhancedPLData(
    entries: BookkeepingEntry[],
    period: string,
    selectedCompany: number | 'all',
    companies: Company[],
    customStartDate?: string,
    customEndDate?: string,
    comparisonPeriod?: string
  ): EnhancedPLData {
    // Filter entries for current period
    const filteredEntries = this.filterEntries(entries, period, selectedCompany, customStartDate, customEndDate);
    
    // Calculate main P&L data
    const plData = this.calculatePLData(filteredEntries);
    
    // Create summary
    const summary = this.createPLSummary(plData);
    
    // Calculate comparison if requested
    let comparison: PLComparison | undefined;
    if (comparisonPeriod) {
      const comparisonEntries = this.filterEntries(entries, comparisonPeriod, selectedCompany);
      const comparisonPL = this.calculatePLData(comparisonEntries);
      comparison = this.createPLComparison(plData, comparisonPL);
    }

    // Generate display names
    const periodName = this.getPeriodDisplayName(period);
    const companyName = this.getCompanyName(selectedCompany, companies);

    // Determine data state
    const hasRevenue = plData.totalRevenue > 0;
    const hasExpenses = plData.totalExpenses > 0;
    const isEmpty = !hasRevenue && !hasExpenses;

    return {
      plData,
      summary,
      comparison,
      periodName,
      companyName,
      hasRevenue,
      hasExpenses,
      isEmpty
    };
  }

  static validatePeriodDates(startDate: string, endDate: string): { isValid: boolean; error?: string } {
    if (!startDate || !endDate) {
      return { isValid: false, error: 'Both start and end dates are required for custom period' };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      return { isValid: false, error: 'Start date cannot be after end date' };
    }

    const diffInDays = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
    if (diffInDays > 365 * 2) {
      return { isValid: false, error: 'Period cannot exceed 2 years' };
    }

    return { isValid: true };
  }

  static generatePageTitle(): string {
    return 'Profit & Loss Statement';
  }

  static generatePageDescription(): string {
    return 'Comprehensive financial performance analysis with revenue, expenses, and profitability metrics';
  }
}