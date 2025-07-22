import { 
  EquityChangesData, 
  EquityComponent, 
  EquityMovement, 
  StatementPeriod, 
  StatementMetadata,
  StatementCalculationResult,
  StatementValidationResult,
  IFRSComplianceRule
} from '@/types/financialStatements.types';
import { IFRSSettings, CompanySettings } from '@/types/settings.types';
import { ChartOfAccountsStorageService } from '@/services/storage/chartOfAccountsStorageService';
import { BalanceSheetBusinessService } from './balanceSheetBusinessService';
import { ProfitLossBusinessService } from './profitLossBusinessService';

/**
 * Statement of Changes in Equity Business Service
 * 
 * Implements IFRS-compliant Statement of Changes in Equity generation
 * following IAS 1 requirements for presentation of financial statements.
 * 
 * Key IFRS Requirements:
 * - IAS 1.106: Present changes in equity for each component
 * - IAS 1.107: Show movements between opening and closing balances
 * - IAS 1.108: Include comprehensive income attribution
 * - IFRS 2: Share-based payment transactions
 */
export class StatementOfChangesInEquityBusinessService {
  
  /**
   * Generate a complete Statement of Changes in Equity
   */
  static async generateStatementOfChangesInEquity(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): Promise<StatementCalculationResult<EquityChangesData>> {
    const startTime = Date.now();
    
    try {
      // Generate metadata
      const metadata = this.generateMetadata(currentPeriod, priorPeriod, ifrsSettings, companySettings);
      
      // Get equity accounts data
      const equityAccounts = await this.getEquityAccountsData(currentPeriod, priorPeriod);
      
      // Generate equity components
      const equityComponents = await this.generateEquityComponents(equityAccounts, currentPeriod, priorPeriod);
      
      // Generate movements
      const movements = await this.generateEquityMovements(equityAccounts, currentPeriod, priorPeriod);
      
      // Calculate total equity
      const totalEquity = this.calculateTotalEquity(equityComponents, movements);
      
      // Perform reconciliation with balance sheet
      const reconciliation = await this.performBalanceSheetReconciliation(
        totalEquity.closingBalance, 
        currentPeriod
      );
      
      // Calculate dividend information if applicable
      const dividendInformation = await this.calculateDividendInformation(equityAccounts, currentPeriod);
      
      // Build the equity changes data
      const equityChangesData: EquityChangesData = {
        metadata,
        equityComponents,
        movements,
        totalEquity,
        reconciliation,
        dividendInformation
      };
      
      // Validate the statement
      const validation = await this.validateEquityChangesStatement(equityChangesData, ifrsSettings);
      
      const calculationTime = Date.now() - startTime;
      
      return {
        data: equityChangesData,
        validation,
        metadata,
        calculationTime,
        warnings: this.generateWarnings(equityChangesData, ifrsSettings)
      };
      
    } catch (error) {
      console.error('Failed to generate Statement of Changes in Equity:', error);
      throw new Error(`Statement generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Generate statement metadata
   */
  private static generateMetadata(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): StatementMetadata {
    return {
      companyName: companySettings?.companyName || 'Company Name',
      statementTitle: 'Statement of Changes in Equity',
      currentPeriod,
      priorPeriod,
      preparationDate: new Date().toISOString().split('T')[0],
      functionalCurrency: ifrsSettings?.functionalCurrency || 'USD',
      presentationCurrency: ifrsSettings?.presentationCurrency || ifrsSettings?.functionalCurrency || 'USD',
      roundingUnit: this.determineRoundingUnit(ifrsSettings?.roundingPrecision),
      materialityThreshold: ifrsSettings?.materialityThreshold || 5,
      ifrsCompliant: true,
      auditStatus: ifrsSettings?.externalAuditRequired ? 'Unaudited' : undefined
    };
  }
  
  /**
   * Get equity accounts data for the periods
   */
  private static async getEquityAccountsData(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod
  ) {
    const accounts = ChartOfAccountsStorageService.getAccounts();
    
    // Filter for equity accounts (account type 5)
    const equityAccounts = accounts.filter(account => 
      account.accountType === 'Equity' || account.code.startsWith('5')
    );
    
    // Get balances for each period
    const currentBalances = new Map();
    const priorBalances = new Map();
    
    // TODO: In a real implementation, this would fetch actual transaction data
    // For now, we'll use sample data structure
    equityAccounts.forEach(account => {
      currentBalances.set(account.id, {
        openingBalance: Math.random() * 100000,
        movements: [],
        closingBalance: Math.random() * 100000
      });
      
      if (priorPeriod) {
        priorBalances.set(account.id, {
          openingBalance: Math.random() * 100000,
          movements: [],
          closingBalance: Math.random() * 100000
        });
      }
    });
    
    return {
      accounts: equityAccounts,
      currentBalances,
      priorBalances
    };
  }
  
  /**
   * Generate equity components
   */
  private static async generateEquityComponents(
    equityData: unknown,
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod
  ) {
    const { accounts, currentBalances, priorBalances } = equityData;
    
    // Sample implementation - in real app, this would categorize actual equity accounts
    const shareCapital: EquityComponent = {
      name: 'Share Capital',
      code: 'SC',
      openingBalance: 1000000,
      openingBalanceFormatted: '$1,000,000',
      movements: [],
      totalMovements: 0,
      totalMovementsFormatted: '$0',
      closingBalance: 1000000,
      closingBalanceFormatted: '$1,000,000',
      priorYearClosing: priorPeriod ? 1000000 : undefined,
      priorYearClosingFormatted: priorPeriod ? '$1,000,000' : undefined,
      variance: 0,
      variancePercent: 0,
      formattedVariance: '$0'
    };
    
    const shareCapitalReserves: EquityComponent = {
      name: 'Share Capital Reserves',
      code: 'SCR',
      openingBalance: 50000,
      openingBalanceFormatted: '$50,000',
      movements: [],
      totalMovements: 0,
      totalMovementsFormatted: '$0',
      closingBalance: 50000,
      closingBalanceFormatted: '$50,000',
      priorYearClosing: priorPeriod ? 45000 : undefined,
      priorYearClosingFormatted: priorPeriod ? '$45,000' : undefined,
      variance: priorPeriod ? 5000 : 0,
      variancePercent: priorPeriod ? 11.11 : 0,
      formattedVariance: priorPeriod ? '$5,000' : '$0'
    };
    
    const retainedEarnings: EquityComponent = {
      name: 'Retained Earnings',
      code: 'RE',
      openingBalance: 250000,
      openingBalanceFormatted: '$250,000',
      movements: [],
      totalMovements: 75000,
      totalMovementsFormatted: '$75,000',
      closingBalance: 325000,
      closingBalanceFormatted: '$325,000',
      priorYearClosing: priorPeriod ? 200000 : undefined,
      priorYearClosingFormatted: priorPeriod ? '$200,000' : undefined,
      variance: priorPeriod ? 125000 : 75000,
      variancePercent: priorPeriod ? 62.5 : 30,
      formattedVariance: priorPeriod ? '$125,000' : '$75,000'
    };
    
    const otherComprehensiveIncome: EquityComponent = {
      name: 'Other Comprehensive Income',
      code: 'OCI',
      openingBalance: 10000,
      openingBalanceFormatted: '$10,000',
      movements: [],
      totalMovements: 5000,
      totalMovementsFormatted: '$5,000',
      closingBalance: 15000,
      closingBalanceFormatted: '$15,000',
      priorYearClosing: priorPeriod ? 8000 : undefined,
      priorYearClosingFormatted: priorPeriod ? '$8,000' : undefined,
      variance: priorPeriod ? 7000 : 5000,
      variancePercent: priorPeriod ? 87.5 : 50,
      formattedVariance: priorPeriod ? '$7,000' : '$5,000'
    };
    
    const otherReserves: EquityComponent = {
      name: 'Other Reserves',
      code: 'OR',
      openingBalance: 25000,
      openingBalanceFormatted: '$25,000',
      movements: [],
      totalMovements: 0,
      totalMovementsFormatted: '$0',
      closingBalance: 25000,
      closingBalanceFormatted: '$25,000',
      priorYearClosing: priorPeriod ? 25000 : undefined,
      priorYearClosingFormatted: priorPeriod ? '$25,000' : undefined,
      variance: 0,
      variancePercent: 0,
      formattedVariance: '$0'
    };
    
    return {
      shareCapital,
      shareCapitalReserves,
      retainedEarnings,
      otherComprehensiveIncome,
      otherReserves
    };
  }
  
  /**
   * Generate equity movements
   */
  private static async generateEquityMovements(
    equityData: unknown,
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod
  ) {
    // Sample movements - in real implementation, these would be calculated from actual transactions
    const profitForPeriod: EquityMovement = {
      description: 'Profit for the period',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 85000,
      retainedEarningsFormatted: '$85,000',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 85000,
      totalMovementFormatted: '$85,000',
      ifrsReference: 'IAS 1.106(d)',
      notes: 'Profit attributable to owners of the parent'
    };
    
    const otherComprehensiveIncome: EquityMovement = {
      description: 'Other comprehensive income',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 0,
      retainedEarningsFormatted: '$0',
      otherComprehensiveIncome: 5000,
      otherComprehensiveIncomeFormatted: '$5,000',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 5000,
      totalMovementFormatted: '$5,000',
      ifrsReference: 'IAS 1.7',
      notes: 'Foreign currency translation gains'
    };
    
    const totalComprehensiveIncome: EquityMovement = {
      description: 'Total comprehensive income',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 85000,
      retainedEarningsFormatted: '$85,000',
      otherComprehensiveIncome: 5000,
      otherComprehensiveIncomeFormatted: '$5,000',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 90000,
      totalMovementFormatted: '$90,000',
      ifrsReference: 'IAS 1.106(d)'
    };
    
    const dividendsPaid: EquityMovement = {
      description: 'Dividends paid',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: -10000,
      retainedEarningsFormatted: '($10,000)',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: -10000,
      totalMovementFormatted: '($10,000)',
      ifrsReference: 'IAS 1.106(d)',
      notes: 'Interim dividend of $0.10 per share'
    };
    
    const shareCapitalIssued: EquityMovement = {
      description: 'Shares issued during the period',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 0,
      retainedEarningsFormatted: '$0',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 0,
      totalMovementFormatted: '$0',
      ifrsReference: 'IAS 1.106(d)',
      notes: 'No shares issued during the period'
    };
    
    const shareCapitalRedemption: EquityMovement = {
      description: 'Share capital redemption',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 0,
      retainedEarningsFormatted: '$0',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 0,
      totalMovementFormatted: '$0',
      ifrsReference: 'IAS 1.106(d)',
      notes: 'No shares redeemed during the period'
    };
    
    const shareBasedPayments: EquityMovement = {
      description: 'Share-based payments',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 0,
      retainedEarningsFormatted: '$0',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 0,
      totalMovementFormatted: '$0',
      ifrsReference: 'IFRS 2',
      notes: 'No share-based payment transactions during the period'
    };
    
    const transfersToReserves: EquityMovement = {
      description: 'Transfers to reserves',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 0,
      retainedEarningsFormatted: '$0',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 0,
      totalMovementFormatted: '$0',
      ifrsReference: 'IAS 1.106(d)',
      notes: 'No transfers to reserves during the period'
    };
    
    const priorPeriodAdjustments: EquityMovement = {
      description: 'Prior period adjustments',
      shareCapital: 0,
      shareCapitalFormatted: '$0',
      retainedEarnings: 0,
      retainedEarningsFormatted: '$0',
      otherComprehensiveIncome: 0,
      otherComprehensiveIncomeFormatted: '$0',
      otherReserves: 0,
      otherReservesFormatted: '$0',
      totalMovement: 0,
      totalMovementFormatted: '$0',
      ifrsReference: 'IAS 8',
      notes: 'No prior period adjustments'
    };
    
    return {
      profitForPeriod,
      otherComprehensiveIncome,
      totalComprehensiveIncome,
      dividendsPaid,
      shareCapitalIssued,
      shareCapitalRedemption,
      shareBasedPayments,
      transfersToReserves,
      priorPeriodAdjustments,
      otherMovements: []
    };
  }
  
  /**
   * Calculate total equity
   */
  private static calculateTotalEquity(equityComponents: unknown, movements: unknown) {
    const openingBalance = 1335000; // Sum of all opening balances
    const totalMovements = 80000; // Net movements
    const closingBalance = 1415000; // Sum of all closing balances
    
    return {
      openingBalance,
      openingBalanceFormatted: this.formatCurrency(openingBalance),
      totalMovements,
      totalMovementsFormatted: this.formatCurrency(totalMovements),
      closingBalance,
      closingBalanceFormatted: this.formatCurrency(closingBalance),
      priorYearClosing: 1278000,
      priorYearClosingFormatted: this.formatCurrency(1278000),
      variance: 137000,
      variancePercent: 10.72,
      formattedVariance: this.formatCurrency(137000)
    };
  }
  
  /**
   * Perform balance sheet reconciliation
   */
  private static async performBalanceSheetReconciliation(
    equityClosingBalance: number,
    currentPeriod: StatementPeriod
  ) {
    // In real implementation, this would fetch the actual balance sheet equity
    const balanceSheetEquity = 1415000; // Sample value
    const difference = Math.abs(equityClosingBalance - balanceSheetEquity);
    const isMatched = difference < 1; // Allow for rounding differences
    
    return {
      balanceSheetEquityMatches: isMatched,
      difference,
      formattedDifference: this.formatCurrency(difference),
      reconciliationNotes: isMatched ? [] : [
        'Equity closing balance does not match balance sheet equity',
        'Review equity transactions and balance sheet preparation'
      ]
    };
  }
  
  /**
   * Calculate dividend information
   */
  private static async calculateDividendInformation(
    equityData: unknown,
    currentPeriod: StatementPeriod
  ) {
    // Sample dividend calculation
    const sharesOutstanding = 100000;
    const totalDividends = 10000;
    
    if (totalDividends > 0) {
      return {
        dividendsPerShare: totalDividends / sharesOutstanding,
        dividendsPerShareFormatted: this.formatCurrency(totalDividends / sharesOutstanding, 2),
        dividendYield: 2.5, // Sample calculation
        dividendCover: 8.5, // Earnings / Dividends
        interimDividends: 10000,
        finalDividends: 0,
        specialDividends: 0
      };
    }
    
    return undefined;
  }
  
  /**
   * Validate the equity changes statement
   */
  private static async validateEquityChangesStatement(
    data: EquityChangesData,
    ifrsSettings?: IFRSSettings
  ): Promise<StatementValidationResult[]> {
    const validationResults: StatementValidationResult[] = [];
    
    // Validate balance sheet reconciliation
    if (!data.reconciliation.balanceSheetEquityMatches) {
      validationResults.push({
        statementType: 'EquityChanges',
        ruleName: 'EQUITY_BALANCE_RECONCILIATION',
        severity: 'error',
        message: 'Equity changes statement does not reconcile with balance sheet equity',
        suggestion: 'Review equity transactions and balance sheet preparation',
        ifrsReference: 'IAS 1.106'
      });
    }
    
    // Validate comprehensive income presentation
    const totalCI = data.movements.totalComprehensiveIncome.totalMovement;
    const profit = data.movements.profitForPeriod.totalMovement;
    const oci = data.movements.otherComprehensiveIncome.totalMovement;
    
    if (Math.abs((profit + oci) - totalCI) > 0.01) {
      validationResults.push({
        statementType: 'EquityChanges',
        ruleName: 'COMPREHENSIVE_INCOME_CALCULATION',
        severity: 'error',
        message: 'Total comprehensive income does not equal profit plus other comprehensive income',
        suggestion: 'Verify comprehensive income calculations',
        ifrsReference: 'IAS 1.7'
      });
    }
    
    // Validate mandatory disclosures for public companies
    if (ifrsSettings && data.metadata.auditStatus === 'Audited') {
      if (!data.dividendInformation && data.movements.dividendsPaid.totalMovement !== 0) {
        validationResults.push({
          statementType: 'EquityChanges',
          ruleName: 'DIVIDEND_DISCLOSURE',
          severity: 'warning',
          message: 'Dividend information should be disclosed when dividends are paid',
          suggestion: 'Include dividend per share and related disclosures',
          ifrsReference: 'IAS 1.107'
        });
      }
    }
    
    return validationResults;
  }
  
  /**
   * Generate warnings
   */
  private static generateWarnings(
    data: EquityChangesData,
    ifrsSettings?: IFRSSettings
  ): string[] {
    const warnings: string[] = [];
    
    // Check for material movements without adequate description
    const materialThreshold = (ifrsSettings?.materialityThreshold || 5) / 100;
    const totalEquity = data.totalEquity.openingBalance;
    
    Object.values(data.movements).forEach(movement => {
      if (Array.isArray(movement)) return;
      
      const movementPercent = Math.abs(movement.totalMovement) / totalEquity;
      if (movementPercent > materialThreshold && !movement.notes) {
        warnings.push(`Material movement "${movement.description}" lacks adequate notes`);
      }
    });
    
    // Check for unusual equity structure
    if (data.equityComponents.retainedEarnings.closingBalance < 0) {
      warnings.push('Company has accumulated losses (negative retained earnings)');
    }
    
    return warnings;
  }
  
  /**
   * Helper method to format currency
   */
  private static formatCurrency(amount: number, decimals: number = 0): string {
    const absAmount = Math.abs(amount);
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(absAmount);
    
    return amount < 0 ? `(${formatted})` : formatted;
  }
  
  /**
   * Determine rounding unit based on precision
   */
  private static determineRoundingUnit(precision?: number): string {
    if (!precision || precision >= 1) return 'units';
    if (precision >= 0.001) return 'thousands';
    return 'millions';
  }
}