import { 
  BalanceSheetData,
  ProfitLossData,
  CashFlowData,
  StatementPeriod,
  StatementCalculationResult,
  StatementValidationResult,
  FinancialStatementsBundle
} from '@/types/financialStatements.types';
import { IFRSSettings, CompanySettings } from '@/types/settings.types';
import { BalanceSheetBusinessService } from './balanceSheetBusinessService';
import { ProfitLossBusinessService } from './profitLossBusinessService';
import { CashFlowStatementBusinessService } from './cashFlowStatementBusinessService';

export interface IntegratedFinancialStatements {
  balanceSheet: StatementCalculationResult<BalanceSheetData>;
  profitLoss: StatementCalculationResult<ProfitLossData>;
  cashFlow: StatementCalculationResult<CashFlowData>;
  bundle: FinancialStatementsBundle;
  crossStatementValidation: StatementValidationResult[];
  generationTime: number;
}

export interface StatementGenerationOptions {
  includeBalanceSheet?: boolean;
  includeProfitLoss?: boolean;
  includeCashFlow?: boolean;
  cashFlowMethod?: 'direct' | 'indirect';
  validateCrossStatements?: boolean;
}

export class FinancialStatementsIntegrationService {
  
  /**
   * Generate all financial statements with cross-statement validation
   */
  static async generateIntegratedStatements(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings,
    options: StatementGenerationOptions = {}
  ): Promise<IntegratedFinancialStatements> {
    const startTime = Date.now();
    const crossStatementValidation: StatementValidationResult[] = [];

    // Default options
    const {
      includeBalanceSheet = true,
      includeProfitLoss = true,
      includeCashFlow = true,
      cashFlowMethod = 'indirect',
      validateCrossStatements = true
    } = options;

    try {
      // Generate statements in parallel for better performance
      const promises = [];

      if (includeBalanceSheet) {
        promises.push(
          BalanceSheetBusinessService.generateBalanceSheet(
            currentPeriod,
            priorPeriod,
            ifrsSettings,
            companySettings
          )
        );
      }

      if (includeProfitLoss) {
        promises.push(
          ProfitLossBusinessService.generateIFRSProfitLoss(
            currentPeriod,
            priorPeriod,
            ifrsSettings,
            companySettings
          )
        );
      }

      if (includeCashFlow) {
        promises.push(
          CashFlowStatementBusinessService.generateCashFlowStatement(
            currentPeriod,
            priorPeriod,
            ifrsSettings,
            companySettings,
            cashFlowMethod
          )
        );
      }

      const results = await Promise.all(promises);

      // Map results to appropriate statements
      let balanceSheet: StatementCalculationResult<BalanceSheetData> | undefined;
      let profitLoss: StatementCalculationResult<ProfitLossData> | undefined;
      let cashFlow: StatementCalculationResult<CashFlowData> | undefined;

      let resultIndex = 0;
      if (includeBalanceSheet) {
        balanceSheet = results[resultIndex++] as StatementCalculationResult<BalanceSheetData>;
      }
      if (includeProfitLoss) {
        profitLoss = results[resultIndex++] as StatementCalculationResult<ProfitLossData>;
      }
      if (includeCashFlow) {
        cashFlow = results[resultIndex++] as StatementCalculationResult<CashFlowData>;
      }

      // Perform cross-statement validation if requested
      if (validateCrossStatements) {
        const crossValidation = this.performCrossStatementValidation(
          balanceSheet?.data,
          profitLoss?.data,
          cashFlow?.data
        );
        crossStatementValidation.push(...crossValidation);
      }

      // Create the bundle
      const bundle = this.createFinancialStatementsBundle(
        balanceSheet?.data,
        profitLoss?.data,
        cashFlow?.data,
        currentPeriod,
        priorPeriod,
        ifrsSettings,
        companySettings
      );

      // Aggregate all validation results
      const allValidation = [
        ...(balanceSheet?.validation || []),
        ...(profitLoss?.validation || []),
        ...(cashFlow?.validation || []),
        ...crossStatementValidation
      ];

      // Check for critical errors
      const hasCriticalErrors = allValidation.some(v => v.severity === 'error');
      if (hasCriticalErrors) {
        bundle.metadata.status = 'error';
      }

      return {
        balanceSheet: balanceSheet!,
        profitLoss: profitLoss!,
        cashFlow: cashFlow!,
        bundle,
        crossStatementValidation,
        generationTime: Date.now() - startTime
      };

    } catch (error) {
      throw new Error(`Failed to generate integrated financial statements: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Perform cross-statement validation
   */
  private static performCrossStatementValidation(
    balanceSheet?: BalanceSheetData,
    profitLoss?: ProfitLossData,
    cashFlow?: CashFlowData
  ): StatementValidationResult[] {
    const validation: StatementValidationResult[] = [];

    // Validate P&L to Balance Sheet linkage
    if (balanceSheet && profitLoss) {
      // Check if net income from P&L matches retained earnings movement
      const netIncome = profitLoss.profitForPeriod.current;
      
      // Find retained earnings in balance sheet
      const retainedEarningsSection = balanceSheet.equity.sections.find(
        section => section.name.toLowerCase().includes('retained')
      );

      if (retainedEarningsSection && retainedEarningsSection.items.length > 0) {
        const retainedEarningsItem = retainedEarningsSection.items[0];
        const retainedEarningsMovement = retainedEarningsItem.variance || 0;

        // Simple check - in reality, would need to consider dividends and other movements
        if (Math.abs(netIncome - retainedEarningsMovement) > 0.01) {
          validation.push({
            statementType: 'CrossStatement',
            ruleName: 'PL_BS_LINKAGE',
            severity: 'info',
            message: 'Net income may not fully reconcile with retained earnings movement',
            suggestion: 'Consider dividends and other equity movements',
            ifrsReference: 'IAS 1.106'
          });
        }
      }
    }

    // Validate Cash Flow to Balance Sheet linkage
    if (balanceSheet && cashFlow) {
      // Check if cash movement in cash flow matches balance sheet cash change
      const cashMovement = cashFlow.netCashFlow.current;
      
      // This is already validated within the cash flow statement
      // But we can add additional cross-checks here
      if (!cashFlow.cashReconciliation.isReconciled) {
        validation.push({
          statementType: 'CrossStatement',
          ruleName: 'CF_BS_CASH',
          severity: 'error',
          message: 'Cash movement in cash flow statement does not reconcile with balance sheet',
          suggestion: 'Review cash and cash equivalents classification',
          ifrsReference: 'IAS 7.45'
        });
      }
    }

    // Validate P&L to Cash Flow linkage
    if (profitLoss && cashFlow && cashFlow.method === 'indirect') {
      // Check if net income in cash flow matches P&L
      const cashFlowNetIncome = cashFlow.operatingActivities.items.find(
        item => item.code === 'NP'
      );

      if (cashFlowNetIncome) {
        const plNetIncome = profitLoss.profitForPeriod.current;
        
        if (Math.abs(cashFlowNetIncome.currentPeriod - plNetIncome) > 0.01) {
          validation.push({
            statementType: 'CrossStatement',
            ruleName: 'PL_CF_NETINCOME',
            severity: 'error',
            message: 'Net income in cash flow statement does not match profit & loss',
            suggestion: 'Ensure consistent profit calculation across statements',
            ifrsReference: 'IAS 7.18'
          });
        }
      }
    }

    // Check for completeness of statement set
    if (!balanceSheet || !profitLoss || !cashFlow) {
      validation.push({
        statementType: 'CrossStatement',
        ruleName: 'COMPLETE_SET',
        severity: 'warning',
        message: 'Complete set of financial statements not generated',
        suggestion: 'IFRS requires a complete set including balance sheet, P&L, cash flow, and statement of changes in equity',
        ifrsReference: 'IAS 1.10'
      });
    }

    return validation;
  }

  /**
   * Create a bundle containing all financial statements
   */
  private static createFinancialStatementsBundle(
    balanceSheet?: BalanceSheetData,
    profitLoss?: ProfitLossData,
    cashFlow?: CashFlowData,
    currentPeriod?: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): FinancialStatementsBundle {
    const metadata = {
      bundleId: `FSB_${Date.now()}`,
      companyName: companySettings?.companyName || 'Company Name',
      currentPeriod: currentPeriod!,
      priorPeriod,
      generatedAt: new Date().toISOString(),
      generatedBy: 'System',
      status: 'draft' as const,
      ifrsCompliant: ifrsSettings?.accountingStandard === 'IFRS',
      functionalCurrency: ifrsSettings?.functionalCurrency || 'USD',
      consolidationScope: ifrsSettings?.consolidationRequired ? 'consolidated' : 'standalone',
      auditStatus: ifrsSettings?.externalAuditRequired ? 'unaudited' : undefined
    };

    const statements = {
      balanceSheet,
      profitLoss,
      cashFlow,
      statementOfChangesInEquity: undefined, // To be implemented in future phases
      notes: [] // To be implemented in future phases
    };

    const summary = this.calculateFinancialSummary(balanceSheet, profitLoss, cashFlow);

    return {
      metadata,
      statements,
      summary
    };
  }

  /**
   * Calculate key financial metrics summary
   */
  private static calculateFinancialSummary(
    balanceSheet?: BalanceSheetData,
    profitLoss?: ProfitLossData,
    cashFlow?: CashFlowData
  ) {
    const keyMetrics: any = {
      totalAssets: 0,
      totalLiabilities: 0,
      totalEquity: 0,
      revenue: 0,
      netIncome: 0,
      operatingCashFlow: 0,
      currentRatio: 0,
      debtToEquity: 0,
      returnOnAssets: 0,
      returnOnEquity: 0
    };

    if (balanceSheet) {
      keyMetrics.totalAssets = balanceSheet.assets.totalAssets.current;
      keyMetrics.totalLiabilities = balanceSheet.liabilities.totalLiabilities.current;
      keyMetrics.totalEquity = balanceSheet.equity.totalEquity.current;

      // Current ratio
      if (balanceSheet.liabilities.currentLiabilities.total > 0) {
        keyMetrics.currentRatio = 
          balanceSheet.assets.currentAssets.total / 
          balanceSheet.liabilities.currentLiabilities.total;
      }

      // Debt to equity
      if (keyMetrics.totalEquity > 0) {
        keyMetrics.debtToEquity = keyMetrics.totalLiabilities / keyMetrics.totalEquity;
      }
    }

    if (profitLoss) {
      keyMetrics.revenue = profitLoss.revenue.total;
      keyMetrics.netIncome = profitLoss.profitForPeriod.current;

      // ROA
      if (keyMetrics.totalAssets > 0) {
        keyMetrics.returnOnAssets = (keyMetrics.netIncome / keyMetrics.totalAssets) * 100;
      }

      // ROE
      if (keyMetrics.totalEquity > 0) {
        keyMetrics.returnOnEquity = (keyMetrics.netIncome / keyMetrics.totalEquity) * 100;
      }
    }

    if (cashFlow) {
      keyMetrics.operatingCashFlow = cashFlow.operatingActivities.total;
    }

    const highlights = [];

    // Add performance highlights
    if (keyMetrics.netIncome > 0) {
      highlights.push({
        metric: 'Profitability',
        status: 'positive',
        message: `Net income of ${this.formatCurrency(keyMetrics.netIncome)}`
      });
    } else if (keyMetrics.netIncome < 0) {
      highlights.push({
        metric: 'Profitability',
        status: 'negative',
        message: `Net loss of ${this.formatCurrency(Math.abs(keyMetrics.netIncome))}`
      });
    }

    // Add liquidity highlights
    if (keyMetrics.currentRatio > 2) {
      highlights.push({
        metric: 'Liquidity',
        status: 'positive',
        message: `Strong liquidity with current ratio of ${keyMetrics.currentRatio.toFixed(2)}`
      });
    } else if (keyMetrics.currentRatio < 1) {
      highlights.push({
        metric: 'Liquidity',
        status: 'warning',
        message: `Liquidity concern with current ratio of ${keyMetrics.currentRatio.toFixed(2)}`
      });
    }

    // Add cash flow highlights
    if (keyMetrics.operatingCashFlow > 0) {
      highlights.push({
        metric: 'Cash Generation',
        status: 'positive',
        message: `Positive operating cash flow of ${this.formatCurrency(keyMetrics.operatingCashFlow)}`
      });
    } else if (keyMetrics.operatingCashFlow < 0) {
      highlights.push({
        metric: 'Cash Generation',
        status: 'warning',
        message: `Negative operating cash flow of ${this.formatCurrency(Math.abs(keyMetrics.operatingCashFlow))}`
      });
    }

    return {
      keyMetrics,
      highlights
    };
  }

  /**
   * Generate a specific statement only
   */
  static async generateBalanceSheet(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): Promise<StatementCalculationResult<BalanceSheetData>> {
    return BalanceSheetBusinessService.generateBalanceSheet(
      currentPeriod,
      priorPeriod,
      ifrsSettings,
      companySettings
    );
  }

  static async generateProfitLoss(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): Promise<StatementCalculationResult<ProfitLossData>> {
    return ProfitLossBusinessService.generateIFRSProfitLoss(
      currentPeriod,
      priorPeriod,
      ifrsSettings,
      companySettings
    );
  }

  static async generateCashFlow(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings,
    method: 'direct' | 'indirect' = 'indirect'
  ): Promise<StatementCalculationResult<CashFlowData>> {
    return CashFlowStatementBusinessService.generateCashFlowStatement(
      currentPeriod,
      priorPeriod,
      ifrsSettings,
      companySettings,
      method
    );
  }

  /**
   * Validate a complete set of financial statements
   */
  static validateFinancialStatements(
    bundle: FinancialStatementsBundle
  ): StatementValidationResult[] {
    const validation: StatementValidationResult[] = [];

    // Check for completeness
    if (!bundle.statements.balanceSheet) {
      validation.push({
        statementType: 'Bundle',
        ruleName: 'MISSING_BS',
        severity: 'error',
        message: 'Balance Sheet is missing from the financial statements',
        ifrsReference: 'IAS 1.10'
      });
    }

    if (!bundle.statements.profitLoss) {
      validation.push({
        statementType: 'Bundle',
        ruleName: 'MISSING_PL',
        severity: 'error',
        message: 'Profit & Loss statement is missing from the financial statements',
        ifrsReference: 'IAS 1.10'
      });
    }

    if (!bundle.statements.cashFlow) {
      validation.push({
        statementType: 'Bundle',
        ruleName: 'MISSING_CF',
        severity: 'error',
        message: 'Cash Flow statement is missing from the financial statements',
        ifrsReference: 'IAS 1.10'
      });
    }

    // Check for period consistency
    const periods = [
      bundle.statements.balanceSheet?.metadata.currentPeriod,
      bundle.statements.profitLoss?.metadata.currentPeriod,
      bundle.statements.cashFlow?.metadata.currentPeriod
    ].filter(Boolean);

    const uniquePeriods = new Set(periods.map(p => p?.id));
    if (uniquePeriods.size > 1) {
      validation.push({
        statementType: 'Bundle',
        ruleName: 'PERIOD_MISMATCH',
        severity: 'error',
        message: 'Financial statements have different reporting periods',
        suggestion: 'Ensure all statements are generated for the same period'
      });
    }

    // Check for currency consistency
    const currencies = [
      bundle.statements.balanceSheet?.metadata.functionalCurrency,
      bundle.statements.profitLoss?.metadata.functionalCurrency,
      bundle.statements.cashFlow?.metadata.functionalCurrency
    ].filter(Boolean);

    const uniqueCurrencies = new Set(currencies);
    if (uniqueCurrencies.size > 1) {
      validation.push({
        statementType: 'Bundle',
        ruleName: 'CURRENCY_MISMATCH',
        severity: 'error',
        message: 'Financial statements have different functional currencies',
        suggestion: 'Ensure all statements use the same functional currency'
      });
    }

    return validation;
  }

  /**
   * Export financial statements bundle
   */
  static async exportFinancialStatements(
    bundle: FinancialStatementsBundle,
    format: 'PDF' | 'Excel' | 'XBRL'
  ): Promise<Blob> {
    // This is a placeholder for export functionality
    // In a real implementation, this would:
    // 1. For PDF: Generate formatted PDF using a library like jsPDF or puppeteer
    // 2. For Excel: Create Excel workbook with multiple sheets using xlsx
    // 3. For XBRL: Generate XBRL taxonomy-compliant XML
    
    throw new Error(`Export to ${format} not yet implemented`);
  }

  /**
   * Helper method for currency formatting
   */
  private static formatCurrency(amount: number, currency: string = 'USD'): string {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }
}