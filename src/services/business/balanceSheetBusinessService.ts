import { 
  BalanceSheetData, 
  FinancialStatementItem, 
  FinancialStatementSection,
  StatementPeriod,
  StatementMetadata,
  CalculationContext,
  StatementValidationResult,
  StatementCalculationResult
} from '@/types/financialStatements.types';
import { ChartOfAccount, AccountType, AccountSubcategory } from '@/types/chartOfAccounts.types';
import { IFRSSettings, CompanySettings } from '@/types/settings.types';
import { FixedAsset, AssetCategory } from '@/types/fixedAssets.types';
import { ChartOfAccountsBusinessService } from './chartOfAccountsBusinessService';
import { BookkeepingBusinessService } from './bookkeepingBusinessService';
import { CurrencyService } from './currencyService';
import { FixedAssetsBusinessService } from './fixedAssetsBusinessService';

export class BalanceSheetBusinessService {
  
  /**
   * Generate complete Balance Sheet (Statement of Financial Position)
   */
  static async generateBalanceSheet(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): Promise<StatementCalculationResult<BalanceSheetData>> {
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

      // Calculate Balance Sheet sections
      const assets = this.calculateAssets(allAccounts, currentBalances, priorBalances, context);
      const liabilities = this.calculateLiabilities(allAccounts, currentBalances, priorBalances, context);
      const equity = this.calculateEquity(allAccounts, currentBalances, priorBalances, context);

      // Perform balance check (Assets = Liabilities + Equity)
      const balanceCheck = this.performBalanceCheck(assets.totalAssets, liabilities.totalLiabilities, equity.totalEquity, context);

      if (!balanceCheck.isBalanced) {
        warnings.push(`Balance sheet does not balance. Difference: ${balanceCheck.formattedDifference}`);
        validation.push({
          statementType: 'BalanceSheet',
          ruleName: 'BALANCE_CHECK',
          severity: 'error',
          message: 'Assets do not equal Liabilities plus Equity',
          suggestion: 'Review account classifications and transaction entries'
        });

        // Add enhanced diagnostic information if available
        if (balanceCheck.diagnostics) {
          const diag = balanceCheck.diagnostics.currentPeriod;
          warnings.push(`Current period: Assets ${CurrencyService.formatAmount(diag.assets, context.functionalCurrency || 'USD')} vs L+E ${CurrencyService.formatAmount(diag.liabilitiesAndEquity, context.functionalCurrency || 'USD')}`);
          
          if (balanceCheck.diagnostics.priorPeriod && balanceCheck.priorDifference !== undefined) {
            const priorDiag = balanceCheck.diagnostics.priorPeriod;
            warnings.push(`Prior period: Assets ${CurrencyService.formatAmount(priorDiag.assets, context.functionalCurrency || 'USD')} vs L+E ${CurrencyService.formatAmount(priorDiag.liabilitiesAndEquity, context.functionalCurrency || 'USD')}`);
          }
        }
      }

      // Validate IFRS compliance
      const ifrsValidation = this.validateIFRSCompliance(assets, liabilities, equity, context);
      validation.push(...ifrsValidation);

      const balanceSheetData: BalanceSheetData = {
        metadata,
        assets,
        liabilities,
        equity,
        balanceCheck
      };

      return {
        data: balanceSheetData,
        validation,
        metadata,
        calculationTime: Date.now() - startTime,
        warnings
      };

    } catch (error) {
      throw new Error(`Failed to generate balance sheet: ${error instanceof Error ? error.message : 'Unknown error'}`);
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

    // Handle case when no journal entries exist
    if (!journalEntries || journalEntries.length === 0) {
      console.warn('No journal entries found for balance sheet calculation:', {
        period: period.name,
        startDate: period.startDate,
        endDate: period.endDate
      });
      return balances; // Return zero balances
    }

    // Calculate balances from journal entries
    journalEntries.forEach(entry => {
      entry.lines.forEach(line => {
        const account = accounts.find(a => a.id === line.accountId);
        if (account) {
          // Apply normal balance rules for balance sheet accounts
          if (account.type === 'Assets') {
            balances[account.id] += line.debit - line.credit;
          } else if (account.type === 'Liability' || account.type === 'Equity') {
            balances[account.id] += line.credit - line.debit;
          }
        }
      });
    });

    return balances;
  }

  /**
   * Calculate Assets section
   */
  private static calculateAssets(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ) {
    const assetAccounts = accounts.filter(account => account.type === 'Assets');

    // Current Assets
    const currentAssets = this.buildAssetSection(
      assetAccounts.filter(account => this.isCurrentAsset(account)),
      currentBalances,
      priorBalances,
      context,
      'Current Assets'
    );

    // Non-Current Assets (excluding Fixed Assets to add them separately)
    const nonCurrentAssetsExcludingFixed = this.buildAssetSection(
      assetAccounts.filter(account => this.isNonCurrentAsset(account) && !this.isFixedAssetAccount(account)),
      currentBalances,
      priorBalances,
      context,
      'Other Non-Current Assets'
    );

    // Property, Plant & Equipment (from Fixed Assets module)
    const propertyPlantEquipment = this.calculatePropertyPlantEquipment(context);

    // Intangible Assets (from Fixed Assets module)
    const intangibleAssets = this.calculateIntangibleAssets(context);

    // Total Non-Current Assets - Create proper FinancialStatementSection
    const nonCurrentAssetsTotal = propertyPlantEquipment.total + intangibleAssets.total + nonCurrentAssetsExcludingFixed.total;
    const nonCurrentAssetsPriorTotal = (propertyPlantEquipment.priorTotal || 0) + (intangibleAssets.priorTotal || 0) + (nonCurrentAssetsExcludingFixed.priorTotal || 0);
    const nonCurrentAssetsVariance = nonCurrentAssetsTotal - nonCurrentAssetsPriorTotal;
    const nonCurrentAssetsVariancePercent = nonCurrentAssetsPriorTotal !== 0 ? (nonCurrentAssetsVariance / nonCurrentAssetsPriorTotal) * 100 : 0;

    // Combine all non-current asset items into one section
    const allNonCurrentAssetItems = [
      ...propertyPlantEquipment.items,
      ...intangibleAssets.items,
      ...nonCurrentAssetsExcludingFixed.items
    ];

    const totalNonCurrentAssets: FinancialStatementSection = {
      name: 'Non-Current Assets',
      items: allNonCurrentAssetItems,
      total: nonCurrentAssetsTotal,
      priorTotal: context.priorPeriod ? nonCurrentAssetsPriorTotal : undefined,
      formattedTotal: this.formatCurrency(nonCurrentAssetsTotal, context),
      formattedPriorTotal: context.priorPeriod ? this.formatCurrency(nonCurrentAssetsPriorTotal, context) : undefined,
      variance: context.priorPeriod ? nonCurrentAssetsVariance : undefined,
      variancePercent: context.priorPeriod ? nonCurrentAssetsVariancePercent : undefined,
      formattedVariance: context.priorPeriod ? this.formatCurrency(nonCurrentAssetsVariance, context) : undefined
    };

    // Total Assets
    const totalAssetsCurrent = currentAssets.total + totalNonCurrentAssets.total;
    const totalAssetsPrior = (currentAssets.priorTotal || 0) + totalNonCurrentAssets.priorTotal;
    const totalAssetsVariance = totalAssetsCurrent - totalAssetsPrior;
    const totalAssetsVariancePercent = totalAssetsPrior !== 0 ? (totalAssetsVariance / totalAssetsPrior) * 100 : 0;

    return {
      currentAssets: currentAssets,
      nonCurrentAssets: totalNonCurrentAssets,
      totalAssets: {
        current: totalAssetsCurrent,
        prior: context.priorPeriod ? totalAssetsPrior : undefined,
        formatted: this.formatCurrency(totalAssetsCurrent, context),
        formattedPrior: context.priorPeriod ? this.formatCurrency(totalAssetsPrior, context) : undefined,
        variance: context.priorPeriod ? totalAssetsVariance : undefined,
        variancePercent: context.priorPeriod ? totalAssetsVariancePercent : undefined,
        formattedVariance: context.priorPeriod ? this.formatCurrency(totalAssetsVariance, context) : undefined
      }
    };
  }

  /**
   * Calculate Liabilities section
   */
  private static calculateLiabilities(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ) {
    const liabilityAccounts = accounts.filter(account => account.type === 'Liability');

    // Current Liabilities
    const currentLiabilities = this.buildLiabilitySection(
      liabilityAccounts.filter(account => this.isCurrentLiability(account)),
      currentBalances,
      priorBalances,
      context,
      'Current Liabilities'
    );

    // Non-Current Liabilities
    const nonCurrentLiabilities = this.buildLiabilitySection(
      liabilityAccounts.filter(account => this.isNonCurrentLiability(account)),
      currentBalances,
      priorBalances,
      context,
      'Non-Current Liabilities'
    );

    // Total Liabilities
    const totalLiabilitiesCurrent = currentLiabilities.total + nonCurrentLiabilities.total;
    const totalLiabilitiesPrior = (currentLiabilities.priorTotal || 0) + (nonCurrentLiabilities.priorTotal || 0);
    const totalLiabilitiesVariance = totalLiabilitiesCurrent - totalLiabilitiesPrior;
    const totalLiabilitiesVariancePercent = totalLiabilitiesPrior !== 0 ? (totalLiabilitiesVariance / totalLiabilitiesPrior) * 100 : 0;

    return {
      currentLiabilities,
      nonCurrentLiabilities,
      totalLiabilities: {
        current: totalLiabilitiesCurrent,
        prior: context.priorPeriod ? totalLiabilitiesPrior : undefined,
        formatted: this.formatCurrency(totalLiabilitiesCurrent, context),
        formattedPrior: context.priorPeriod ? this.formatCurrency(totalLiabilitiesPrior, context) : undefined,
        variance: context.priorPeriod ? totalLiabilitiesVariance : undefined,
        variancePercent: context.priorPeriod ? totalLiabilitiesVariancePercent : undefined,
        formattedVariance: context.priorPeriod ? this.formatCurrency(totalLiabilitiesVariance, context) : undefined
      }
    };
  }

  /**
   * Calculate Equity section
   */
  private static calculateEquity(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ) {
    const equityAccounts = accounts.filter(account => account.type === 'Equity');

    // Group equity accounts by subcategory
    const equitySections: FinancialStatementSection[] = [];
    const subcategories = Array.from(new Set(equityAccounts.map(account => account.subcategory).filter(Boolean)));

    // Share Capital
    const shareCapitalAccounts = equityAccounts.filter(account => 
      account.subcategory === 'Share Capital' || 
      account.category?.toLowerCase().includes('capital')
    );
    if (shareCapitalAccounts.length > 0) {
      equitySections.push(this.buildEquitySection(shareCapitalAccounts, currentBalances, priorBalances, context, 'Share Capital'));
    }

    // Retained Earnings (calculated from P&L)
    const retainedEarnings = this.calculateRetainedEarnings(accounts, currentBalances, priorBalances, context);
    if (retainedEarnings.total !== 0 || (retainedEarnings.priorTotal && retainedEarnings.priorTotal !== 0)) {
      equitySections.push(retainedEarnings);
    }

    // Other Equity Components
    subcategories.forEach(subcategory => {
      if (subcategory && subcategory !== 'Share Capital') {
        const subcategoryAccounts = equityAccounts.filter(account => account.subcategory === subcategory);
        if (subcategoryAccounts.length > 0) {
          equitySections.push(this.buildEquitySection(subcategoryAccounts, currentBalances, priorBalances, context, subcategory));
        }
      }
    });

    // Unclassified equity accounts
    const unclassifiedEquity = equityAccounts.filter(account => 
      !account.subcategory && 
      !account.category?.toLowerCase().includes('capital')
    );
    if (unclassifiedEquity.length > 0) {
      equitySections.push(this.buildEquitySection(unclassifiedEquity, currentBalances, priorBalances, context, 'Other Equity'));
    }

    // Total Equity
    const totalEquityCurrent = equitySections.reduce((sum, section) => sum + section.total, 0);
    const totalEquityPrior = equitySections.reduce((sum, section) => sum + (section.priorTotal || 0), 0);
    const totalEquityVariance = totalEquityCurrent - totalEquityPrior;
    const totalEquityVariancePercent = totalEquityPrior !== 0 ? (totalEquityVariance / totalEquityPrior) * 100 : 0;

    return {
      sections: equitySections,
      totalEquity: {
        current: totalEquityCurrent,
        prior: context.priorPeriod ? totalEquityPrior : undefined,
        formatted: this.formatCurrency(totalEquityCurrent, context),
        formattedPrior: context.priorPeriod ? this.formatCurrency(totalEquityPrior, context) : undefined,
        variance: context.priorPeriod ? totalEquityVariance : undefined,
        variancePercent: context.priorPeriod ? totalEquityVariancePercent : undefined,
        formattedVariance: context.priorPeriod ? this.formatCurrency(totalEquityVariance, context) : undefined
      }
    };
  }

  /**
   * Build asset section
   */
  private static buildAssetSection(
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
   * Build liability section
   */
  private static buildLiabilitySection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext,
    sectionName: string
  ): FinancialStatementSection {
    return this.buildAssetSection(accounts, currentBalances, priorBalances, context, sectionName);
  }

  /**
   * Build equity section
   */
  private static buildEquitySection(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext,
    sectionName: string
  ): FinancialStatementSection {
    return this.buildAssetSection(accounts, currentBalances, priorBalances, context, sectionName);
  }

  /**
   * Calculate retained earnings
   */
  private static calculateRetainedEarnings(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    // Find retained earnings accounts
    const retainedEarningsAccounts = accounts.filter(account => 
      account.type === 'Equity' && 
      (account.name.toLowerCase().includes('retained') || 
       account.name.toLowerCase().includes('earnings') ||
       account.subcategory === 'Retained Earnings')
    );

    // If no specific retained earnings account, calculate from revenue and expense accounts
    if (retainedEarningsAccounts.length === 0) {
      const revenueAccounts = accounts.filter(account => account.type === 'Revenue');
      const expenseAccounts = accounts.filter(account => account.type === 'Expense');

      const currentRevenue = revenueAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
      const currentExpenses = expenseAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
      const currentNetIncome = currentRevenue - currentExpenses;

      const priorRevenue = context.priorPeriod ? revenueAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : 0;
      const priorExpenses = context.priorPeriod ? expenseAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : 0;
      const priorNetIncome = context.priorPeriod ? priorRevenue - priorExpenses : undefined;

      const variance = priorNetIncome !== undefined ? currentNetIncome - priorNetIncome : undefined;
      const variancePercent = (priorNetIncome && priorNetIncome !== 0) ? (variance! / priorNetIncome) * 100 : undefined;

      return {
        name: 'Retained Earnings',
        items: [{
          code: 'CALC',
          name: 'Accumulated Earnings',
          currentPeriod: currentNetIncome,
          priorPeriod: priorNetIncome,
          variance,
          variancePercent,
          formattedCurrent: this.formatCurrency(currentNetIncome, context),
          formattedPrior: priorNetIncome !== undefined ? this.formatCurrency(priorNetIncome, context) : undefined,
          formattedVariance: variance !== undefined ? this.formatCurrency(variance, context) : undefined,
          level: 1
        }],
        total: currentNetIncome,
        priorTotal: priorNetIncome,
        formattedTotal: this.formatCurrency(currentNetIncome, context),
        formattedPriorTotal: priorNetIncome !== undefined ? this.formatCurrency(priorNetIncome, context) : undefined,
        variance,
        variancePercent,
        formattedVariance: variance !== undefined ? this.formatCurrency(variance, context) : undefined
      };
    }

    return this.buildEquitySection(retainedEarningsAccounts, currentBalances, priorBalances, context, 'Retained Earnings');
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
   * Perform enhanced balance sheet balance check with improved validation
   */
  private static performBalanceCheck(
    totalAssets: { current: number; prior?: number },
    totalLiabilities: { current: number; prior?: number },
    totalEquity: { current: number; prior?: number },
    context?: CalculationContext
  ) {
    // Current period balance check
    const currentDifference = totalAssets.current - (totalLiabilities.current + totalEquity.current);
    
    // Dynamic tolerance based on materiality
    const materialityThreshold = Math.max(totalAssets.current * 0.001, 0.01); // 0.1% or minimum 1 cent
    const isCurrentBalanced = Math.abs(currentDifference) < materialityThreshold;
    
    // Prior period balance check (if available)
    let priorDifference: number | undefined;
    let isPriorBalanced: boolean | undefined;
    
    if (totalAssets.prior !== undefined && totalLiabilities.prior !== undefined && totalEquity.prior !== undefined) {
      priorDifference = totalAssets.prior - (totalLiabilities.prior + totalEquity.prior);
      const priorMaterialityThreshold = Math.max(totalAssets.prior * 0.001, 0.01);
      isPriorBalanced = Math.abs(priorDifference) < priorMaterialityThreshold;
    }
    
    // Overall balance status
    const isBalanced = isCurrentBalanced && (isPriorBalanced === undefined || isPriorBalanced);
    
    // Enhanced diagnostic information
    const diagnostics = {
      currentPeriod: {
        assets: totalAssets.current,
        liabilities: totalLiabilities.current,
        equity: totalEquity.current,
        liabilitiesAndEquity: totalLiabilities.current + totalEquity.current,
        difference: currentDifference,
        isBalanced: isCurrentBalanced,
        materialityThreshold
      },
      priorPeriod: priorDifference !== undefined ? {
        assets: totalAssets.prior!,
        liabilities: totalLiabilities.prior!,
        equity: totalEquity.prior!,
        liabilitiesAndEquity: totalLiabilities.prior! + totalEquity.prior!,
        difference: priorDifference,
        isBalanced: isPriorBalanced!
      } : undefined
    };
    
    // Get currency from context or default to USD
    const currency = context?.functionalCurrency || 'USD';
    
    return {
      isBalanced,
      difference: currentDifference,
      formattedDifference: CurrencyService.formatAmount(currentDifference, currency),
      priorDifference,
      formattedPriorDifference: priorDifference !== undefined ? CurrencyService.formatAmount(priorDifference, currency) : undefined,
      materialityThreshold,
      diagnostics
    };
  }

  /**
   * Validate IFRS compliance
   */
  private static validateIFRSCompliance(
    assets: unknown,
    liabilities: unknown,
    equity: unknown,
    context: CalculationContext
  ): StatementValidationResult[] {
    const validation: StatementValidationResult[] = [];

    // IAS 1 - Current/Non-Current Classification
    if (context.ifrsCompliant) {
      if (assets.currentAssets.items.length === 0 && assets.nonCurrentAssets.items.length === 0) {
        validation.push({
          statementType: 'BalanceSheet',
          ruleName: 'IAS1_CURRENT_CLASSIFICATION',
          severity: 'warning',
          message: 'No current/non-current classification detected for assets',
          ifrsReference: 'IAS 1.60'
        });
      }

      if (liabilities.currentLiabilities.items.length === 0 && liabilities.nonCurrentLiabilities.items.length === 0) {
        validation.push({
          statementType: 'BalanceSheet',
          ruleName: 'IAS1_CURRENT_CLASSIFICATION',
          severity: 'warning',
          message: 'No current/non-current classification detected for liabilities',
          ifrsReference: 'IAS 1.69'
        });
      }

      // Comparative Information
      if (!context.priorPeriod) {
        validation.push({
          statementType: 'BalanceSheet',
          ruleName: 'IAS1_COMPARATIVE',
          severity: 'warning',
          message: 'IFRS requires comparative information for the preceding period',
          ifrsReference: 'IAS 1.38'
        });
      }
    }

    return validation;
  }

  /**
   * Classification helpers
   */
  private static isCurrentAsset(account: ChartOfAccount): boolean {
    if (account.subcategory) {
      const currentAssetSubcategories = [
        'Cash and Cash Equivalents',
        'Short-term Investments',
        'Trade Receivables',
        'Inventory',
        'Prepaid Expenses',
        'Other Current Assets'
      ];
      return currentAssetSubcategories.includes(account.subcategory);
    }

    // Fallback to name-based classification
    const name = account.name.toLowerCase();
    return name.includes('cash') || 
           name.includes('receivable') || 
           name.includes('inventory') || 
           name.includes('prepaid') ||
           name.includes('current');
  }

  private static isNonCurrentAsset(account: ChartOfAccount): boolean {
    return !this.isCurrentAsset(account);
  }

  private static isCurrentLiability(account: ChartOfAccount): boolean {
    if (account.subcategory) {
      const currentLiabilitySubcategories = [
        'Trade Payables',
        'Short-term Borrowings',
        'Accrued Expenses',
        'Current Tax Payable',
        'Other Current Liabilities'
      ];
      return currentLiabilitySubcategories.includes(account.subcategory);
    }

    // Fallback to name-based classification
    const name = account.name.toLowerCase();
    return name.includes('payable') || 
           name.includes('accrued') || 
           name.includes('current') ||
           name.includes('short-term');
  }

  private static isNonCurrentLiability(account: ChartOfAccount): boolean {
    return !this.isCurrentLiability(account);
  }

  /**
   * Check if account is related to fixed assets
   */
  private static isFixedAssetAccount(account: ChartOfAccount): boolean {
    if (account.subcategory) {
      const fixedAssetSubcategories = [
        'Property, Plant & Equipment',
        'PPE',
        'Fixed Assets',
        'Intangible Assets',
        'Accumulated Depreciation'
      ];
      return fixedAssetSubcategories.some(sub => account.subcategory?.includes(sub));
    }

    const name = account.name.toLowerCase();
    return name.includes('equipment') || 
           name.includes('building') || 
           name.includes('machinery') ||
           name.includes('vehicle') ||
           name.includes('furniture') ||
           name.includes('computer') ||
           name.includes('software') ||
           name.includes('depreciation');
  }

  /**
   * Calculate Property, Plant & Equipment from Fixed Assets module
   */
  private static calculatePropertyPlantEquipment(context: CalculationContext): FinancialStatementSection {
    const fixedAssets = FixedAssetsBusinessService.getAllAssets();
    
    // Filter tangible assets (exclude intangible)
    const tangibleAssets = fixedAssets.filter(asset => 
      asset.category !== 'Intangible Assets' && 
      asset.status === 'active'
    );

    const items: FinancialStatementItem[] = [];

    // Group by category for detailed breakdown
    const categories = Array.from(new Set(tangibleAssets.map(asset => asset.category)));
    
    const totalGrossCarryingAmount = 0;
    const totalAccumulatedDepreciation = 0;

    categories.forEach(category => {
      const categoryAssets = tangibleAssets.filter(asset => asset.category === category);
      const grossAmount = categoryAssets.reduce((sum, asset) => sum + asset.acquisitionCost, 0);
      const accumulatedDep = categoryAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
      const netAmount = grossAmount - accumulatedDep;

      if (grossAmount > 0) {
        // Add gross amount
        items.push({
          id: `ppe-gross-${category.toLowerCase().replace(/\s+/g, '-')}`,
          name: `${category} - at cost`,
          value: grossAmount,
          formatted: this.formatCurrency(grossAmount, context),
          isSubtotal: false,
          level: 2,
          accountId: undefined,
          notes: []
        });

        totalGrossCarryingAmount += grossAmount;
        totalAccumulatedDepreciation += accumulatedDep;
      }
    });

    // Add total gross carrying amount
    if (totalGrossCarryingAmount > 0) {
      items.push({
        id: 'ppe-total-gross',
        name: 'Total Property, Plant & Equipment - at cost',
        value: totalGrossCarryingAmount,
        formatted: this.formatCurrency(totalGrossCarryingAmount, context),
        isSubtotal: true,
        level: 1,
        accountId: undefined,
        notes: []
      });

      // Add accumulated depreciation (as negative)
      items.push({
        id: 'ppe-accumulated-depreciation',
        name: 'Less: Accumulated depreciation',
        value: -totalAccumulatedDepreciation,
        formatted: this.formatCurrency(-totalAccumulatedDepreciation, context),
        isSubtotal: false,
        level: 1,
        accountId: undefined,
        notes: []
      });
    }

    const netCarryingAmount = totalGrossCarryingAmount - totalAccumulatedDepreciation;

    return {
      id: 'property-plant-equipment',
      name: 'Property, Plant & Equipment',
      total: netCarryingAmount,
      priorTotal: undefined, // TODO: Calculate prior period
      formatted: this.formatCurrency(netCarryingAmount, context),
      formattedPrior: undefined,
      variance: undefined,
      variancePercent: undefined,
      formattedVariance: undefined,
      items,
      isExpanded: true,
      level: 0
    };
  }

  /**
   * Calculate Intangible Assets from Fixed Assets module
   */
  private static calculateIntangibleAssets(context: CalculationContext): FinancialStatementSection {
    const fixedAssets = FixedAssetsBusinessService.getAllAssets();
    
    // Filter intangible assets
    const intangibleAssets = fixedAssets.filter(asset => 
      asset.category === 'Intangible Assets' && 
      asset.status === 'active'
    );

    const items: FinancialStatementItem[] = [];
    
    const totalGrossCarryingAmount = 0;
    const totalAccumulatedAmortization = 0;

    // Group by subcategory if available
    const subcategories = Array.from(new Set(intangibleAssets.map(asset => asset.subcategory).filter(Boolean)));
    
    if (subcategories.length > 0) {
      subcategories.forEach(subcategory => {
        const subcategoryAssets = intangibleAssets.filter(asset => asset.subcategory === subcategory);
        const grossAmount = subcategoryAssets.reduce((sum, asset) => sum + asset.acquisitionCost, 0);
        const accumulatedAmort = subcategoryAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
        const netAmount = grossAmount - accumulatedAmort;

        if (grossAmount > 0) {
          items.push({
            id: `intangible-${subcategory?.toLowerCase().replace(/\s+/g, '-')}`,
            name: `${subcategory} - at cost`,
            value: grossAmount,
            formatted: this.formatCurrency(grossAmount, context),
            isSubtotal: false,
            level: 2,
            accountId: undefined,
            notes: []
          });

          totalGrossCarryingAmount += grossAmount;
          totalAccumulatedAmortization += accumulatedAmort;
        }
      });
    } else {
      // No subcategories, group all together
      const grossAmount = intangibleAssets.reduce((sum, asset) => sum + asset.acquisitionCost, 0);
      const accumulatedAmort = intangibleAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
      
      if (grossAmount > 0) {
        items.push({
          id: 'intangible-assets-cost',
          name: 'Intangible Assets - at cost',
          value: grossAmount,
          formatted: this.formatCurrency(grossAmount, context),
          isSubtotal: false,
          level: 2,
          accountId: undefined,
          notes: []
        });

        totalGrossCarryingAmount += grossAmount;
        totalAccumulatedAmortization += accumulatedAmort;
      }
    }

    // Add accumulated amortization if there are intangible assets
    if (totalGrossCarryingAmount > 0 && totalAccumulatedAmortization > 0) {
      items.push({
        id: 'intangible-accumulated-amortization',
        name: 'Less: Accumulated amortization',
        value: -totalAccumulatedAmortization,
        formatted: this.formatCurrency(-totalAccumulatedAmortization, context),
        isSubtotal: false,
        level: 1,
        accountId: undefined,
        notes: []
      });
    }

    const netCarryingAmount = totalGrossCarryingAmount - totalAccumulatedAmortization;

    return {
      id: 'intangible-assets',
      name: 'Intangible Assets',
      total: netCarryingAmount,
      priorTotal: undefined, // TODO: Calculate prior period
      formatted: this.formatCurrency(netCarryingAmount, context),
      formattedPrior: undefined,
      variance: undefined,
      variancePercent: undefined,
      formattedVariance: undefined,
      items,
      isExpanded: true,
      level: 0
    };
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
      statementTitle: 'Statement of Financial Position',
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
}