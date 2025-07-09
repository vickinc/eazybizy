import { 
  FinancialStatementNote,
  FinancialStatementSubNote,
  NoteTable,
  NoteTableRow,
  NoteCategory,
  NotesConfiguration,
  StatementPeriod,
  BalanceSheetData,
  ProfitLossData,
  CashFlowData,
  EquityChangesData
} from '@/types/financialStatements.types';
import { IFRSSettings, CompanySettings } from '@/types/settings.types';
import { MultiCurrencyFinancialStatement, IFRSDisclosure } from '@/types/multiCurrency.types';
import { ConsolidatedFinancialStatements } from '@/types/consolidation.types';
import { FixedAsset, AssetCategory, DepreciationMethod } from '@/types/fixedAssets.types';
import { FixedAssetsBusinessService } from './fixedAssetsBusinessService';
import { FixedAssetsDepreciationService } from './fixedAssetsDepreciationService';

/**
 * Financial Statements Notes Service
 * 
 * Generates IFRS-compliant notes to financial statements
 * following IAS 1 requirements for note disclosures.
 * 
 * Key IFRS Requirements:
 * - IAS 1.112: Summary of significant accounting policies
 * - IAS 1.125: Sources of estimation uncertainty
 * - IAS 1.134: Capital management disclosures
 * - IFRS 7: Financial instruments disclosures
 * - IFRS 15: Revenue recognition disclosures
 */
export class FinancialStatementsNotesService {
  
  /**
   * Generate complete notes to financial statements
   */
  static async generateFinancialStatementsNotes(
    statements: {
      balanceSheet?: BalanceSheetData;
      profitLoss?: ProfitLossData;
      cashFlow?: CashFlowData;
      equityChanges?: EquityChangesData;
      multiCurrency?: MultiCurrencyFinancialStatement;
      consolidated?: ConsolidatedFinancialStatements;
    },
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings,
    configuration?: NotesConfiguration
  ): Promise<FinancialStatementNote[]> {
    
    const config = this.getDefaultConfiguration(configuration);
    const notes: FinancialStatementNote[] = [];
    
    try {
      // 1. Accounting Policies (Always first)
      if (config.includeAccountingPolicies) {
        notes.push(...await this.generateAccountingPoliciesNotes(ifrsSettings, companySettings));
      }
      
      // 2. Critical Estimates and Judgments
      if (config.includeEstimatesAndJudgments) {
        notes.push(...await this.generateCriticalEstimatesNotes(statements, ifrsSettings));
      }
      
      // 3. Revenue Notes
      if (statements.profitLoss) {
        notes.push(...await this.generateRevenueNotes(statements.profitLoss, currentPeriod, priorPeriod, ifrsSettings));
      }
      
      // 4. Property, Plant and Equipment
      if (statements.balanceSheet) {
        notes.push(...await this.generatePPENodes(statements.balanceSheet, currentPeriod, priorPeriod));
        
        // Add comprehensive Fixed Assets notes
        notes.push(...await this.generateFixedAssetNotes(currentPeriod, priorPeriod, ifrsSettings));
      }
      
      // 5. Financial Instruments
      if (statements.balanceSheet) {
        notes.push(...await this.generateFinancialInstrumentsNotes(statements.balanceSheet, ifrsSettings));
      }
      
      // 6. Equity Notes
      if (statements.equityChanges) {
        notes.push(...await this.generateEquityNotes(statements.equityChanges, currentPeriod));
      }
      
      // 7. Cash Flow Notes
      if (statements.cashFlow) {
        notes.push(...await this.generateCashFlowNotes(statements.cashFlow, currentPeriod));
      }
      
      // 8. Risk Management
      if (config.includeRiskDisclosures) {
        notes.push(...await this.generateRiskManagementNotes(statements, ifrsSettings));
      }
      
      // 9. Related Party Transactions
      if (config.includeRelatedPartyTransactions) {
        notes.push(...await this.generateRelatedPartyNotes(currentPeriod, companySettings));
      }
      
      // 10. Foreign Currency (if multi-currency)
      if (statements.multiCurrency) {
        notes.push(...await this.generateForeignCurrencyNotes(statements.multiCurrency, ifrsSettings));
      }
      
      // 11. Consolidation (if consolidated)
      if (statements.consolidated) {
        notes.push(...await this.generateConsolidationNotes(statements.consolidated, ifrsSettings));
      }
      
      // 12. Segment Reporting (if configured)
      if (config.includeSegmentReporting && statements.consolidated) {
        notes.push(...await this.generateSegmentReportingNotes(statements.consolidated));
      }
      
      // 13. Subsequent Events (always last)
      notes.push(...await this.generateSubsequentEventsNote(currentPeriod));
      
      // Number the notes according to configuration
      return this.numberNotes(notes, config);
      
    } catch (error) {
      console.error('Failed to generate financial statements notes:', error);
      throw new Error(`Notes generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  /**
   * Get default notes configuration
   */
  private static getDefaultConfiguration(config?: NotesConfiguration): NotesConfiguration {
    return {
      includeAccountingPolicies: true,
      includeEstimatesAndJudgments: true,
      includeRiskDisclosures: true,
      includeSegmentReporting: false,
      includeRelatedPartyTransactions: true,
      materialityThreshold: 5,
      autoGenerateNotes: true,
      noteNumberingStyle: 'numeric',
      groupByStatement: false,
      ...config
    };
  }
  
  /**
   * Generate accounting policies notes
   */
  private static async generateAccountingPoliciesNotes(
    ifrsSettings?: IFRSSettings,
    companySettings?: CompanySettings
  ): Promise<FinancialStatementNote[]> {
    const accountingPoliciesNote: FinancialStatementNote = {
      id: 'note-accounting-policies',
      noteNumber: '1',
      title: 'Summary of Significant Accounting Policies',
      content: '',
      ifrsReference: 'IAS 1.112',
      statementReferences: ['BalanceSheet', 'ProfitLoss', 'CashFlow', 'EquityChanges'],
      isRequired: true,
      materialityBased: false,
      category: 'AccountingPolicies',
      subNotes: [
        {
          id: 'sub-basis-of-preparation',
          title: 'Basis of Preparation',
          content: `These financial statements have been prepared in accordance with International Financial Reporting Standards (IFRS) as issued by the International Accounting Standards Board (IASB). The financial statements have been prepared under the historical cost convention, except for certain financial instruments that are measured at fair value.\n\nThe preparation of financial statements in conformity with IFRS requires the use of certain critical accounting estimates. It also requires management to exercise its judgment in the process of applying the company's accounting policies.`,
          crossReferences: ['IAS 1.16', 'IAS 8.10']
        },
        {
          id: 'sub-functional-currency',
          title: 'Functional and Presentation Currency',
          content: `The functional currency of the company is ${ifrsSettings?.functionalCurrency || 'USD'}. The financial statements are presented in ${ifrsSettings?.presentationCurrency || ifrsSettings?.functionalCurrency || 'USD'}, which is the company's functional currency. All amounts have been rounded to the nearest dollar unless otherwise indicated.`,
          crossReferences: ['IAS 21.8']
        },
        {
          id: 'sub-revenue-recognition',
          title: 'Revenue Recognition',
          content: `Revenue is measured at the fair value of the consideration received or receivable for the sale of goods and services in the ordinary course of the company's activities. Revenue is shown net of value-added tax, returns, rebates and discounts.\n\nThe company recognizes revenue when the amount of revenue can be reliably measured, it is probable that future economic benefits will flow to the entity and specific criteria have been met for each of the company's activities as described below.`,
          crossReferences: ['IFRS 15.2']
        },
        {
          id: 'sub-property-plant-equipment',
          title: 'Property, Plant and Equipment',
          content: `Property, plant and equipment are stated at historical cost less accumulated depreciation and accumulated impairment losses. Historical cost includes expenditure that is directly attributable to the acquisition of the items.\n\nDepreciation is calculated using the straight-line method to allocate their cost to their residual values over their estimated useful lives. The annual depreciation rates used are as follows:\n- Buildings: 2-4%\n- Plant and equipment: 10-20%\n- Motor vehicles: 20-25%\n- Computer equipment: 25-33%`,
          crossReferences: ['IAS 16.15', 'IAS 16.50']
        },
        {
          id: 'sub-financial-instruments',
          title: 'Financial Instruments',
          content: `Financial assets and financial liabilities are recognized when the company becomes a party to the contractual provisions of the instrument.\n\nFinancial assets are derecognized when the contractual rights to the cash flows from the financial asset expire, or when the financial asset and substantially all the risks and rewards are transferred.\n\nA financial liability is derecognized when it is extinguished, discharged, cancelled or expires.`,
          crossReferences: ['IFRS 9.3.1.1', 'IFRS 9.3.2.3']
        }
      ]
    };
    
    return [accountingPoliciesNote];
  }
  
  /**
   * Generate critical estimates and judgments notes
   */
  private static async generateCriticalEstimatesNotes(
    statements: unknown,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    const criticalEstimatesNote: FinancialStatementNote = {
      id: 'note-critical-estimates',
      noteNumber: '2',
      title: 'Critical Accounting Estimates and Judgments',
      content: `Estimates and judgments are continually evaluated and are based on historical experience and other factors, including expectations of future events that are believed to be reasonable under the circumstances.`,
      ifrsReference: 'IAS 1.125',
      statementReferences: ['BalanceSheet', 'ProfitLoss'],
      isRequired: true,
      materialityBased: false,
      category: 'CriticalEstimates',
      subNotes: [
        {
          id: 'sub-depreciation-rates',
          title: 'Useful Lives of Property, Plant and Equipment',
          content: `The company reviews the estimated useful lives of property, plant and equipment at the end of each annual reporting period. During the current period, management determined that the useful lives of certain equipment should be revised based on recent technological developments.`,
          crossReferences: ['IAS 16.51']
        },
        {
          id: 'sub-impairment-testing',
          title: 'Impairment Testing',
          content: `The company tests annually whether assets have suffered any impairment. The recoverable amounts of cash-generating units have been determined based on value-in-use calculations. These calculations require the use of estimates and assumptions.`,
          crossReferences: ['IAS 36.6']
        },
        {
          id: 'sub-provision-estimates',
          title: 'Provisions and Contingencies',
          content: `Provisions are recognized when the company has a present legal or constructive obligation as a result of past events, it is probable that an outflow of resources will be required to settle the obligation, and the amount can be reliably estimated.`,
          crossReferences: ['IAS 37.14']
        }
      ]
    };
    
    return [criticalEstimatesNote];
  }
  
  /**
   * Generate revenue notes
   */
  private static async generateRevenueNotes(
    profitLoss: ProfitLossData,
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    // Sample revenue breakdown table
    const revenueTable: NoteTable = {
      id: 'revenue-breakdown-table',
      title: 'Revenue by Category',
      headers: ['Revenue Category', 'Current Year', 'Prior Year'],
      rows: [
        {
          id: 'sales-goods',
          cells: ['Sale of goods', '$850,000', '$720,000'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'services',
          cells: ['Rendering of services', '$450,000', '$380,000'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'total-revenue',
          cells: ['Total Revenue', '$1,300,000', '$1,100,000'],
          isSubtotal: false,
          isTotal: true,
          emphasis: true
        }
      ],
      footnotes: ['Revenue is recognized at the point in time when control transfers to the customer']
    };
    
    const revenueNote: FinancialStatementNote = {
      id: 'note-revenue',
      noteNumber: '3',
      title: 'Revenue',
      content: `Revenue comprises the fair value of the consideration received or receivable for the sale of goods and services in the ordinary course of the company's activities.`,
      ifrsReference: 'IFRS 15.2',
      statementReferences: ['ProfitLoss'],
      isRequired: true,
      materialityBased: false,
      category: 'Revenue',
      subNotes: [
        {
          id: 'sub-revenue-breakdown',
          title: 'Revenue by Major Category',
          content: 'The following table shows revenue by major category:',
          tables: [revenueTable],
          crossReferences: ['IFRS 15.114']
        },
        {
          id: 'sub-contract-balances',
          title: 'Contract Balances',
          content: `Contract assets primarily relate to the company's rights to consideration for work completed but not billed at the reporting date. Contract assets are transferred to receivables when the rights become unconditional.\n\nContract liabilities relate to payments received in advance of performance under the contract. Contract liabilities are recognized as revenue as the company performs under the contract.`,
          crossReferences: ['IFRS 15.105']
        }
      ]
    };
    
    return [revenueNote];
  }
  
  /**
   * Generate property, plant and equipment notes
   */
  private static async generatePPENodes(
    balanceSheet: BalanceSheetData,
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod
  ): Promise<FinancialStatementNote[]> {
    const ppeMovementTable: NoteTable = {
      id: 'ppe-movement-table',
      title: 'Property, Plant and Equipment Movement',
      headers: ['', 'Buildings', 'Plant & Equipment', 'Motor Vehicles', 'Total'],
      rows: [
        {
          id: 'cost-opening',
          cells: ['Cost - Opening balance', '$500,000', '$300,000', '$80,000', '$880,000'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'additions',
          cells: ['Additions', '$0', '$50,000', '$25,000', '$75,000'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'disposals',
          cells: ['Disposals', '$0', '($20,000)', '($15,000)', '($35,000)'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'cost-closing',
          cells: ['Cost - Closing balance', '$500,000', '$330,000', '$90,000', '$920,000'],
          isSubtotal: true,
          isTotal: false,
          emphasis: true
        },
        {
          id: 'depreciation-opening',
          cells: ['Accumulated depreciation - Opening', '($200,000)', '($180,000)', '($60,000)', '($440,000)'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'depreciation-charge',
          cells: ['Depreciation charge', '($20,000)', '($30,000)', '($15,000)', '($65,000)'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'depreciation-disposals',
          cells: ['Disposals', '$0', '$15,000', '$12,000', '$27,000'],
          isSubtotal: false,
          isTotal: false
        },
        {
          id: 'depreciation-closing',
          cells: ['Accumulated depreciation - Closing', '($220,000)', '($195,000)', '($63,000)', '($478,000)'],
          isSubtotal: true,
          isTotal: false,
          emphasis: true
        },
        {
          id: 'carrying-amount',
          cells: ['Net carrying amount', '$280,000', '$135,000', '$27,000', '$442,000'],
          isSubtotal: false,
          isTotal: true,
          emphasis: true
        }
      ]
    };
    
    const ppeNote: FinancialStatementNote = {
      id: 'note-ppe',
      noteNumber: '4',
      title: 'Property, Plant and Equipment',
      content: `Property, plant and equipment are stated at cost less accumulated depreciation and accumulated impairment losses.`,
      ifrsReference: 'IAS 16.15',
      statementReferences: ['BalanceSheet'],
      isRequired: true,
      materialityBased: false,
      category: 'Assets',
      subNotes: [
        {
          id: 'sub-ppe-movement',
          title: 'Movement in Property, Plant and Equipment',
          content: 'The following table shows the movement in property, plant and equipment during the year:',
          tables: [ppeMovementTable],
          crossReferences: ['IAS 16.73(d)']
        },
        {
          id: 'sub-depreciation-methods',
          title: 'Depreciation Methods and Useful Lives',
          content: `Depreciation is calculated using the straight-line method over the estimated useful lives of the assets:\n- Buildings: 25-50 years\n- Plant and equipment: 5-10 years\n- Motor vehicles: 4-5 years\n\nThe residual values and useful lives are reviewed and adjusted if appropriate at each balance sheet date.`,
          crossReferences: ['IAS 16.51']
        }
      ]
    };
    
    return [ppeNote];
  }
  
  /**
   * Generate financial instruments notes
   */
  private static async generateFinancialInstrumentsNotes(
    balanceSheet: BalanceSheetData,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    const financialInstrumentsNote: FinancialStatementNote = {
      id: 'note-financial-instruments',
      noteNumber: '5',
      title: 'Financial Instruments',
      content: `Financial instruments are classified and measured in accordance with IFRS 9 Financial Instruments.`,
      ifrsReference: 'IFRS 7.6',
      statementReferences: ['BalanceSheet'],
      isRequired: true,
      materialityBased: false,
      category: 'Assets',
      subNotes: [
        {
          id: 'sub-financial-assets',
          title: 'Financial Assets',
          content: `Financial assets are classified into the following categories:\n- Financial assets at amortized cost\n- Financial assets at fair value through other comprehensive income\n- Financial assets at fair value through profit or loss\n\nThe classification depends on the entity's business model for managing the financial assets and the contractual terms of the cash flows.`,
          crossReferences: ['IFRS 9.4.1.1']
        },
        {
          id: 'sub-credit-risk',
          title: 'Credit Risk',
          content: `The company applies the IFRS 9 simplified approach to measuring expected credit losses which uses a lifetime expected loss allowance for all trade receivables. To measure the expected credit losses, trade receivables have been grouped based on shared credit risk characteristics and the days past due.`,
          crossReferences: ['IFRS 9.5.5.15']
        }
      ]
    };
    
    return [financialInstrumentsNote];
  }
  
  /**
   * Generate equity notes
   */
  private static async generateEquityNotes(
    equityChanges: EquityChangesData,
    currentPeriod: StatementPeriod
  ): Promise<FinancialStatementNote[]> {
    const equityNote: FinancialStatementNote = {
      id: 'note-equity',
      noteNumber: '6',
      title: 'Share Capital and Reserves',
      content: `The authorized share capital consists of ordinary shares with no par value. All issued shares are fully paid.`,
      ifrsReference: 'IAS 1.79(a)',
      statementReferences: ['BalanceSheet', 'EquityChanges'],
      isRequired: true,
      materialityBased: false,
      category: 'Equity',
      subNotes: [
        {
          id: 'sub-share-capital',
          title: 'Share Capital',
          content: `The company has 100,000 authorized ordinary shares of which 100,000 shares are issued and fully paid. During the year, no shares were issued or repurchased.`,
          crossReferences: ['IAS 1.79(a)(i)']
        }
      ]
    };
    
    if (equityChanges.dividendInformation) {
      equityNote.subNotes?.push({
        id: 'sub-dividends',
        title: 'Dividends',
        content: `During the year, dividends of ${equityChanges.dividendInformation.dividendsPerShareFormatted} per share were declared and paid to shareholders.`,
        crossReferences: ['IAS 1.107']
      });
    }
    
    return [equityNote];
  }
  
  /**
   * Generate cash flow notes
   */
  private static async generateCashFlowNotes(
    cashFlow: CashFlowData,
    currentPeriod: StatementPeriod
  ): Promise<FinancialStatementNote[]> {
    const cashFlowNote: FinancialStatementNote = {
      id: 'note-cash-flow',
      noteNumber: '7',
      title: 'Cash and Cash Equivalents',
      content: `Cash and cash equivalents include cash on hand, deposits held at call with banks, and other short-term highly liquid investments with original maturities of three months or less.`,
      ifrsReference: 'IAS 7.6',
      statementReferences: ['BalanceSheet', 'CashFlow'],
      isRequired: true,
      materialityBased: false,
      category: 'CashFlow',
      subNotes: [
        {
          id: 'sub-cash-reconciliation',
          title: 'Reconciliation of Cash and Cash Equivalents',
          content: `The following table reconciles cash and cash equivalents as shown in the statement of cash flows with the related items in the statement of financial position:\n\nCash at bank: ${cashFlow.cashAtEnd.formatted}\nShort-term deposits: $0\nTotal cash and cash equivalents: ${cashFlow.cashAtEnd.formatted}`,
          crossReferences: ['IAS 7.45']
        }
      ]
    };
    
    return [cashFlowNote];
  }
  
  /**
   * Generate risk management notes
   */
  private static async generateRiskManagementNotes(
    statements: unknown,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    const riskNote: FinancialStatementNote = {
      id: 'note-risk-management',
      noteNumber: '8',
      title: 'Financial Risk Management',
      content: `The company's activities expose it to a variety of financial risks including market risk, credit risk, and liquidity risk.`,
      ifrsReference: 'IFRS 7.31',
      statementReferences: ['BalanceSheet'],
      isRequired: true,
      materialityBased: false,
      category: 'RiskManagement',
      subNotes: [
        {
          id: 'sub-credit-risk',
          title: 'Credit Risk',
          content: `Credit risk arises from cash and cash equivalents, deposits with banks and financial institutions, as well as credit exposures to customers, including outstanding receivables and committed transactions.`,
          crossReferences: ['IFRS 7.36']
        },
        {
          id: 'sub-liquidity-risk',
          title: 'Liquidity Risk',
          content: `Liquidity risk is the risk that the company will not be able to meet its financial obligations as they fall due. The company manages liquidity risk by maintaining adequate reserves and banking facilities.`,
          crossReferences: ['IFRS 7.39']
        }
      ]
    };
    
    return [riskNote];
  }
  
  /**
   * Generate related party notes
   */
  private static async generateRelatedPartyNotes(
    currentPeriod: StatementPeriod,
    companySettings?: CompanySettings
  ): Promise<FinancialStatementNote[]> {
    const relatedPartyNote: FinancialStatementNote = {
      id: 'note-related-parties',
      noteNumber: '9',
      title: 'Related Party Transactions',
      content: `A related party is a person or entity that is related to the entity that is preparing its financial statements.`,
      ifrsReference: 'IAS 24.9',
      statementReferences: ['BalanceSheet', 'ProfitLoss'],
      isRequired: true,
      materialityBased: false,
      category: 'RelatedParties',
      subNotes: [
        {
          id: 'sub-key-management',
          title: 'Key Management Personnel',
          content: `Key management personnel are those persons having authority and responsibility for planning, directing and controlling the activities of the entity. During the year, no significant transactions occurred with key management personnel other than compensation paid in the ordinary course of business.`,
          crossReferences: ['IAS 24.16']
        }
      ]
    };
    
    return [relatedPartyNote];
  }
  
  /**
   * Generate subsequent events note
   */
  private static async generateSubsequentEventsNote(
    currentPeriod: StatementPeriod
  ): Promise<FinancialStatementNote[]> {
    const subsequentEventsNote: FinancialStatementNote = {
      id: 'note-subsequent-events',
      noteNumber: '10',
      title: 'Events After the Reporting Period',
      content: `The directors are not aware of any significant events since the end of the reporting period that would require adjustment to or disclosure in the financial statements.`,
      ifrsReference: 'IAS 10.17',
      statementReferences: ['BalanceSheet', 'ProfitLoss', 'CashFlow'],
      isRequired: true,
      materialityBased: false,
      category: 'SubsequentEvents'
    };
    
    return [subsequentEventsNote];
  }
  
  /**
   * Generate foreign currency notes (IAS 21)
   */
  private static async generateForeignCurrencyNotes(
    multiCurrencyStatement: MultiCurrencyFinancialStatement,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    
    const foreignCurrencyNote: FinancialStatementNote = {
      id: 'note-foreign-currency',
      noteNumber: '10',
      title: 'Foreign Currency Translation',
      content: `The financial statements are presented in ${multiCurrencyStatement.presentationCurrency}, which is the company's presentation currency. The functional currency is ${multiCurrencyStatement.functionalCurrency}.`,
      ifrsReference: 'IAS 21.53',
      statementReferences: ['BalanceSheet', 'ProfitLoss', 'CashFlow'],
      isRequired: true,
      materialityBased: false,
      category: 'ForeignCurrency',
      subNotes: [
        {
          id: 'sub-translation-policy',
          title: 'Translation Policy',
          content: `Foreign currency transactions are translated into the functional currency using the exchange rates at the dates of the transactions. Foreign exchange gains and losses resulting from the settlement of such transactions and from the translation of monetary assets and liabilities denominated in foreign currencies at year-end exchange rates are generally recognized in profit or loss.`,
          crossReferences: ['IAS 21.21', 'IAS 21.28']
        },
        {
          id: 'sub-exchange-rates',
          title: 'Principal Exchange Rates',
          content: `The following are the principal exchange rates used for translation:\n\nAverage rate: ${multiCurrencyStatement.ratesUsed.averageRate.toFixed(4)}\nClosing rate: ${multiCurrencyStatement.ratesUsed.closingRate.toFixed(4)}`,
          crossReferences: ['IAS 21.54']
        }
      ]
    };
    
    // Add foreign exchange gains/losses if material
    if (Math.abs(multiCurrencyStatement.realizedFXGainLoss) > 1000 || Math.abs(multiCurrencyStatement.unrealizedFXGainLoss) > 1000) {
      foreignCurrencyNote.subNotes?.push({
        id: 'sub-fx-gains-losses',
        title: 'Foreign Exchange Gains and Losses',
        content: `Foreign exchange gains and losses recognized in profit or loss during the year:\n\nRealized foreign exchange gains/(losses): ${this.formatCurrency(multiCurrencyStatement.realizedFXGainLoss)}\nUnrealized foreign exchange gains/(losses): ${this.formatCurrency(multiCurrencyStatement.unrealizedFXGainLoss)}`,
        crossReferences: ['IAS 21.52']
      });
    }
    
    // Add translation adjustments if applicable
    if (Math.abs(multiCurrencyStatement.totalTranslationAdjustment) > 1000) {
      foreignCurrencyNote.subNotes?.push({
        id: 'sub-translation-adjustments',
        title: 'Translation Adjustments',
        content: `Exchange differences arising from the translation of foreign operations are recognized in other comprehensive income and accumulated in a separate component of equity. During the year, translation adjustments of ${this.formatCurrency(multiCurrencyStatement.totalTranslationAdjustment)} were recognized in other comprehensive income.`,
        crossReferences: ['IAS 21.39']
      });
    }
    
    return [foreignCurrencyNote];
  }
  
  /**
   * Generate consolidation notes (IFRS 10, IFRS 12)
   */
  private static async generateConsolidationNotes(
    consolidatedStatements: ConsolidatedFinancialStatements,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    
    const consolidationNote: FinancialStatementNote = {
      id: 'note-consolidation',
      noteNumber: '11',
      title: 'Basis of Consolidation',
      content: `The consolidated financial statements comprise the financial statements of the Company and its subsidiaries. Subsidiaries are fully consolidated from the date of acquisition, being the date on which the Company obtains control, and continue to be consolidated until the date when such control ceases.`,
      ifrsReference: 'IFRS 10.19',
      statementReferences: ['BalanceSheet', 'ProfitLoss', 'CashFlow'],
      isRequired: true,
      materialityBased: false,
      category: 'Consolidation',
      subNotes: [
        {
          id: 'sub-consolidation-principles',
          title: 'Consolidation Principles',
          content: `The financial statements of the subsidiaries are prepared for the same reporting period as the parent company, using consistent accounting policies. All intra-group balances, transactions, unrealized gains and losses resulting from intra-group transactions and dividends are eliminated in full.`,
          crossReferences: ['IFRS 10.B86']
        },
        {
          id: 'sub-subsidiaries',
          title: 'Subsidiaries',
          content: `The Group controls an entity when it is exposed to, or has rights to, variable returns from its involvement with the entity and has the ability to affect those returns through its power over the entity. The following entities are included in the consolidation:`,
          crossReferences: ['IFRS 10.7', 'IFRS 12.12']
        }
      ]
    };
    
    // Add non-controlling interests if applicable
    if (consolidatedStatements.nonControllingInterests.length > 0) {
      const totalNCI = consolidatedStatements.nonControllingInterests.reduce((sum, nci) => sum + nci.shareOfEquity, 0);
      
      consolidationNote.subNotes?.push({
        id: 'sub-non-controlling-interests',
        title: 'Non-controlling Interests',
        content: `Non-controlling interests represent the portion of profit or loss and net assets not held by the Group and are presented separately in the consolidated statement of profit or loss and within equity in the consolidated statement of financial position. Total non-controlling interests amount to ${this.formatCurrency(totalNCI)}.`,
        crossReferences: ['IFRS 10.22']
      });
    }
    
    // Add business combinations if any occurred during the period
    if (consolidatedStatements.businessCombinations.length > 0) {
      consolidationNote.subNotes?.push({
        id: 'sub-business-combinations',
        title: 'Business Combinations',
        content: `During the year, the Group completed business combinations. Business combinations are accounted for using the acquisition method as at the acquisition date, which is the date on which control is transferred to the Group.`,
        crossReferences: ['IFRS 3.4']
      });
    }
    
    return [consolidationNote];
  }
  
  /**
   * Generate segment reporting notes (IFRS 8)
   */
  private static async generateSegmentReportingNotes(
    consolidatedStatements: ConsolidatedFinancialStatements
  ): Promise<FinancialStatementNote[]> {
    
    if (!consolidatedStatements.segmentReporting.segments.length) {
      return [];
    }
    
    // Create segment table
    const segmentTable: NoteTable = {
      id: 'segment-table',
      title: 'Segment Information',
      headers: ['Segment', 'Revenue', 'Profit/(Loss)', 'Assets'],
      rows: consolidatedStatements.segmentReporting.segments.map(segment => ({
        id: `segment-${segment.name.toLowerCase().replace(/\s+/g, '-')}`,
        cells: [
          segment.name,
          this.formatCurrency(segment.revenue),
          this.formatCurrency(segment.profit),
          this.formatCurrency(segment.assets)
        ],
        isSubtotal: false,
        isTotal: false
      })),
      footnotes: ['Segments are reported in a manner consistent with internal reporting to the chief operating decision maker']
    };
    
    // Add total row
    const totalRevenue = consolidatedStatements.segmentReporting.segments.reduce((sum, s) => sum + s.revenue, 0);
    const totalProfit = consolidatedStatements.segmentReporting.segments.reduce((sum, s) => sum + s.profit, 0);
    const totalAssets = consolidatedStatements.segmentReporting.segments.reduce((sum, s) => sum + s.assets, 0);
    
    segmentTable.rows.push({
      id: 'segment-total',
      cells: ['Total', this.formatCurrency(totalRevenue), this.formatCurrency(totalProfit), this.formatCurrency(totalAssets)],
      isSubtotal: false,
      isTotal: true,
      emphasis: true
    });
    
    const segmentNote: FinancialStatementNote = {
      id: 'note-segment-reporting',
      noteNumber: '12',
      title: 'Segment Reporting',
      content: `Operating segments are reported in a manner consistent with the internal reporting provided to the chief operating decision-maker. The chief operating decision-maker has been identified as the Chief Executive Officer who makes strategic decisions.`,
      ifrsReference: 'IFRS 8.5',
      statementReferences: ['ProfitLoss', 'BalanceSheet'],
      isRequired: true,
      materialityBased: false,
      category: 'SegmentReporting',
      subNotes: [
        {
          id: 'sub-segment-results',
          title: 'Segment Results',
          content: 'The following table presents revenue, profit and asset information for the Group\'s operating segments:',
          tables: [segmentTable],
          crossReferences: ['IFRS 8.23']
        }
      ]
    };
    
    return [segmentNote];
  }
  
  /**
   * Generate comprehensive IFRS disclosure notes
   */
  static async generateIFRSDisclosureNotes(
    disclosures: IFRSDisclosure[],
    statements: unknown
  ): Promise<FinancialStatementNote[]> {
    
    const notes: FinancialStatementNote[] = [];
    
    // Group disclosures by category
    const groupedDisclosures = disclosures.reduce((groups, disclosure) => {
      if (!groups[disclosure.category]) {
        groups[disclosure.category] = [];
      }
      groups[disclosure.category].push(disclosure);
      return groups;
    }, {} as Record<string, IFRSDisclosure[]>);
    
    const noteNumber = 1;
    
    // Generate notes for each category
    for (const [category, categoryDisclosures] of Object.entries(groupedDisclosures)) {
      const note: FinancialStatementNote = {
        id: `note-${category.toLowerCase().replace(/\s+/g, '-')}`,
        noteNumber: noteNumber.toString(),
        title: this.formatCategoryTitle(category),
        content: this.aggregateDisclosureContent(categoryDisclosures),
        ifrsReference: categoryDisclosures[0]?.ifrsReference || '',
        statementReferences: ['BalanceSheet', 'ProfitLoss'],
        isRequired: categoryDisclosures.some(d => d.isRequired),
        materialityBased: categoryDisclosures.some(d => d.isMaterial),
        category: category as NoteCategory,
        subNotes: categoryDisclosures.length > 1 ? 
          categoryDisclosures.map(disclosure => ({
            id: `sub-${disclosure.id}`,
            title: disclosure.requirement,
            content: disclosure.content,
            crossReferences: [disclosure.ifrsReference]
          })) : undefined
      };
      
      notes.push(note);
      noteNumber++;
    }
    
    return notes;
  }
  
  /**
   * Generate materiality-based disclosures
   */
  static async generateMaterialityBasedDisclosures(
    statements: unknown,
    materialityThreshold: number,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    
    const notes: FinancialStatementNote[] = [];
    
    // Check for material items requiring disclosure
    const materialItems = await this.identifyMaterialItems(statements, materialityThreshold);
    
    if (materialItems.length > 0) {
      const materialityNote: FinancialStatementNote = {
        id: 'note-material-items',
        noteNumber: 'M1',
        title: 'Material Items',
        content: `The following items are considered material for disclosure purposes (materiality threshold: ${materialityThreshold}%):`,
        ifrsReference: 'IAS 1.7',
        statementReferences: ['BalanceSheet', 'ProfitLoss'],
        isRequired: true,
        materialityBased: true,
        category: 'Material',
        subNotes: materialItems.map(item => ({
          id: `sub-material-${item.id}`,
          title: item.description,
          content: item.details,
          crossReferences: item.ifrsReferences
        }))
      };
      
      notes.push(materialityNote);
    }
    
    return notes;
  }
  
  // Helper methods for the new functionality
  
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  }
  
  private static formatCategoryTitle(category: string): string {
    return category.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }
  
  private static aggregateDisclosureContent(disclosures: IFRSDisclosure[]): string {
    if (disclosures.length === 1) {
      return disclosures[0].content;
    }
    
    return `This note contains disclosures required by various IFRS standards. The following sections provide detailed information as required by the applicable standards.`;
  }
  
  private static async identifyMaterialItems(statements: unknown, threshold: number): Promise<any[]> {
    // Implementation to identify material items based on threshold
    // This would analyze the statements and identify items exceeding the materiality threshold
    return [];
  }
  
  /**
   * Number the notes according to configuration
   */
  private static numberNotes(
    notes: FinancialStatementNote[],
    config: NotesConfiguration
  ): FinancialStatementNote[] {
    return notes.map((note, index) => {
      let noteNumber: string;
      
      switch (config.noteNumberingStyle) {
        case 'alphabetic':
          noteNumber = String.fromCharCode(65 + index); // A, B, C...
          break;
        case 'custom':
          noteNumber = note.noteNumber; // Keep existing numbering
          break;
        default:
          noteNumber = (index + 1).toString(); // 1, 2, 3...
      }
      
      return {
        ...note,
        noteNumber
      };
    });
  }

  /**
   * Generate comprehensive Fixed Asset notes (IAS 16/38 compliant)
   */
  private static async generateFixedAssetNotes(
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod,
    ifrsSettings?: IFRSSettings
  ): Promise<FinancialStatementNote[]> {
    const notes: FinancialStatementNote[] = [];
    const fixedAssets = FixedAssetsBusinessService.getAllAssets();
    
    if (fixedAssets.length === 0) {
      return notes;
    }

    // Note: Property, Plant and Equipment - Detailed breakdown
    const ppeNote = await this.generatePPEDetailNote(fixedAssets, currentPeriod, priorPeriod);
    if (ppeNote) notes.push(ppeNote);

    // Note: Depreciation policies and methods
    const depreciationPolicyNote = this.generateDepreciationPolicyNote(fixedAssets);
    if (depreciationPolicyNote) notes.push(depreciationPolicyNote);

    // Note: Movement in PPE (IAS 16.73)
    const movementNote = await this.generatePPEMovementNote(fixedAssets, currentPeriod, priorPeriod);
    if (movementNote) notes.push(movementNote);

    // Note: Commitments and contingencies
    const commitmentsNote = this.generatePPECommitmentsNote(fixedAssets);
    if (commitmentsNote) notes.push(commitmentsNote);

    // Note: Impairment testing (if any impairments)
    const impairmentNote = this.generateImpairmentNote(fixedAssets);
    if (impairmentNote) notes.push(impairmentNote);

    // Note: Revaluations (if revaluation model used)
    const revaluationNote = this.generateRevaluationNote(fixedAssets);
    if (revaluationNote) notes.push(revaluationNote);

    return notes;
  }

  /**
   * Generate PPE detail note with carrying amounts
   */
  private static async generatePPEDetailNote(
    assets: FixedAsset[],
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod
  ): Promise<FinancialStatementNote> {
    const categories = Array.from(new Set(assets.map(asset => asset.category).filter(cat => cat !== 'Intangible Assets')));
    
    const tableRows: NoteTableRow[] = [];
    
    // Header row
    tableRows.push({
      id: 'ppe-header',
      cells: [
        { value: '', type: 'text', isHeader: true },
        { value: 'Cost', type: 'currency', isHeader: true },
        { value: 'Accumulated Depreciation', type: 'currency', isHeader: true },
        { value: 'Net Book Value', type: 'currency', isHeader: true }
      ]
    });

    const totalCost = 0;
    const totalAccumulated = 0;
    const totalNet = 0;

    categories.forEach(category => {
      const categoryAssets = assets.filter(asset => asset.category === category && asset.status === 'active');
      const cost = categoryAssets.reduce((sum, asset) => sum + asset.acquisitionCost, 0);
      const accumulated = categoryAssets.reduce((sum, asset) => sum + asset.accumulatedDepreciation, 0);
      const net = cost - accumulated;

      totalCost += cost;
      totalAccumulated += accumulated;
      totalNet += net;

      tableRows.push({
        id: `ppe-${category.toLowerCase().replace(/\s+/g, '-')}`,
        cells: [
          { value: category, type: 'text', isHeader: false },
          { value: cost, type: 'currency', isHeader: false },
          { value: accumulated, type: 'currency', isHeader: false },
          { value: net, type: 'currency', isHeader: false }
        ]
      });
    });

    // Total row
    tableRows.push({
      id: 'ppe-total',
      cells: [
        { value: 'Total Property, Plant and Equipment', type: 'text', isHeader: false, isBold: true },
        { value: totalCost, type: 'currency', isHeader: false, isBold: true },
        { value: totalAccumulated, type: 'currency', isHeader: false, isBold: true },
        { value: totalNet, type: 'currency', isHeader: false, isBold: true }
      ]
    });

    const table: NoteTable = {
      id: 'ppe-breakdown-table',
      title: 'Property, Plant and Equipment',
      headers: ['Category', 'Cost', 'Accumulated Depreciation', 'Net Book Value'],
      rows: tableRows,
      totals: [{
        label: 'Total',
        amount: totalNet,
        formatted: this.formatCurrency(totalNet, ifrsSettings?.functionalCurrency || 'USD')
      }]
    };

    return {
      id: 'note-ppe-detail',
      noteNumber: '', // Will be assigned during numbering
      title: 'Property, Plant and Equipment',
      category: 'Balance Sheet',
      content: [
        'Property, plant and equipment are stated at cost less accumulated depreciation and any accumulated impairment losses.',
        'The carrying amounts of property, plant and equipment at the reporting date were as follows:'
      ],
      tables: [table],
      references: ['IAS 16.73', 'IAS 16.74'],
      subNotes: []
    };
  }

  /**
   * Generate depreciation policy note
   */
  private static generateDepreciationPolicyNote(assets: FixedAsset[]): FinancialStatementNote {
    const categories = Array.from(new Set(assets.map(asset => asset.category)));
    const depreciationInfo: string[] = [];

    depreciationInfo.push('Depreciation is calculated on a straight-line basis over the estimated useful lives of the assets as follows:');

    categories.forEach(category => {
      const categoryAssets = assets.filter(asset => asset.category === category);
      const usefulLives = categoryAssets.map(asset => asset.usefulLifeYears);
      const minLife = Math.min(...usefulLives);
      const maxLife = Math.max(...usefulLives);
      const lifeRange = minLife === maxLife ? `${minLife} years` : `${minLife} - ${maxLife} years`;
      
      depreciationInfo.push(`• ${category}: ${lifeRange}`);
    });

    depreciationInfo.push('');
    depreciationInfo.push('The useful lives and depreciation methods are reviewed annually and adjusted if appropriate.');
    depreciationInfo.push('Residual values are reviewed annually and adjusted when materially different from current estimates.');

    return {
      id: 'note-depreciation-policy',
      noteNumber: '',
      title: 'Depreciation Policies',
      category: 'Accounting Policies',
      content: depreciationInfo,
      references: ['IAS 16.43', 'IAS 16.51'],
      subNotes: []
    };
  }

  /**
   * Generate PPE movement note (reconciliation)
   */
  private static async generatePPEMovementNote(
    assets: FixedAsset[],
    currentPeriod: StatementPeriod,
    priorPeriod?: StatementPeriod
  ): Promise<FinancialStatementNote> {
    const categories = Array.from(new Set(assets.map(asset => asset.category).filter(cat => cat !== 'Intangible Assets')));
    
    const tableRows: NoteTableRow[] = [];
    
    // Header row
    const headers = ['Category', 'Opening Balance', 'Additions', 'Disposals', 'Depreciation', 'Closing Balance'];
    tableRows.push({
      id: 'movement-header',
      cells: headers.map(header => ({ value: header, type: 'text', isHeader: true }))
    });

    const currentYear = new Date(currentPeriod.endDate).getFullYear();

    categories.forEach(category => {
      const categoryAssets = assets.filter(asset => asset.category === category);
      
      // Calculate movements
      const openingBalance = categoryAssets.reduce((sum, asset) => {
        // Opening balance = current book value + depreciation for current year
        const currentYearDep = asset.accumulatedDepreciation; // Simplified
        return sum + asset.currentBookValue + currentYearDep;
      }, 0);
      
      const additions = categoryAssets.filter(asset => {
        const acquisitionDate = new Date(asset.acquisitionDate);
        return acquisitionDate.getFullYear() === currentYear;
      }).reduce((sum, asset) => sum + asset.acquisitionCost, 0);
      
      const disposals = categoryAssets.filter(asset => 
        asset.status === 'disposed' && 
        asset.disposalDate &&
        new Date(asset.disposalDate).getFullYear() === currentYear
      ).reduce((sum, asset) => sum + asset.acquisitionCost, 0);
      
      const depreciation = categoryAssets.reduce((sum, asset) => {
        // This year's depreciation (simplified)
        return sum + FixedAssetsDepreciationService.calculateMonthlyDepreciation(asset) * 12;
      }, 0);
      
      const closingBalance = categoryAssets.filter(asset => asset.status === 'active')
        .reduce((sum, asset) => sum + asset.currentBookValue, 0);

      tableRows.push({
        id: `movement-${category.toLowerCase().replace(/\s+/g, '-')}`,
        cells: [
          { value: category, type: 'text', isHeader: false },
          { value: openingBalance, type: 'currency', isHeader: false },
          { value: additions, type: 'currency', isHeader: false },
          { value: -disposals, type: 'currency', isHeader: false },
          { value: -depreciation, type: 'currency', isHeader: false },
          { value: closingBalance, type: 'currency', isHeader: false }
        ]
      });
    });

    const table: NoteTable = {
      id: 'ppe-movement-table',
      title: 'Movement in Property, Plant and Equipment',
      headers,
      rows: tableRows
    };

    return {
      id: 'note-ppe-movement',
      noteNumber: '',
      title: 'Movement in Property, Plant and Equipment',
      category: 'Balance Sheet',
      content: [
        'The movement in property, plant and equipment during the year was as follows:'
      ],
      tables: [table],
      references: ['IAS 16.73(e)'],
      subNotes: []
    };
  }

  /**
   * Generate PPE commitments note
   */
  private static generatePPECommitmentsNote(assets: FixedAsset[]): FinancialStatementNote | null {
    // This would typically come from a separate commitments system
    // For now, return a standard disclosure
    
    return {
      id: 'note-ppe-commitments',
      noteNumber: '',
      title: 'Capital Commitments',
      category: 'Balance Sheet',
      content: [
        'Capital commitments for the acquisition of property, plant and equipment at the reporting date:',
        '',
        'Contracted but not provided for: $0',
        'Authorized but not contracted: $0',
        '',
        'No property, plant and equipment has been pledged as security for liabilities.'
      ],
      references: ['IAS 16.74(c)'],
      subNotes: []
    };
  }

  /**
   * Generate impairment note (if applicable)
   */
  private static generateImpairmentNote(assets: FixedAsset[]): FinancialStatementNote | null {
    // Check if any assets have impairment indicators
    const impairmentAssets = assets.filter(asset => {
      // This would check for actual impairment in a real system
      return false; // No impairments for now
    });

    if (impairmentAssets.length === 0) {
      return null;
    }

    return {
      id: 'note-impairment',
      noteNumber: '',
      title: 'Impairment of Assets',
      category: 'Balance Sheet',
      content: [
        'The Company tests property, plant and equipment for impairment when events or circumstances indicate that the carrying amount may not be recoverable.',
        '',
        'No impairment losses were recognized during the year.'
      ],
      references: ['IAS 36'],
      subNotes: []
    };
  }

  /**
   * Generate revaluation note (if applicable)
   */
  private static generateRevaluationNote(assets: FixedAsset[]): FinancialStatementNote | null {
    // Check if any assets use revaluation model
    const revaluedAssets = assets.filter(asset => {
      // This would check for revaluation model usage
      return false; // Cost model only for now
    });

    if (revaluedAssets.length === 0) {
      return null;
    }

    return {
      id: 'note-revaluation',
      noteNumber: '',
      title: 'Revaluation of Property, Plant and Equipment',
      category: 'Balance Sheet',
      content: [
        'The Company uses the cost model for property, plant and equipment.',
        'Assets are carried at cost less accumulated depreciation and impairment losses.'
      ],
      references: ['IAS 16.29'],
      subNotes: []
    };
  }

  /**
   * Format currency helper
   */
  private static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}