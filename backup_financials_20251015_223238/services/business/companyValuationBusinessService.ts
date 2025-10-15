/**
 * Company Valuation Business Service
 * 
 * Comprehensive service for calculating company valuations using multiple methods
 * including revenue multiples, EBITDA multiples, DCF analysis, and asset-based approaches.
 * 
 * Valuation Methods:
 * - Revenue Multiples (SaaS, Tech, Traditional)
 * - EBITDA/EBIT Multiples
 * - Discounted Cash Flow (DCF)
 * - Asset-Based Valuation
 * - Comparable Company Analysis
 * - Precedent Transaction Analysis
 */

export interface CompanyValuation {
  companyId: string;
  companyName: string;
  currency: string;
  valuationDate: Date;
  
  // Financial data inputs
  financialInputs: FinancialInputs;
  
  // Valuation methods
  valuationMethods: ValuationMethods;
  
  // Summary valuation range
  valuationSummary: ValuationSummary;
  
  // Market comparables
  comparables: MarketComparable[];
  
  // Sensitivity analysis
  sensitivityAnalysis: SensitivityAnalysis;
  
  // Risk factors
  riskFactors: ValuationRiskFactor[];
  
  generatedAt: Date;
}

export interface FinancialInputs {
  // Revenue metrics
  annualRevenue: number;
  revenueGrowthRate: number;
  monthlyRecurringRevenue?: number;
  
  // Profitability metrics
  grossProfit: number;
  grossMargin: number;
  ebitda: number;
  ebitdaMargin: number;
  netIncome: number;
  
  // Balance sheet items
  totalAssets: number;
  totalLiabilities: number;
  shareholdersEquity: number;
  
  // Cash flow metrics
  operatingCashFlow: number;
  freeCashFlow: number;
  
  // Industry/business metrics
  industryType: IndustryType;
  businessModel: BusinessModel;
  marketPosition: MarketPosition;
  
  // Other metrics
  employeeCount?: number;
  customersCount?: number;
  marketShare?: number;
}

export interface ValuationMethods {
  // Multiple-based valuations
  revenueMultiple: RevenueMultipleValuation;
  ebitdaMultiple: EBITDAMultipleValuation;
  
  // Cash flow-based valuations
  discountedCashFlow: DCFValuation;
  
  // Asset-based valuations
  assetBased: AssetBasedValuation;
  
  // Market-based valuations
  comparableCompany: ComparableCompanyValuation;
  precedentTransaction: PrecedentTransactionValuation;
}

export interface RevenueMultipleValuation {
  method: 'Revenue Multiple';
  
  // Multiple ranges by industry
  industryMultiples: {
    low: number;
    median: number;
    high: number;
  };
  
  // Adjustments
  adjustments: ValuationAdjustment[];
  
  // Final multiples
  adjustedMultiples: {
    low: number;
    median: number;
    high: number;
  };
  
  // Valuation results
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  confidence: number; // 1-10 scale
  weight: number; // Weighting in final valuation
}

export interface EBITDAMultipleValuation {
  method: 'EBITDA Multiple';
  
  industryMultiples: {
    low: number;
    median: number;
    high: number;
  };
  
  adjustments: ValuationAdjustment[];
  
  adjustedMultiples: {
    low: number;
    median: number;
    high: number;
  };
  
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  confidence: number;
  weight: number;
}

export interface DCFValuation {
  method: 'Discounted Cash Flow';
  
  // DCF assumptions
  projectionYears: number;
  discountRate: number; // WACC
  terminalGrowthRate: number;
  
  // Projected cash flows
  projectedCashFlows: ProjectedCashFlow[];
  
  // Terminal value
  terminalValue: number;
  presentValueOfTerminal: number;
  
  // Final DCF value
  presentValueOfCashFlows: number;
  enterpriseValue: number;
  equityValue: number;
  
  // Sensitivity ranges
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  confidence: number;
  weight: number;
}

export interface AssetBasedValuation {
  method: 'Asset-Based';
  
  // Asset categories
  tangibleAssets: number;
  intangibleAssets: number;
  
  // Adjustments
  assetAdjustments: AssetAdjustment[];
  
  // Adjusted book value
  adjustedBookValue: number;
  
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  confidence: number;
  weight: number;
}

export interface ComparableCompanyValuation {
  method: 'Comparable Company';
  
  // Comparable companies
  comparables: PublicComparable[];
  
  // Multiple analysis
  revenueMultiples: MultipleStatistics;
  ebitdaMultiples: MultipleStatistics;
  
  // Size and liquidity adjustments
  adjustments: ValuationAdjustment[];
  
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  confidence: number;
  weight: number;
}

export interface PrecedentTransactionValuation {
  method: 'Precedent Transaction';
  
  // Transaction comparables
  transactions: TransactionComparable[];
  
  // Multiple analysis
  revenueMultiples: MultipleStatistics;
  ebitdaMultiples: MultipleStatistics;
  
  // Control premium
  controlPremium: number;
  
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  confidence: number;
  weight: number;
}

export interface ValuationSummary {
  // Weighted average valuation
  weightedValuation: number;
  
  // Valuation range
  valuationRange: {
    low: number;
    median: number;
    high: number;
  };
  
  // Per share metrics (if applicable)
  perShareMetrics?: {
    sharesOutstanding: number;
    valuePerShare: number;
    priceRange: {
      low: number;
      median: number;
      high: number;
    };
  };
  
  // Valuation multiples summary
  impliedMultiples: {
    revenueMultiple: number;
    ebitdaMultiple: number;
    bookValueMultiple: number;
  };
  
  // Confidence indicators
  overallConfidence: number;
  methodCount: number;
  dataQuality: 'High' | 'Medium' | 'Low';
}

export interface SensitivityAnalysis {
  // Key variables
  variables: SensitivityVariable[];
  
  // Scenario analysis
  scenarios: ValuationScenario[];
  
  // Monte Carlo simulation results
  monteCarloResults?: MonteCarloResults;
}

export interface SensitivityVariable {
  variable: string;
  baseCase: number;
  range: {
    low: number;
    high: number;
  };
  impact: {
    lowCase: number;
    highCase: number;
  };
}

export interface ValuationScenario {
  scenario: 'Optimistic' | 'Base Case' | 'Pessimistic';
  assumptions: { [key: string]: number };
  valuation: number;
  probability: number;
}

export interface MonteCarloResults {
  iterations: number;
  meanValuation: number;
  standardDeviation: number;
  confidenceIntervals: {
    '90%': { low: number; high: number };
    '95%': { low: number; high: number };
  };
}

export interface ValuationRiskFactor {
  category: 'Market' | 'Financial' | 'Operational' | 'Regulatory' | 'Technology';
  factor: string;
  impact: 'High' | 'Medium' | 'Low';
  description: string;
  mitigation?: string;
  discountAdjustment?: number; // Percentage adjustment to valuation
}

export interface ValuationAdjustment {
  type: 'Size Premium/Discount' | 'Liquidity Discount' | 'Control Premium' | 'Key Person Discount' | 'Technology Premium' | 'Growth Premium' | 'Other';
  description: string;
  adjustment: number; // Percentage
  rationale: string;
}

export interface AssetAdjustment {
  asset: string;
  bookValue: number;
  marketValue: number;
  adjustment: number;
  reason: string;
}

export interface ProjectedCashFlow {
  year: number;
  revenue: number;
  ebitda: number;
  taxes: number;
  capitalExpenditure: number;
  workingCapitalChange: number;
  freeCashFlow: number;
  presentValue: number;
}

export interface MarketComparable {
  companyName: string;
  industry: string;
  marketCap: number;
  revenue: number;
  ebitda: number;
  revenueMultiple: number;
  ebitdaMultiple: number;
  similarity: number; // 0-100%
}

export interface PublicComparable {
  companyName: string;
  ticker: string;
  marketCap: number;
  revenue: number;
  ebitda: number;
  revenueMultiple: number;
  ebitdaMultiple: number;
  similarity: number;
}

export interface TransactionComparable {
  targetCompany: string;
  acquirer: string;
  transactionDate: Date;
  transactionValue: number;
  revenue: number;
  ebitda: number;
  revenueMultiple: number;
  ebitdaMultiple: number;
  similarity: number;
}

export interface MultipleStatistics {
  min: number;
  q1: number;
  median: number;
  q3: number;
  max: number;
  mean: number;
  standardDeviation: number;
}

export type IndustryType = 'SaaS' | 'Technology' | 'Manufacturing' | 'Retail' | 'Healthcare' | 'Financial Services' | 'Energy' | 'Real Estate' | 'Other';
export type BusinessModel = 'B2B SaaS' | 'B2C SaaS' | 'Marketplace' | 'E-commerce' | 'Manufacturing' | 'Services' | 'Hybrid' | 'Other';
export type MarketPosition = 'Market Leader' | 'Strong Competitor' | 'Niche Player' | 'Emerging' | 'Declining';

/**
 * Company Valuation Business Service Implementation
 */
export class CompanyValuationBusinessService {
  
  /**
   * Calculate comprehensive company valuation
   */
  static async calculateCompanyValuation(
    companyId: string,
    financialData: unknown,
    options: {
      methods?: string[];
      includeComparables?: boolean;
      includeSensitivity?: boolean;
    } = {}
  ): Promise<CompanyValuation> {
    
    // Get company data
    const company = await this.getCompanyData(companyId);
    
    // Prepare financial inputs
    const financialInputs = this.prepareFinancialInputs(financialData);
    
    // Calculate valuations using different methods
    const valuationMethods = await this.calculateValuationMethods(financialInputs, options);
    
    // Generate valuation summary
    const valuationSummary = this.generateValuationSummary(valuationMethods);
    
    // Get market comparables
    const comparables = options.includeComparables ? 
      await this.getMarketComparables(financialInputs) : [];
    
    // Perform sensitivity analysis
    const sensitivityAnalysis = options.includeSensitivity ?
      this.performSensitivityAnalysis(financialInputs, valuationMethods) : 
      { variables: [], scenarios: [] };
    
    // Identify risk factors
    const riskFactors = this.identifyRiskFactors(financialInputs);
    
    return {
      companyId,
      companyName: company.name,
      currency: company.currency,
      valuationDate: new Date(),
      financialInputs,
      valuationMethods,
      valuationSummary,
      comparables,
      sensitivityAnalysis,
      riskFactors,
      generatedAt: new Date()
    };
  }
  
  /**
   * Calculate valuations using different methods
   */
  private static async calculateValuationMethods(
    inputs: FinancialInputs,
    options: unknown
  ): Promise<ValuationMethods> {
    
    const methods: ValuationMethods = {
      revenueMultiple: this.calculateRevenueMultipleValuation(inputs),
      ebitdaMultiple: this.calculateEBITDAMultipleValuation(inputs),
      discountedCashFlow: this.calculateDCFValuation(inputs),
      assetBased: this.calculateAssetBasedValuation(inputs),
      comparableCompany: this.calculateComparableCompanyValuation(inputs),
      precedentTransaction: this.calculatePrecedentTransactionValuation(inputs)
    };
    
    return methods;
  }
  
  /**
   * Calculate revenue multiple valuation
   */
  private static calculateRevenueMultipleValuation(inputs: FinancialInputs): RevenueMultipleValuation {
    // Get industry multiples
    const industryMultiples = this.getIndustryRevenueMultiples(inputs.industryType, inputs.businessModel);
    
    // Calculate adjustments
    const adjustments: ValuationAdjustment[] = [];
    
    // Size adjustment
    if (inputs.annualRevenue < 10000000) { // Less than $10M
      adjustments.push({
        type: 'Size Premium/Discount',
        description: 'Small company size discount',
        adjustment: -15,
        rationale: 'Smaller companies typically trade at discount to larger peers'
      });
    }
    
    // Growth adjustment
    if (inputs.revenueGrowthRate > 30) {
      adjustments.push({
        type: 'Growth Premium',
        description: 'High growth premium',
        adjustment: 20,
        rationale: 'High growth rate justifies premium valuation'
      });
    } else if (inputs.revenueGrowthRate < 10) {
      adjustments.push({
        type: 'Growth Premium',
        description: 'Low growth discount',
        adjustment: -10,
        rationale: 'Below average growth rate'
      });
    }
    
    // Profitability adjustment
    if (inputs.grossMargin > 80) {
      adjustments.push({
        type: 'Technology Premium',
        description: 'High margin premium',
        adjustment: 15,
        rationale: 'Strong margin profile indicates scalable business model'
      });
    }
    
    // Apply adjustments
    const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
    const adjustmentMultiplier = 1 + (totalAdjustment / 100);
    
    const adjustedMultiples = {
      low: industryMultiples.low * adjustmentMultiplier,
      median: industryMultiples.median * adjustmentMultiplier,
      high: industryMultiples.high * adjustmentMultiplier
    };
    
    // Calculate valuation range
    const valuationRange = {
      low: inputs.annualRevenue * adjustedMultiples.low,
      median: inputs.annualRevenue * adjustedMultiples.median,
      high: inputs.annualRevenue * adjustedMultiples.high
    };
    
    return {
      method: 'Revenue Multiple',
      industryMultiples,
      adjustments,
      adjustedMultiples,
      valuationRange,
      confidence: 7, // Medium-high confidence for revenue multiples
      weight: inputs.industryType === 'SaaS' ? 0.3 : 0.2 // Higher weight for SaaS
    };
  }
  
  /**
   * Calculate EBITDA multiple valuation
   */
  private static calculateEBITDAMultipleValuation(inputs: FinancialInputs): EBITDAMultipleValuation {
    const industryMultiples = this.getIndustryEBITDAMultiples(inputs.industryType);
    
    const adjustments: ValuationAdjustment[] = [];
    
    // Quality of earnings adjustment
    if (inputs.ebitdaMargin > 25) {
      adjustments.push({
        type: 'Technology Premium',
        description: 'High EBITDA margin premium',
        adjustment: 10,
        rationale: 'Strong operational efficiency'
      });
    }
    
    // Apply adjustments
    const totalAdjustment = adjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
    const adjustmentMultiplier = 1 + (totalAdjustment / 100);
    
    const adjustedMultiples = {
      low: industryMultiples.low * adjustmentMultiplier,
      median: industryMultiples.median * adjustmentMultiplier,
      high: industryMultiples.high * adjustmentMultiplier
    };
    
    const valuationRange = {
      low: Math.max(0, inputs.ebitda * adjustedMultiples.low),
      median: Math.max(0, inputs.ebitda * adjustedMultiples.median),
      high: Math.max(0, inputs.ebitda * adjustedMultiples.high)
    };
    
    return {
      method: 'EBITDA Multiple',
      industryMultiples,
      adjustments,
      adjustedMultiples,
      valuationRange,
      confidence: inputs.ebitda > 0 ? 8 : 3, // High confidence if profitable
      weight: inputs.ebitda > 0 ? 0.25 : 0.05 // Low weight if unprofitable
    };
  }
  
  /**
   * Calculate DCF valuation
   */
  private static calculateDCFValuation(inputs: FinancialInputs): DCFValuation {
    const projectionYears = 5;
    const discountRate = this.calculateWACC(inputs);
    const terminalGrowthRate = Math.min(3, inputs.revenueGrowthRate * 0.3); // Conservative terminal growth
    
    // Project cash flows
    const projectedCashFlows: ProjectedCashFlow[] = [];
    const currentRevenue = inputs.annualRevenue;
    let currentEBITDA = inputs.ebitda;
    
    for (const year = 1; year <= projectionYears; year++) {
      // Declining growth rate over time
      const growthRate = inputs.revenueGrowthRate * Math.pow(0.85, year - 1);
      currentRevenue *= (1 + growthRate / 100);
      currentEBITDA = currentRevenue * (inputs.ebitdaMargin / 100);
      
      const taxes = currentEBITDA * 0.25; // Assume 25% tax rate
      const capex = currentRevenue * 0.03; // 3% of revenue
      const workingCapitalChange = (currentRevenue - inputs.annualRevenue) * 0.05; // 5% of revenue growth
      
      const freeCashFlow = currentEBITDA - taxes - capex - workingCapitalChange;
      const presentValue = freeCashFlow / Math.pow(1 + discountRate / 100, year);
      
      projectedCashFlows.push({
        year,
        revenue: currentRevenue,
        ebitda: currentEBITDA,
        taxes,
        capitalExpenditure: capex,
        workingCapitalChange,
        freeCashFlow,
        presentValue
      });
    }
    
    // Calculate terminal value
    const terminalCashFlow = projectedCashFlows[projectionYears - 1].freeCashFlow * (1 + terminalGrowthRate / 100);
    const terminalValue = terminalCashFlow / ((discountRate - terminalGrowthRate) / 100);
    const presentValueOfTerminal = terminalValue / Math.pow(1 + discountRate / 100, projectionYears);
    
    // Sum present values
    const presentValueOfCashFlows = projectedCashFlows.reduce((sum, cf) => sum + cf.presentValue, 0);
    const enterpriseValue = presentValueOfCashFlows + presentValueOfTerminal;
    const equityValue = enterpriseValue; // Simplified - would subtract net debt
    
    // Create valuation range based on discount rate sensitivity
    const valuationRange = {
      low: equityValue * 0.8, // 20% discount
      median: equityValue,
      high: equityValue * 1.2 // 20% premium
    };
    
    return {
      method: 'Discounted Cash Flow',
      projectionYears,
      discountRate,
      terminalGrowthRate,
      projectedCashFlows,
      terminalValue,
      presentValueOfTerminal,
      presentValueOfCashFlows,
      enterpriseValue,
      equityValue,
      valuationRange,
      confidence: 6, // Medium confidence - many assumptions
      weight: 0.2
    };
  }
  
  /**
   * Calculate asset-based valuation
   */
  private static calculateAssetBasedValuation(inputs: FinancialInputs): AssetBasedValuation {
    const tangibleAssets = inputs.totalAssets * 0.7; // Assume 70% tangible
    const intangibleAssets = inputs.totalAssets * 0.3; // Assume 30% intangible
    
    const assetAdjustments: AssetAdjustment[] = [
      {
        asset: 'Technology Assets',
        bookValue: intangibleAssets,
        marketValue: intangibleAssets * 1.2,
        adjustment: intangibleAssets * 0.2,
        reason: 'Technology assets may be undervalued on balance sheet'
      }
    ];
    
    const totalAdjustment = assetAdjustments.reduce((sum, adj) => sum + adj.adjustment, 0);
    const adjustedBookValue = inputs.shareholdersEquity + totalAdjustment;
    
    const valuationRange = {
      low: adjustedBookValue * 0.8,
      median: adjustedBookValue,
      high: adjustedBookValue * 1.2
    };
    
    return {
      method: 'Asset-Based',
      tangibleAssets,
      intangibleAssets,
      assetAdjustments,
      adjustedBookValue,
      valuationRange,
      confidence: 5, // Lower confidence for growth companies
      weight: inputs.industryType === 'Manufacturing' ? 0.2 : 0.1
    };
  }
  
  /**
   * Calculate comparable company valuation
   */
  private static calculateComparableCompanyValuation(inputs: FinancialInputs): ComparableCompanyValuation {
    // Mock comparable companies data
    const comparables: PublicComparable[] = this.getMockComparables(inputs.industryType);
    
    // Calculate multiple statistics
    const revenueMultiples = this.calculateMultipleStatistics(
      comparables.map(c => c.revenueMultiple)
    );
    
    const ebitdaMultiples = this.calculateMultipleStatistics(
      comparables.map(c => c.ebitdaMultiple).filter(m => m > 0)
    );
    
    // Apply discounts for private company
    const adjustments: ValuationAdjustment[] = [
      {
        type: 'Liquidity Discount',
        description: 'Private company liquidity discount',
        adjustment: -25,
        rationale: 'Private companies trade at discount to public comparables'
      }
    ];
    
    const adjustmentMultiplier = 0.75; // 25% discount
    
    const revenueValuation = inputs.annualRevenue * revenueMultiples.median * adjustmentMultiplier;
    const ebitdaValuation = inputs.ebitda > 0 ? inputs.ebitda * ebitdaMultiples.median * adjustmentMultiplier : 0;
    
    const valuationRange = {
      low: Math.min(revenueValuation * 0.8, ebitdaValuation * 0.8),
      median: (revenueValuation + ebitdaValuation) / 2,
      high: Math.max(revenueValuation * 1.2, ebitdaValuation * 1.2)
    };
    
    return {
      method: 'Comparable Company',
      comparables,
      revenueMultiples,
      ebitdaMultiples,
      adjustments,
      valuationRange,
      confidence: 7,
      weight: 0.15
    };
  }
  
  /**
   * Calculate precedent transaction valuation
   */
  private static calculatePrecedentTransactionValuation(inputs: FinancialInputs): PrecedentTransactionValuation {
    // Mock transaction data
    const transactions: TransactionComparable[] = this.getMockTransactions(inputs.industryType);
    
    const revenueMultiples = this.calculateMultipleStatistics(
      transactions.map(t => t.revenueMultiple)
    );
    
    const ebitdaMultiples = this.calculateMultipleStatistics(
      transactions.map(t => t.ebitdaMultiple).filter(m => m > 0)
    );
    
    const controlPremium = 25; // 25% control premium
    const premiumMultiplier = 1.25;
    
    const revenueValuation = inputs.annualRevenue * revenueMultiples.median * premiumMultiplier;
    const ebitdaValuation = inputs.ebitda > 0 ? inputs.ebitda * ebitdaMultiples.median * premiumMultiplier : 0;
    
    const valuationRange = {
      low: Math.min(revenueValuation * 0.8, ebitdaValuation * 0.8),
      median: (revenueValuation + ebitdaValuation) / 2,
      high: Math.max(revenueValuation * 1.2, ebitdaValuation * 1.2)
    };
    
    return {
      method: 'Precedent Transaction',
      transactions,
      revenueMultiples,
      ebitdaMultiples,
      controlPremium,
      valuationRange,
      confidence: 6,
      weight: 0.1
    };
  }
  
  /**
   * Generate valuation summary
   */
  private static generateValuationSummary(methods: ValuationMethods): ValuationSummary {
    const methodsArray = Object.values(methods);
    const totalWeight = methodsArray.reduce((sum, method) => sum + method.weight, 0);
    
    // Calculate weighted valuation
    const weightedValuation = methodsArray.reduce((sum, method) => {
      return sum + (method.valuationRange.median * method.weight);
    }, 0) / totalWeight;
    
    // Calculate overall range
    const allLows = methodsArray.map(m => m.valuationRange.low);
    const allHighs = methodsArray.map(m => m.valuationRange.high);
    
    const valuationRange = {
      low: Math.min(...allLows),
      median: weightedValuation,
      high: Math.max(...allHighs)
    };
    
    // Calculate implied multiples
    const impliedMultiples = {
      revenueMultiple: weightedValuation / methods.revenueMultiple.valuationRange.median * methods.revenueMultiple.adjustedMultiples.median,
      ebitdaMultiple: weightedValuation / methods.ebitdaMultiple.valuationRange.median * methods.ebitdaMultiple.adjustedMultiples.median,
      bookValueMultiple: weightedValuation / methods.assetBased.adjustedBookValue
    };
    
    // Calculate overall confidence
    const overallConfidence = methodsArray.reduce((sum, method) => {
      return sum + (method.confidence * method.weight);
    }, 0) / totalWeight;
    
    return {
      weightedValuation,
      valuationRange,
      impliedMultiples,
      overallConfidence,
      methodCount: methodsArray.length,
      dataQuality: overallConfidence >= 7 ? 'High' : overallConfidence >= 5 ? 'Medium' : 'Low'
    };
  }
  
  /**
   * Perform sensitivity analysis
   */
  private static performSensitivityAnalysis(
    inputs: FinancialInputs,
    methods: ValuationMethods
  ): SensitivityAnalysis {
    const variables: SensitivityVariable[] = [
      {
        variable: 'Revenue Growth Rate',
        baseCase: inputs.revenueGrowthRate,
        range: { low: inputs.revenueGrowthRate - 10, high: inputs.revenueGrowthRate + 10 },
        impact: { lowCase: -15, highCase: 20 } // Percentage impact on valuation
      },
      {
        variable: 'EBITDA Margin',
        baseCase: inputs.ebitdaMargin,
        range: { low: inputs.ebitdaMargin - 5, high: inputs.ebitdaMargin + 5 },
        impact: { lowCase: -12, highCase: 15 }
      },
      {
        variable: 'Revenue Multiple',
        baseCase: methods.revenueMultiple.adjustedMultiples.median,
        range: { 
          low: methods.revenueMultiple.adjustedMultiples.low, 
          high: methods.revenueMultiple.adjustedMultiples.high 
        },
        impact: { lowCase: -25, highCase: 30 }
      }
    ];
    
    const scenarios: ValuationScenario[] = [
      {
        scenario: 'Optimistic',
        assumptions: {
          'Revenue Growth': inputs.revenueGrowthRate + 10,
          'EBITDA Margin': inputs.ebitdaMargin + 5,
          'Multiple Premium': 20
        },
        valuation: methods.revenueMultiple.valuationRange.high,
        probability: 0.2
      },
      {
        scenario: 'Base Case',
        assumptions: {
          'Revenue Growth': inputs.revenueGrowthRate,
          'EBITDA Margin': inputs.ebitdaMargin,
          'Multiple Premium': 0
        },
        valuation: methods.revenueMultiple.valuationRange.median,
        probability: 0.6
      },
      {
        scenario: 'Pessimistic',
        assumptions: {
          'Revenue Growth': inputs.revenueGrowthRate - 10,
          'EBITDA Margin': inputs.ebitdaMargin - 5,
          'Multiple Discount': -20
        },
        valuation: methods.revenueMultiple.valuationRange.low,
        probability: 0.2
      }
    ];
    
    return {
      variables,
      scenarios
    };
  }
  
  /**
   * Identify risk factors
   */
  private static identifyRiskFactors(inputs: FinancialInputs): ValuationRiskFactor[] {
    const riskFactors: ValuationRiskFactor[] = [];
    
    // Financial risks
    if (inputs.ebitdaMargin < 10) {
      riskFactors.push({
        category: 'Financial',
        factor: 'Low Profitability',
        impact: 'High',
        description: 'Low EBITDA margin indicates potential profitability challenges',
        mitigation: 'Focus on cost optimization and pricing strategy',
        discountAdjustment: -15
      });
    }
    
    // Market risks
    if (inputs.revenueGrowthRate < 5) {
      riskFactors.push({
        category: 'Market',
        factor: 'Slow Growth',
        impact: 'Medium',
        description: 'Below-average growth rate may indicate market maturity or competitive pressure',
        mitigation: 'Explore new markets or product innovations'
      });
    }
    
    // Operational risks
    if (inputs.employeeCount && inputs.employeeCount < 50) {
      riskFactors.push({
        category: 'Operational',
        factor: 'Key Person Risk',
        impact: 'Medium',
        description: 'Small team size may create dependency on key individuals',
        mitigation: 'Develop succession planning and knowledge transfer processes'
      });
    }
    
    return riskFactors;
  }
  
  /**
   * Helper methods
   */
  private static prepareFinancialInputs(data: unknown): FinancialInputs {
    return {
      annualRevenue: data.revenue || 5000000,
      revenueGrowthRate: data.revenueGrowthRate || 25,
      grossProfit: data.grossProfit || data.revenue * 0.75,
      grossMargin: data.grossMargin || 75,
      ebitda: data.ebitda || data.revenue * 0.2,
      ebitdaMargin: data.ebitdaMargin || 20,
      netIncome: data.netIncome || data.revenue * 0.15,
      totalAssets: data.totalAssets || data.revenue * 1.5,
      totalLiabilities: data.totalLiabilities || data.revenue * 0.3,
      shareholdersEquity: data.shareholdersEquity || data.revenue * 1.2,
      operatingCashFlow: data.operatingCashFlow || data.revenue * 0.18,
      freeCashFlow: data.freeCashFlow || data.revenue * 0.15,
      industryType: data.industryType || 'SaaS',
      businessModel: data.businessModel || 'B2B SaaS',
      marketPosition: data.marketPosition || 'Strong Competitor',
      employeeCount: data.employeeCount || 100,
      customersCount: data.customersCount || 1000
    };
  }
  
  private static getIndustryRevenueMultiples(industry: IndustryType, model: BusinessModel) {
    const multiples: { [key: string]: { low: number; median: number; high: number } } = {
      'SaaS': { low: 4, median: 8, high: 15 },
      'Technology': { low: 2, median: 5, high: 10 },
      'Manufacturing': { low: 0.5, median: 1.5, high: 3 },
      'Retail': { low: 0.3, median: 1, high: 2 },
      'Healthcare': { low: 1, median: 3, high: 6 }
    };
    
    return multiples[industry] || multiples['Technology'];
  }
  
  private static getIndustryEBITDAMultiples(industry: IndustryType) {
    const multiples: { [key: string]: { low: number; median: number; high: number } } = {
      'SaaS': { low: 15, median: 25, high: 40 },
      'Technology': { low: 10, median: 18, high: 30 },
      'Manufacturing': { low: 5, median: 10, high: 15 },
      'Retail': { low: 4, median: 8, high: 12 },
      'Healthcare': { low: 8, median: 15, high: 25 }
    };
    
    return multiples[industry] || multiples['Technology'];
  }
  
  private static calculateWACC(inputs: FinancialInputs): number {
    // Simplified WACC calculation
    const riskFreeRate = 3; // 3% risk-free rate
    const marketRisk = 8; // 8% market risk premium
    const beta = inputs.industryType === 'SaaS' ? 1.3 : 1.0; // SaaS typically higher beta
    
    return riskFreeRate + (beta * marketRisk);
  }
  
  private static calculateMultipleStatistics(multiples: number[]): MultipleStatistics {
    const sorted = multiples.sort((a, b) => a - b);
    const n = sorted.length;
    
    return {
      min: sorted[0],
      q1: sorted[Math.floor(n * 0.25)],
      median: sorted[Math.floor(n * 0.5)],
      q3: sorted[Math.floor(n * 0.75)],
      max: sorted[n - 1],
      mean: sorted.reduce((sum, val) => sum + val, 0) / n,
      standardDeviation: Math.sqrt(
        sorted.reduce((sum, val) => sum + Math.pow(val - (sorted.reduce((s, v) => s + v, 0) / n), 2), 0) / n
      )
    };
  }
  
  private static getMockComparables(industry: IndustryType): PublicComparable[] {
    // Mock data - in production, would fetch from financial data provider
    return [
      {
        companyName: 'TechCorp Public',
        ticker: 'TECH',
        marketCap: 1000000000,
        revenue: 200000000,
        ebitda: 40000000,
        revenueMultiple: 5,
        ebitdaMultiple: 25,
        similarity: 85
      },
      {
        companyName: 'SaaS Leader Inc',
        ticker: 'SAAS',
        marketCap: 2000000000,
        revenue: 300000000,
        ebitda: 75000000,
        revenueMultiple: 6.7,
        ebitdaMultiple: 26.7,
        similarity: 90
      },
      {
        companyName: 'Digital Solutions',
        ticker: 'DIGI',
        marketCap: 500000000,
        revenue: 100000000,
        ebitda: 15000000,
        revenueMultiple: 5,
        ebitdaMultiple: 33.3,
        similarity: 75
      }
    ];
  }
  
  private static getMockTransactions(industry: IndustryType): TransactionComparable[] {
    return [
      {
        targetCompany: 'Acquired SaaS Co',
        acquirer: 'Big Tech Corp',
        transactionDate: new Date('2023-06-01'),
        transactionValue: 500000000,
        revenue: 80000000,
        ebitda: 16000000,
        revenueMultiple: 6.25,
        ebitdaMultiple: 31.25,
        similarity: 80
      },
      {
        targetCompany: 'Cloud Systems Ltd',
        acquirer: 'Enterprise Software Inc',
        transactionDate: new Date('2023-03-15'),
        transactionValue: 750000000,
        revenue: 120000000,
        ebitda: 30000000,
        revenueMultiple: 6.25,
        ebitdaMultiple: 25,
        similarity: 75
      }
    ];
  }
  
  private static async getCompanyData(companyId: string): Promise<{ name: string; currency: string }> {
    return {
      name: 'Example Company',
      currency: 'USD'
    };
  }
  
  private static async getMarketComparables(inputs: FinancialInputs): Promise<MarketComparable[]> {
    return this.getMockComparables(inputs.industryType).map(comp => ({
      companyName: comp.companyName,
      industry: inputs.industryType,
      marketCap: comp.marketCap,
      revenue: comp.revenue,
      ebitda: comp.ebitda,
      revenueMultiple: comp.revenueMultiple,
      ebitdaMultiple: comp.ebitdaMultiple,
      similarity: comp.similarity
    }));
  }
}