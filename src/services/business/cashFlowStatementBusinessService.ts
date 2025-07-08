import { 
  CashFlowData, 
  FinancialStatementItem, 
  FinancialStatementSection,
  StatementPeriod,
  StatementMetadata,
  CalculationContext,
  StatementValidationResult,
  StatementCalculationResult
} from '@/types/financialStatements.types';
import { ChartOfAccount } from '@/types/chartOfAccounts.types';
import { IFRSSettings, CompanySettings } from '@/types/settings.types';
import { ChartOfAccountsBusinessService } from './chartOfAccountsBusinessService';
import { BookkeepingBusinessService } from './bookkeepingBusinessService';
import { CurrencyService } from './currencyService';

export class CashFlowStatementBusinessService {
  
  /**
   * Generate IFRS-compliant Statement of Cash Flows
   */
  static async generateCashFlowStatement(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings,
    method: 'direct' | 'indirect' = 'indirect'
  ): Promise<StatementCalculationResult<CashFlowData>> {
    const startTime = Date.now();
    const warnings: string[] = [];
    const validation: StatementValidationResult[] = [];

    try {
      // Get all accounts from Chart of Accounts
      const allAccounts = ChartOfAccountsBusinessService.getAllAccounts();
      
      // Get account balances for current and prior periods
      const currentBalances = await this.getAccountBalances(allAccounts, currentPeriod);
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
      const metadata = this.buildStatementMetadata(currentPeriod, priorPeriod, context, companySettings, method);

      // Calculate cash flow sections based on method
      let operatingActivities: FinancialStatementSection;
      
      if (method === 'direct') {
        operatingActivities = this.calculateOperatingActivitiesDirect(allAccounts, currentBalances, priorBalances, context);
      } else {
        operatingActivities = this.calculateOperatingActivitiesIndirect(allAccounts, currentBalances, priorBalances, context);
      }

      const investingActivities = this.calculateInvestingActivities(allAccounts, currentBalances, priorBalances, context);
      const financingActivities = this.calculateFinancingActivities(allAccounts, currentBalances, priorBalances, context);

      // Calculate net cash flow and reconciliation
      const netCashFlow = this.calculateNetCashFlow(operatingActivities, investingActivities, financingActivities, context);
      const cashReconciliation = this.calculateCashReconciliation(allAccounts, currentBalances, priorBalances, netCashFlow, context);

      // Validate cash flow statement
      const cashFlowValidation = this.validateCashFlowStatement(operatingActivities, investingActivities, financingActivities, context);
      validation.push(...cashFlowValidation);

      // Check cash reconciliation
      if (!cashReconciliation.isReconciled) {
        warnings.push(`Cash reconciliation failed. Difference: ${cashReconciliation.formattedDifference}`);
        validation.push({
          statementType: 'CashFlow',
          ruleName: 'CASH_RECONCILIATION',
          severity: 'error',
          message: 'Net cash flow does not match change in cash and cash equivalents',
          suggestion: 'Review cash flow classifications and opening/closing cash balances'
        });
      }

      const cashFlowData: CashFlowData = {
        metadata,
        operatingActivities: {
          method,
          items: operatingActivities.items,
          netCashFromOperating: operatingActivities.total
        },
        investingActivities: {
          items: investingActivities.items,
          netCashFromInvesting: investingActivities.total
        },
        financingActivities: {
          items: financingActivities.items,
          netCashFromFinancing: financingActivities.total
        },
        netIncreaseInCash: netCashFlow,
        cashAtBeginning: cashReconciliation.cashAtBeginning,
        cashAtEnd: cashReconciliation.cashAtEnd,
        reconciliation: cashReconciliation.reconciliation
      };

      return {
        data: cashFlowData,
        validation,
        metadata,
        calculationTime: Date.now() - startTime,
        warnings
      };

    } catch (error) {
      throw new Error(`Failed to generate cash flow statement: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          // Apply normal balance rules
          if (account.type === 'Assets') {
            balances[account.id] += line.debit - line.credit;
          } else if (account.type === 'Liability' || account.type === 'Equity') {
            balances[account.id] += line.credit - line.debit;
          } else if (account.type === 'Revenue') {
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
   * Calculate Operating Activities - Indirect Method
   */
  private static calculateOperatingActivitiesIndirect(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const items: FinancialStatementItem[] = [];

    // Start with net profit/loss
    const revenueAccounts = accounts.filter(account => account.type === 'Revenue');
    const expenseAccounts = accounts.filter(account => account.type === 'Expense');
    
    const currentRevenue = revenueAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const currentExpenses = expenseAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const netProfit = currentRevenue - currentExpenses;

    const priorRevenue = context.priorPeriod ? revenueAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : 0;
    const priorExpenses = context.priorPeriod ? expenseAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : 0;
    const priorNetProfit = context.priorPeriod ? priorRevenue - priorExpenses : undefined;

    items.push({
      code: 'NP',
      name: 'Net profit/(loss) for the period',
      currentPeriod: netProfit,
      priorPeriod: priorNetProfit,
      variance: priorNetProfit !== undefined ? netProfit - priorNetProfit : undefined,
      variancePercent: (priorNetProfit && priorNetProfit !== 0) ? ((netProfit - priorNetProfit) / priorNetProfit) * 100 : undefined,
      formattedCurrent: this.formatCurrency(netProfit, context),
      formattedPrior: priorNetProfit !== undefined ? this.formatCurrency(priorNetProfit, context) : undefined,
      formattedVariance: priorNetProfit !== undefined ? this.formatCurrency(netProfit - priorNetProfit, context) : undefined,
      level: 1,
      ifrsReference: 'IAS 7.20'
    });

    // Add non-cash adjustments
    const adjustments = this.calculateNonCashAdjustments(accounts, currentBalances, priorBalances, context);
    items.push(...adjustments);

    // Add working capital changes
    const workingCapitalChanges = this.calculateWorkingCapitalChanges(accounts, currentBalances, priorBalances, context);
    items.push(...workingCapitalChanges);

    const total = items.reduce((sum, item) => sum + item.currentPeriod, 0);
    const priorTotal = context.priorPeriod ? items.reduce((sum, item) => sum + (item.priorPeriod || 0), 0) : undefined;

    return {
      name: 'Cash flows from operating activities',
      items,
      total,
      priorTotal,
      formattedTotal: this.formatCurrency(total, context),
      formattedPriorTotal: priorTotal !== undefined ? this.formatCurrency(priorTotal, context) : undefined,
      variance: priorTotal !== undefined ? total - priorTotal : undefined,
      variancePercent: (priorTotal && priorTotal !== 0) ? ((total - priorTotal) / priorTotal) * 100 : undefined,
      formattedVariance: priorTotal !== undefined ? this.formatCurrency(total - priorTotal, context) : undefined
    };
  }

  /**
   * Calculate Operating Activities - Direct Method
   */
  private static calculateOperatingActivitiesDirect(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const items: FinancialStatementItem[] = [];

    // Cash receipts from customers
    const customerReceiptsAccounts = accounts.filter(account => 
      account.type === 'Revenue' || 
      (account.type === 'Assets' && account.name.toLowerCase().includes('receivable'))
    );
    
    // This is a simplified calculation - in practice, would need detailed transaction analysis
    const cashFromCustomers = customerReceiptsAccounts.reduce((sum, account) => {
      if (account.type === 'Revenue') {
        return sum + (currentBalances[account.id] || 0);
      }
      // For receivables, calculate the change (reduction means cash received)
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum - change; // Negative change = cash received
    }, 0);

    const priorCashFromCustomers = context.priorPeriod ? customerReceiptsAccounts.reduce((sum, account) => {
      if (account.type === 'Revenue') {
        return sum + (priorBalances[account.id] || 0);
      }
      return sum;
    }, 0) : undefined;

    items.push({
      code: 'CFO_CUST',
      name: 'Cash receipts from customers',
      currentPeriod: cashFromCustomers,
      priorPeriod: priorCashFromCustomers,
      variance: priorCashFromCustomers !== undefined ? cashFromCustomers - priorCashFromCustomers : undefined,
      variancePercent: (priorCashFromCustomers && priorCashFromCustomers !== 0) ? ((cashFromCustomers - priorCashFromCustomers) / priorCashFromCustomers) * 100 : undefined,
      formattedCurrent: this.formatCurrency(cashFromCustomers, context),
      formattedPrior: priorCashFromCustomers !== undefined ? this.formatCurrency(priorCashFromCustomers, context) : undefined,
      formattedVariance: priorCashFromCustomers !== undefined ? this.formatCurrency(cashFromCustomers - priorCashFromCustomers, context) : undefined,
      level: 1,
      ifrsReference: 'IAS 7.14(a)'
    });

    // Cash payments to suppliers and employees
    const operatingExpenseAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      !account.name.toLowerCase().includes('depreciation') &&
      !account.name.toLowerCase().includes('amortization') &&
      !account.name.toLowerCase().includes('interest') &&
      !account.name.toLowerCase().includes('tax')
    );

    const cashToSuppliers = -operatingExpenseAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const priorCashToSuppliers = context.priorPeriod ? 
      -operatingExpenseAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : undefined;

    items.push({
      code: 'CFO_SUPP',
      name: 'Cash payments to suppliers and employees',
      currentPeriod: cashToSuppliers,
      priorPeriod: priorCashToSuppliers,
      variance: priorCashToSuppliers !== undefined ? cashToSuppliers - priorCashToSuppliers : undefined,
      variancePercent: (priorCashToSuppliers && priorCashToSuppliers !== 0) ? ((cashToSuppliers - priorCashToSuppliers) / priorCashToSuppliers) * 100 : undefined,
      formattedCurrent: this.formatCurrency(cashToSuppliers, context),
      formattedPrior: priorCashToSuppliers !== undefined ? this.formatCurrency(priorCashToSuppliers, context) : undefined,
      formattedVariance: priorCashToSuppliers !== undefined ? this.formatCurrency(cashToSuppliers - priorCashToSuppliers, context) : undefined,
      level: 1,
      ifrsReference: 'IAS 7.14(b)'
    });

    const total = items.reduce((sum, item) => sum + item.currentPeriod, 0);
    const priorTotal = context.priorPeriod ? items.reduce((sum, item) => sum + (item.priorPeriod || 0), 0) : undefined;

    return {
      name: 'Cash flows from operating activities',
      items,
      total,
      priorTotal,
      formattedTotal: this.formatCurrency(total, context),
      formattedPriorTotal: priorTotal !== undefined ? this.formatCurrency(priorTotal, context) : undefined,
      variance: priorTotal !== undefined ? total - priorTotal : undefined,
      variancePercent: (priorTotal && priorTotal !== 0) ? ((total - priorTotal) / priorTotal) * 100 : undefined,
      formattedVariance: priorTotal !== undefined ? this.formatCurrency(total - priorTotal, context) : undefined
    };
  }

  /**
   * Calculate Investing Activities
   */
  private static calculateInvestingActivities(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const items: FinancialStatementItem[] = [];

    // Property, plant and equipment purchases/sales
    const ppeAccounts = accounts.filter(account => 
      account.type === 'Assets' && 
      (account.subcategory === 'Property, Plant and Equipment' ||
       account.name.toLowerCase().includes('equipment') ||
       account.name.toLowerCase().includes('property') ||
       account.name.toLowerCase().includes('plant'))
    );

    const ppeChange = ppeAccounts.reduce((sum, account) => {
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum + change;
    }, 0);

    if (Math.abs(ppeChange) >= this.getMaterialityThreshold(context)) {
      const priorPpeChange = context.priorPeriod ? 0 : undefined; // Would need additional period for comparison

      items.push({
        code: 'CFI_PPE',
        name: ppeChange >= 0 ? 'Purchase of property, plant and equipment' : 'Proceeds from sale of property, plant and equipment',
        currentPeriod: -ppeChange, // Negative because purchase is outflow
        priorPeriod: priorPpeChange,
        variance: priorPpeChange !== undefined ? -ppeChange - priorPpeChange : undefined,
        variancePercent: undefined,
        formattedCurrent: this.formatCurrency(-ppeChange, context),
        formattedPrior: priorPpeChange !== undefined ? this.formatCurrency(priorPpeChange, context) : undefined,
        formattedVariance: priorPpeChange !== undefined ? this.formatCurrency(-ppeChange - priorPpeChange, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.16(a)'
      });
    }

    // Investments
    const investmentAccounts = accounts.filter(account => 
      account.type === 'Assets' && 
      (account.name.toLowerCase().includes('investment') ||
       account.subcategory === 'Long-term Investments' ||
       account.subcategory === 'Short-term Investments')
    );

    const investmentChange = investmentAccounts.reduce((sum, account) => {
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum + change;
    }, 0);

    if (Math.abs(investmentChange) >= this.getMaterialityThreshold(context)) {
      const priorInvestmentChange = context.priorPeriod ? 0 : undefined;

      items.push({
        code: 'CFI_INV',
        name: investmentChange >= 0 ? 'Purchase of investments' : 'Proceeds from sale of investments',
        currentPeriod: -investmentChange,
        priorPeriod: priorInvestmentChange,
        variance: priorInvestmentChange !== undefined ? -investmentChange - priorInvestmentChange : undefined,
        variancePercent: undefined,
        formattedCurrent: this.formatCurrency(-investmentChange, context),
        formattedPrior: priorInvestmentChange !== undefined ? this.formatCurrency(priorInvestmentChange, context) : undefined,
        formattedVariance: priorInvestmentChange !== undefined ? this.formatCurrency(-investmentChange - priorInvestmentChange, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.16(c)'
      });
    }

    const total = items.reduce((sum, item) => sum + item.currentPeriod, 0);
    const priorTotal = context.priorPeriod ? items.reduce((sum, item) => sum + (item.priorPeriod || 0), 0) : undefined;

    return {
      name: 'Cash flows from investing activities',
      items,
      total,
      priorTotal,
      formattedTotal: this.formatCurrency(total, context),
      formattedPriorTotal: priorTotal !== undefined ? this.formatCurrency(priorTotal, context) : undefined,
      variance: priorTotal !== undefined ? total - priorTotal : undefined,
      variancePercent: (priorTotal && priorTotal !== 0) ? ((total - priorTotal) / priorTotal) * 100 : undefined,
      formattedVariance: priorTotal !== undefined ? this.formatCurrency(total - priorTotal, context) : undefined
    };
  }

  /**
   * Calculate Financing Activities
   */
  private static calculateFinancingActivities(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementSection {
    const items: FinancialStatementItem[] = [];

    // Borrowings
    const loanAccounts = accounts.filter(account => 
      account.type === 'Liability' && 
      (account.name.toLowerCase().includes('loan') ||
       account.name.toLowerCase().includes('borrowing') ||
       account.name.toLowerCase().includes('debt') ||
       account.subcategory === 'Long-term Debt' ||
       account.subcategory === 'Short-term Borrowings')
    );

    const borrowingChange = loanAccounts.reduce((sum, account) => {
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum + change;
    }, 0);

    if (Math.abs(borrowingChange) >= this.getMaterialityThreshold(context)) {
      const priorBorrowingChange = context.priorPeriod ? 0 : undefined;

      items.push({
        code: 'CFF_DEBT',
        name: borrowingChange >= 0 ? 'Proceeds from borrowings' : 'Repayment of borrowings',
        currentPeriod: borrowingChange,
        priorPeriod: priorBorrowingChange,
        variance: priorBorrowingChange !== undefined ? borrowingChange - priorBorrowingChange : undefined,
        variancePercent: undefined,
        formattedCurrent: this.formatCurrency(borrowingChange, context),
        formattedPrior: priorBorrowingChange !== undefined ? this.formatCurrency(priorBorrowingChange, context) : undefined,
        formattedVariance: priorBorrowingChange !== undefined ? this.formatCurrency(borrowingChange - priorBorrowingChange, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.17(c)'
      });
    }

    // Share capital changes
    const equityAccounts = accounts.filter(account => 
      account.type === 'Equity' && 
      (account.name.toLowerCase().includes('capital') ||
       account.name.toLowerCase().includes('share') ||
       account.subcategory === 'Share Capital')
    );

    const equityChange = equityAccounts.reduce((sum, account) => {
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum + change;
    }, 0);

    if (Math.abs(equityChange) >= this.getMaterialityThreshold(context)) {
      const priorEquityChange = context.priorPeriod ? 0 : undefined;

      items.push({
        code: 'CFF_EQUITY',
        name: equityChange >= 0 ? 'Proceeds from issue of shares' : 'Purchase of treasury shares',
        currentPeriod: equityChange,
        priorPeriod: priorEquityChange,
        variance: priorEquityChange !== undefined ? equityChange - priorEquityChange : undefined,
        variancePercent: undefined,
        formattedCurrent: this.formatCurrency(equityChange, context),
        formattedPrior: priorEquityChange !== undefined ? this.formatCurrency(priorEquityChange, context) : undefined,
        formattedVariance: priorEquityChange !== undefined ? this.formatCurrency(equityChange - priorEquityChange, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.17(a)'
      });
    }

    const total = items.reduce((sum, item) => sum + item.currentPeriod, 0);
    const priorTotal = context.priorPeriod ? items.reduce((sum, item) => sum + (item.priorPeriod || 0), 0) : undefined;

    return {
      name: 'Cash flows from financing activities',
      items,
      total,
      priorTotal,
      formattedTotal: this.formatCurrency(total, context),
      formattedPriorTotal: priorTotal !== undefined ? this.formatCurrency(priorTotal, context) : undefined,
      variance: priorTotal !== undefined ? total - priorTotal : undefined,
      variancePercent: (priorTotal && priorTotal !== 0) ? ((total - priorTotal) / priorTotal) * 100 : undefined,
      formattedVariance: priorTotal !== undefined ? this.formatCurrency(total - priorTotal, context) : undefined
    };
  }

  /**
   * Calculate non-cash adjustments for indirect method
   */
  private static calculateNonCashAdjustments(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementItem[] {
    const adjustments: FinancialStatementItem[] = [];

    // Depreciation and amortization
    const depreciationAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      (account.name.toLowerCase().includes('depreciation') ||
       account.name.toLowerCase().includes('amortization'))
    );

    const depreciation = depreciationAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const priorDepreciation = context.priorPeriod ? 
      depreciationAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : undefined;

    if (depreciation > 0) {
      adjustments.push({
        code: 'DEP',
        name: 'Depreciation and amortization',
        currentPeriod: depreciation,
        priorPeriod: priorDepreciation,
        variance: priorDepreciation !== undefined ? depreciation - priorDepreciation : undefined,
        variancePercent: (priorDepreciation && priorDepreciation !== 0) ? ((depreciation - priorDepreciation) / priorDepreciation) * 100 : undefined,
        formattedCurrent: this.formatCurrency(depreciation, context),
        formattedPrior: priorDepreciation !== undefined ? this.formatCurrency(priorDepreciation, context) : undefined,
        formattedVariance: priorDepreciation !== undefined ? this.formatCurrency(depreciation - priorDepreciation, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.20(a)'
      });
    }

    return adjustments;
  }

  /**
   * Calculate working capital changes for indirect method
   */
  private static calculateWorkingCapitalChanges(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ): FinancialStatementItem[] {
    const changes: FinancialStatementItem[] = [];

    // Trade receivables
    const receivableAccounts = accounts.filter(account => 
      account.type === 'Assets' && 
      account.name.toLowerCase().includes('receivable')
    );

    const receivableChange = receivableAccounts.reduce((sum, account) => {
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum + change;
    }, 0);

    if (Math.abs(receivableChange) >= this.getMaterialityThreshold(context)) {
      changes.push({
        code: 'WC_REC',
        name: '(Increase)/decrease in trade receivables',
        currentPeriod: -receivableChange, // Increase in receivables reduces cash
        priorPeriod: context.priorPeriod ? 0 : undefined,
        variance: undefined,
        variancePercent: undefined,
        formattedCurrent: this.formatCurrency(-receivableChange, context),
        formattedPrior: context.priorPeriod ? this.formatCurrency(0, context) : undefined,
        formattedVariance: undefined,
        level: 1,
        ifrsReference: 'IAS 7.20(b)'
      });
    }

    // Trade payables
    const payableAccounts = accounts.filter(account => 
      account.type === 'Liability' && 
      account.name.toLowerCase().includes('payable')
    );

    const payableChange = payableAccounts.reduce((sum, account) => {
      const change = (currentBalances[account.id] || 0) - (priorBalances[account.id] || 0);
      return sum + change;
    }, 0);

    if (Math.abs(payableChange) >= this.getMaterialityThreshold(context)) {
      changes.push({
        code: 'WC_PAY',
        name: 'Increase/(decrease) in trade payables',
        currentPeriod: payableChange, // Increase in payables increases cash
        priorPeriod: context.priorPeriod ? 0 : undefined,
        variance: undefined,
        variancePercent: undefined,
        formattedCurrent: this.formatCurrency(payableChange, context),
        formattedPrior: context.priorPeriod ? this.formatCurrency(0, context) : undefined,
        formattedVariance: undefined,
        level: 1,
        ifrsReference: 'IAS 7.20(b)'
      });
    }

    return changes;
  }

  /**
   * Calculate net cash flow
   */
  private static calculateNetCashFlow(
    operatingActivities: FinancialStatementSection,
    investingActivities: FinancialStatementSection,
    financingActivities: FinancialStatementSection,
    context: CalculationContext
  ) {
    const current = operatingActivities.total + investingActivities.total + financingActivities.total;
    const prior = context.priorPeriod ? 
      (operatingActivities.priorTotal || 0) + (investingActivities.priorTotal || 0) + (financingActivities.priorTotal || 0) : undefined;
    const variance = prior !== undefined ? current - prior : undefined;
    const variancePercent = (prior && prior !== 0) ? (variance! / prior) * 100 : undefined;

    return {
      current,
      prior,
      formatted: this.formatCurrency(current, context),
      formattedPrior: prior !== undefined ? this.formatCurrency(prior, context) : undefined,
      variance,
      variancePercent,
      formattedVariance: variance !== undefined ? this.formatCurrency(variance, context) : undefined
    };
  }

  /**
   * Calculate cash reconciliation
   */
  private static calculateCashReconciliation(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    netCashFlow: any,
    context: CalculationContext
  ) {
    // Find cash and cash equivalent accounts
    const cashAccounts = accounts.filter(account => 
      account.type === 'Assets' && 
      (account.subcategory === 'Cash and Cash Equivalents' ||
       account.name.toLowerCase().includes('cash') ||
       account.name.toLowerCase().includes('bank'))
    );

    const openingCash = cashAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0);
    const closingCash = cashAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const actualChange = closingCash - openingCash;
    
    const difference = netCashFlow.current - actualChange;
    const isReconciled = Math.abs(difference) < 0.01; // Allow for rounding differences

    return {
      openingCash,
      closingCash,
      netCashFlow: netCashFlow.current,
      actualChange,
      difference,
      isReconciled,
      formattedOpeningCash: this.formatCurrency(openingCash, context),
      formattedClosingCash: this.formatCurrency(closingCash, context),
      formattedNetCashFlow: this.formatCurrency(netCashFlow.current, context),
      formattedActualChange: this.formatCurrency(actualChange, context),
      formattedDifference: this.formatCurrency(difference, context)
    };
  }

  /**
   * Calculate supplementary disclosures
   */
  private static calculateSupplementaryDisclosures(
    accounts: ChartOfAccount[],
    currentBalances: { [accountId: string]: number },
    priorBalances: { [accountId: string]: number },
    context: CalculationContext
  ) {
    const disclosures: FinancialStatementItem[] = [];

    // Interest paid
    const interestExpenseAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      account.name.toLowerCase().includes('interest')
    );

    const interestPaid = interestExpenseAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const priorInterestPaid = context.priorPeriod ? 
      interestExpenseAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : undefined;

    if (interestPaid > 0) {
      disclosures.push({
        code: 'INT_PAID',
        name: 'Interest paid',
        currentPeriod: interestPaid,
        priorPeriod: priorInterestPaid,
        variance: priorInterestPaid !== undefined ? interestPaid - priorInterestPaid : undefined,
        variancePercent: (priorInterestPaid && priorInterestPaid !== 0) ? ((interestPaid - priorInterestPaid) / priorInterestPaid) * 100 : undefined,
        formattedCurrent: this.formatCurrency(interestPaid, context),
        formattedPrior: priorInterestPaid !== undefined ? this.formatCurrency(priorInterestPaid, context) : undefined,
        formattedVariance: priorInterestPaid !== undefined ? this.formatCurrency(interestPaid - priorInterestPaid, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.31'
      });
    }

    // Income tax paid
    const taxAccounts = accounts.filter(account => 
      account.type === 'Expense' && 
      account.name.toLowerCase().includes('tax')
    );

    const taxPaid = taxAccounts.reduce((sum, account) => sum + (currentBalances[account.id] || 0), 0);
    const priorTaxPaid = context.priorPeriod ? 
      taxAccounts.reduce((sum, account) => sum + (priorBalances[account.id] || 0), 0) : undefined;

    if (taxPaid > 0) {
      disclosures.push({
        code: 'TAX_PAID',
        name: 'Income tax paid',
        currentPeriod: taxPaid,
        priorPeriod: priorTaxPaid,
        variance: priorTaxPaid !== undefined ? taxPaid - priorTaxPaid : undefined,
        variancePercent: (priorTaxPaid && priorTaxPaid !== 0) ? ((taxPaid - priorTaxPaid) / priorTaxPaid) * 100 : undefined,
        formattedCurrent: this.formatCurrency(taxPaid, context),
        formattedPrior: priorTaxPaid !== undefined ? this.formatCurrency(priorTaxPaid, context) : undefined,
        formattedVariance: priorTaxPaid !== undefined ? this.formatCurrency(taxPaid - priorTaxPaid, context) : undefined,
        level: 1,
        ifrsReference: 'IAS 7.35'
      });
    }

    return disclosures;
  }

  /**
   * Validate cash flow statement
   */
  private static validateCashFlowStatement(
    operatingActivities: FinancialStatementSection,
    investingActivities: FinancialStatementSection,
    financingActivities: FinancialStatementSection,
    context: CalculationContext
  ): StatementValidationResult[] {
    const validation: StatementValidationResult[] = [];

    if (context.ifrsCompliant) {
      // IAS 7 - Operating Activities
      if (operatingActivities.items.length === 0) {
        validation.push({
          statementType: 'CashFlow',
          ruleName: 'IAS7_OPERATING',
          severity: 'warning',
          message: 'No operating cash flows detected',
          ifrsReference: 'IAS 7.13'
        });
      }

      // IAS 7 - Classification
      validation.push({
        statementType: 'CashFlow',
        ruleName: 'IAS7_CLASSIFICATION',
        severity: 'info',
        message: 'Ensure cash flows are classified consistently between periods',
        ifrsReference: 'IAS 7.11'
      });

      // IAS 7 - Comparative Information
      if (!context.priorPeriod) {
        validation.push({
          statementType: 'CashFlow',
          ruleName: 'IAS7_COMPARATIVE',
          severity: 'warning',
          message: 'IFRS requires comparative information for the preceding period',
          ifrsReference: 'IAS 1.38'
        });
      }
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
    companySettings?: CompanySettings,
    method: 'direct' | 'indirect' = 'indirect'
  ): StatementMetadata {
    return {
      companyName: companySettings?.companyName || 'Company Name',
      statementTitle: `Statement of Cash Flows (${method.charAt(0).toUpperCase() + method.slice(1)} Method)`,
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