import { Company } from '@/types/companies.types';
import { BalanceSheetData, ProfitLossData, CashFlowData } from '@/types/financialStatements.types';

/**
 * Virtual Holding Business Service
 * 
 * Provides functionality for grouping companies into virtual holding structures
 * and generating consolidated financial views without legal consolidation.
 * 
 * Features:
 * - Company grouping and hierarchy management
 * - Multi-currency aggregation with real-time conversion
 * - Consolidated financial statement generation
 * - Performance analytics across company groups
 * - Risk assessment and diversification analysis
 */

export interface VirtualHolding {
  id: string;
  name: string;
  description?: string;
  companies: VirtualHoldingCompany[];
  baseCurrency: string;
  created: Date;
  lastUpdated: Date;
  tags?: string[];
}

export interface VirtualHoldingCompany {
  companyId: string;
  companyName: string;
  weight?: number; // Ownership percentage or weighting factor
  currency: string;
  includedInConsolidation: boolean;
  segment?: string; // Business segment classification
  region?: string;
  lastSyncDate?: Date;
}

export interface ConsolidatedFinancials {
  holding: VirtualHolding;
  period: string;
  baseCurrency: string;
  exchangeRates: { [currency: string]: number };
  
  // Aggregated financial data
  totalRevenue: CurrencyAmount;
  totalExpenses: CurrencyAmount;
  netProfit: CurrencyAmount;
  totalAssets: CurrencyAmount;
  totalLiabilities: CurrencyAmount;
  totalEquity: CurrencyAmount;
  operatingCashFlow: CurrencyAmount;
  
  // Company-level breakdown
  companyBreakdown: CompanyFinancialSummary[];
  
  // Performance metrics
  metrics: HoldingPerformanceMetrics;
  
  // Risk indicators
  riskAssessment: HoldingRiskAssessment;
  
  generatedAt: Date;
}

export interface CurrencyAmount {
  amount: number;
  currency: string;
  originalAmounts: { [companyId: string]: { amount: number; currency: string } };
  formattedAmount: string;
}

export interface CompanyFinancialSummary {
  companyId: string;
  companyName: string;
  currency: string;
  weight: number;
  
  revenue: { amount: number; converted: number; percentage: number };
  netProfit: { amount: number; converted: number; percentage: number };
  assets: { amount: number; converted: number; percentage: number };
  equity: { amount: number; converted: number; percentage: number };
  
  // Performance indicators
  revenueGrowth?: number;
  profitMargin: number;
  roa: number; // Return on Assets
  roe: number; // Return on Equity
  
  segment?: string;
  region?: string;
}

export interface HoldingPerformanceMetrics {
  // Profitability
  overallProfitMargin: number;
  weightedAverageROA: number;
  weightedAverageROE: number;
  
  // Growth metrics
  revenueGrowthRate?: number;
  profitGrowthRate?: number;
  
  // Efficiency
  assetTurnover: number;
  operatingEfficiency: number;
  
  // Composition metrics
  revenueConcentration: number; // Herfindahl index for revenue concentration
  geographicDiversification: number;
  segmentDiversification: number;
}

export interface HoldingRiskAssessment {
  overallRiskScore: number; // 1-10 scale
  
  // Risk factors
  currencyExposure: { [currency: string]: number };
  geographicConcentration: number;
  sectorConcentration: number;
  sizeConcentration: number; // Based on revenue/assets
  
  // Risk indicators
  riskFactors: RiskFactor[];
  recommendations: string[];
}

export interface RiskFactor {
  type: 'Currency' | 'Geographic' | 'Sector' | 'Size' | 'Performance';
  severity: 'Low' | 'Medium' | 'High';
  description: string;
  impact: string;
  mitigation?: string;
}

export interface HoldingAnalytics {
  holding: VirtualHolding;
  timeRange: { start: Date; end: Date };
  
  // Trend analysis
  revenueTrend: TrendData[];
  profitTrend: TrendData[];
  assetTrend: TrendData[];
  
  // Comparative analysis
  topPerformers: CompanyRanking[];
  underperformers: CompanyRanking[];
  
  // Benchmarking
  benchmarks?: {
    industryAverages?: { [metric: string]: number };
    peerComparison?: { [metric: string]: number };
  };
}

export interface TrendData {
  period: string;
  value: number;
  currency: string;
  companyBreakdown: { [companyId: string]: number };
}

export interface CompanyRanking {
  companyId: string;
  companyName: string;
  metric: string;
  value: number;
  rank: number;
  trend: 'up' | 'down' | 'stable';
}

/**
 * Virtual Holding Business Service Implementation
 */
export class VirtualHoldingBusinessService {
  
  /**
   * Create a new virtual holding structure
   */
  static async createVirtualHolding(
    name: string,
    description: string,
    baseCurrency: string,
    initialCompanies: string[] = []
  ): Promise<VirtualHolding> {
    const holding: VirtualHolding = {
      id: `vh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      companies: [],
      baseCurrency,
      created: new Date(),
      lastUpdated: new Date(),
      tags: []
    };
    
    // Add initial companies if provided
    for (const companyId of initialCompanies) {
      await this.addCompanyToHolding(holding.id, companyId);
    }
    
    return holding;
  }
  
  /**
   * Add a company to a virtual holding
   */
  static async addCompanyToHolding(
    holdingId: string,
    companyId: string,
    weight: number = 100,
    segment?: string,
    region?: string
  ): Promise<void> {
    // In a real implementation, this would:
    // 1. Validate the company exists
    // 2. Check if company is already in another holding
    // 3. Update the holding structure
    // 4. Trigger recalculation of consolidated financials
    
    console.log(`Adding company ${companyId} to holding ${holdingId} with weight ${weight}%`);
  }
  
  /**
   * Generate consolidated financials for a virtual holding
   */
  static async generateConsolidatedFinancials(
    holding: VirtualHolding,
    period: string,
    includeComparatives: boolean = false
  ): Promise<ConsolidatedFinancials> {
    
    // Get exchange rates for the period
    const exchangeRates = await this.getExchangeRates(holding.baseCurrency, period);
    
    // Initialize consolidated amounts
    let totalRevenue = 0;
    let totalExpenses = 0;
    let totalAssets = 0;
    let totalLiabilities = 0;
    let operatingCashFlow = 0;
    
    const companyBreakdown: CompanyFinancialSummary[] = [];
    const originalAmounts: { [key: string]: { [companyId: string]: { amount: number; currency: string } } } = {
      revenue: {},
      expenses: {},
      assets: {},
      liabilities: {},
      cashFlow: {}
    };
    
    // Process each company in the holding
    for (const holdingCompany of holding.companies) {
      if (!holdingCompany.includedInConsolidation) continue;
      
      // Get company financial data (mock data for demo)
      const financials = await this.getCompanyFinancials(holdingCompany.companyId, period);
      const conversionRate = exchangeRates[holdingCompany.currency] || 1;
      const weightingFactor = (holdingCompany.weight || 100) / 100;
      
      // Convert and weight the amounts
      const convertedRevenue = financials.revenue * conversionRate * weightingFactor;
      const convertedExpenses = financials.expenses * conversionRate * weightingFactor;
      const convertedAssets = financials.assets * conversionRate * weightingFactor;
      const convertedLiabilities = financials.liabilities * conversionRate * weightingFactor;
      const convertedCashFlow = financials.operatingCashFlow * conversionRate * weightingFactor;
      const convertedNetProfit = convertedRevenue - convertedExpenses;
      
      // Aggregate totals
      totalRevenue += convertedRevenue;
      totalExpenses += convertedExpenses;
      totalAssets += convertedAssets;
      totalLiabilities += convertedLiabilities;
      operatingCashFlow += convertedCashFlow;
      
      // Store original amounts for breakdown
      originalAmounts.revenue[holdingCompany.companyId] = { 
        amount: financials.revenue, 
        currency: holdingCompany.currency 
      };
      originalAmounts.expenses[holdingCompany.companyId] = { 
        amount: financials.expenses, 
        currency: holdingCompany.currency 
      };
      originalAmounts.assets[holdingCompany.companyId] = { 
        amount: financials.assets, 
        currency: holdingCompany.currency 
      };
      originalAmounts.liabilities[holdingCompany.companyId] = { 
        amount: financials.liabilities, 
        currency: holdingCompany.currency 
      };
      originalAmounts.cashFlow[holdingCompany.companyId] = { 
        amount: financials.operatingCashFlow, 
        currency: holdingCompany.currency 
      };
      
      // Create company summary
      const companySummary: CompanyFinancialSummary = {
        companyId: holdingCompany.companyId,
        companyName: holdingCompany.companyName,
        currency: holdingCompany.currency,
        weight: holdingCompany.weight || 100,
        
        revenue: {
          amount: financials.revenue,
          converted: convertedRevenue,
          percentage: 0 // Will be calculated after totals
        },
        netProfit: {
          amount: financials.revenue - financials.expenses,
          converted: convertedNetProfit,
          percentage: 0
        },
        assets: {
          amount: financials.assets,
          converted: convertedAssets,
          percentage: 0
        },
        equity: {
          amount: financials.assets - financials.liabilities,
          converted: convertedAssets - convertedLiabilities,
          percentage: 0
        },
        
        profitMargin: ((financials.revenue - financials.expenses) / financials.revenue) * 100,
        roa: ((financials.revenue - financials.expenses) / financials.assets) * 100,
        roe: ((financials.revenue - financials.expenses) / (financials.assets - financials.liabilities)) * 100,
        
        segment: holdingCompany.segment,
        region: holdingCompany.region
      };
      
      companyBreakdown.push(companySummary);
    }
    
    // Calculate percentages after totals are known
    companyBreakdown.forEach(company => {
      company.revenue.percentage = (company.revenue.converted / totalRevenue) * 100;
      company.netProfit.percentage = (company.netProfit.converted / (totalRevenue - totalExpenses)) * 100;
      company.assets.percentage = (company.assets.converted / totalAssets) * 100;
      company.equity.percentage = (company.equity.converted / (totalAssets - totalLiabilities)) * 100;
    });
    
    const totalEquity = totalAssets - totalLiabilities;
    const netProfit = totalRevenue - totalExpenses;
    
    // Generate performance metrics
    const metrics = this.calculateHoldingMetrics(companyBreakdown, totalRevenue, totalAssets, totalEquity, netProfit);
    
    // Generate risk assessment
    const riskAssessment = this.assessHoldingRisk(holding, companyBreakdown, exchangeRates);
    
    return {
      holding,
      period,
      baseCurrency: holding.baseCurrency,
      exchangeRates,
      
      totalRevenue: {
        amount: totalRevenue,
        currency: holding.baseCurrency,
        originalAmounts: originalAmounts.revenue,
        formattedAmount: this.formatCurrency(totalRevenue, holding.baseCurrency)
      },
      totalExpenses: {
        amount: totalExpenses,
        currency: holding.baseCurrency,
        originalAmounts: originalAmounts.expenses,
        formattedAmount: this.formatCurrency(totalExpenses, holding.baseCurrency)
      },
      netProfit: {
        amount: netProfit,
        currency: holding.baseCurrency,
        originalAmounts: {},
        formattedAmount: this.formatCurrency(netProfit, holding.baseCurrency)
      },
      totalAssets: {
        amount: totalAssets,
        currency: holding.baseCurrency,
        originalAmounts: originalAmounts.assets,
        formattedAmount: this.formatCurrency(totalAssets, holding.baseCurrency)
      },
      totalLiabilities: {
        amount: totalLiabilities,
        currency: holding.baseCurrency,
        originalAmounts: originalAmounts.liabilities,
        formattedAmount: this.formatCurrency(totalLiabilities, holding.baseCurrency)
      },
      totalEquity: {
        amount: totalEquity,
        currency: holding.baseCurrency,
        originalAmounts: {},
        formattedAmount: this.formatCurrency(totalEquity, holding.baseCurrency)
      },
      operatingCashFlow: {
        amount: operatingCashFlow,
        currency: holding.baseCurrency,
        originalAmounts: originalAmounts.cashFlow,
        formattedAmount: this.formatCurrency(operatingCashFlow, holding.baseCurrency)
      },
      
      companyBreakdown,
      metrics,
      riskAssessment,
      generatedAt: new Date()
    };
  }
  
  /**
   * Get exchange rates for currency conversion
   */
  private static async getExchangeRates(baseCurrency: string, period: string): Promise<{ [currency: string]: number }> {
    // In a real implementation, this would fetch real exchange rates
    // For demo purposes, return mock rates
    return {
      USD: baseCurrency === 'USD' ? 1 : 0.85,
      EUR: baseCurrency === 'EUR' ? 1 : 1.18,
      GBP: baseCurrency === 'GBP' ? 1 : 1.38,
      JPY: baseCurrency === 'JPY' ? 1 : 0.0091,
      CAD: baseCurrency === 'CAD' ? 1 : 0.79,
      AUD: baseCurrency === 'AUD' ? 1 : 0.75
    };
  }
  
  /**
   * Get company financial data for a specific period
   */
  private static async getCompanyFinancials(companyId: string, period: string): Promise<{
    revenue: number;
    expenses: number;
    assets: number;
    liabilities: number;
    operatingCashFlow: number;
  }> {
    // In a real implementation, this would fetch actual financial data
    // For demo purposes, return mock data with some variation
    const baseRevenue = 1000000 + Math.random() * 2000000;
    const profitMargin = 0.1 + Math.random() * 0.2; // 10-30% profit margin
    
    return {
      revenue: baseRevenue,
      expenses: baseRevenue * (1 - profitMargin),
      assets: baseRevenue * (1.5 + Math.random()),
      liabilities: baseRevenue * (0.3 + Math.random() * 0.4),
      operatingCashFlow: baseRevenue * (0.05 + Math.random() * 0.15)
    };
  }
  
  /**
   * Calculate holding-level performance metrics
   */
  private static calculateHoldingMetrics(
    companies: CompanyFinancialSummary[],
    totalRevenue: number,
    totalAssets: number,
    totalEquity: number,
    netProfit: number
  ): HoldingPerformanceMetrics {
    
    // Calculate weighted averages
    let weightedROA = 0;
    let weightedROE = 0;
    let totalWeight = 0;
    
    companies.forEach(company => {
      const weight = company.weight / 100;
      weightedROA += company.roa * weight;
      weightedROE += company.roe * weight;
      totalWeight += weight;
    });
    
    if (totalWeight > 0) {
      weightedROA /= totalWeight;
      weightedROE /= totalWeight;
    }
    
    // Calculate concentration metrics (Herfindahl index)
    const revenueConcentration = companies.reduce((sum, company) => {
      const share = company.revenue.percentage / 100;
      return sum + (share * share);
    }, 0);
    
    // Geographic and segment diversification
    const regions = [...new Set(companies.map(c => c.region).filter(Boolean))];
    const segments = [...new Set(companies.map(c => c.segment).filter(Boolean))];
    
    return {
      overallProfitMargin: (netProfit / totalRevenue) * 100,
      weightedAverageROA: weightedROA,
      weightedAverageROE: weightedROE,
      assetTurnover: totalRevenue / totalAssets,
      operatingEfficiency: netProfit / totalRevenue,
      revenueConcentration,
      geographicDiversification: regions.length,
      segmentDiversification: segments.length
    };
  }
  
  /**
   * Assess risk factors for the holding
   */
  private static assessHoldingRisk(
    holding: VirtualHolding,
    companies: CompanyFinancialSummary[],
    exchangeRates: { [currency: string]: number }
  ): HoldingRiskAssessment {
    
    const riskFactors: RiskFactor[] = [];
    
    // Currency exposure analysis
    const currencyExposure: { [currency: string]: number } = {};
    companies.forEach(company => {
      if (!currencyExposure[company.currency]) {
        currencyExposure[company.currency] = 0;
      }
      currencyExposure[company.currency] += company.revenue.percentage;
    });
    
    // Check for high currency concentration
    Object.entries(currencyExposure).forEach(([currency, exposure]) => {
      if (exposure > 60 && currency !== holding.baseCurrency) {
        riskFactors.push({
          type: 'Currency',
          severity: 'High',
          description: `High exposure to ${currency}`,
          impact: `${exposure.toFixed(1)}% of revenue is in ${currency}`,
          mitigation: 'Consider currency hedging strategies'
        });
      }
    });
    
    // Geographic concentration
    const regions = [...new Set(companies.map(c => c.region).filter(Boolean))];
    if (regions.length < 3) {
      riskFactors.push({
        type: 'Geographic',
        severity: 'Medium',
        description: 'Limited geographic diversification',
        impact: `Operations concentrated in ${regions.length} region(s)`,
        mitigation: 'Consider expansion into new markets'
      });
    }
    
    // Size concentration (80/20 rule)
    const sortedByRevenue = companies.sort((a, b) => b.revenue.percentage - a.revenue.percentage);
    const top20PercentRevenue = sortedByRevenue.slice(0, Math.ceil(companies.length * 0.2))
      .reduce((sum, company) => sum + company.revenue.percentage, 0);
    
    if (top20PercentRevenue > 80) {
      riskFactors.push({
        type: 'Size',
        severity: 'High',
        description: 'Revenue concentration risk',
        impact: `Top 20% of companies generate ${top20PercentRevenue.toFixed(1)}% of revenue`,
        mitigation: 'Diversify revenue sources or improve smaller companies'
      });
    }
    
    // Performance risk (companies with negative margins)
    const underperformingCompanies = companies.filter(c => c.profitMargin < 0);
    if (underperformingCompanies.length > 0) {
      riskFactors.push({
        type: 'Performance',
        severity: underperformingCompanies.length > companies.length * 0.3 ? 'High' : 'Medium',
        description: 'Underperforming companies',
        impact: `${underperformingCompanies.length} companies have negative profit margins`,
        mitigation: 'Review operations and implement turnaround strategies'
      });
    }
    
    // Calculate overall risk score (1-10)
    let riskScore = 1;
    riskFactors.forEach(factor => {
      switch (factor.severity) {
        case 'High': riskScore += 2; break;
        case 'Medium': riskScore += 1; break;
        case 'Low': riskScore += 0.5; break;
      }
    });
    riskScore = Math.min(10, riskScore);
    
    return {
      overallRiskScore: riskScore,
      currencyExposure,
      geographicConcentration: regions.length,
      sectorConcentration: [...new Set(companies.map(c => c.segment).filter(Boolean))].length,
      sizeConcentration: top20PercentRevenue,
      riskFactors,
      recommendations: this.generateRiskRecommendations(riskFactors)
    };
  }
  
  /**
   * Generate risk mitigation recommendations
   */
  private static generateRiskRecommendations(riskFactors: RiskFactor[]): string[] {
    const recommendations: string[] = [];
    
    if (riskFactors.some(r => r.type === 'Currency' && r.severity === 'High')) {
      recommendations.push('Implement currency hedging strategies to reduce foreign exchange risk');
    }
    
    if (riskFactors.some(r => r.type === 'Geographic')) {
      recommendations.push('Consider geographic expansion to reduce market concentration risk');
    }
    
    if (riskFactors.some(r => r.type === 'Size')) {
      recommendations.push('Develop smaller companies or diversify revenue streams to reduce concentration');
    }
    
    if (riskFactors.some(r => r.type === 'Performance')) {
      recommendations.push('Focus on operational improvements for underperforming companies');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Continue monitoring risk factors and maintaining diversification');
    }
    
    return recommendations;
  }
  
  /**
   * Format currency amounts
   */
  private static formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
  
  /**
   * Generate trend analytics for a holding
   */
  static async generateHoldingAnalytics(
    holding: VirtualHolding,
    startDate: Date,
    endDate: Date
  ): Promise<HoldingAnalytics> {
    
    // Generate mock trend data
    const periods = this.generatePeriods(startDate, endDate);
    const revenueTrend: TrendData[] = [];
    const profitTrend: TrendData[] = [];
    const assetTrend: TrendData[] = [];
    
    for (const period of periods) {
      // In real implementation, fetch actual data for each period
      const mockRevenue = 5000000 + Math.random() * 2000000;
      const mockProfit = mockRevenue * (0.1 + Math.random() * 0.1);
      const mockAssets = mockRevenue * (1.2 + Math.random() * 0.5);
      
      revenueTrend.push({
        period,
        value: mockRevenue,
        currency: holding.baseCurrency,
        companyBreakdown: {} // Would contain company-level data
      });
      
      profitTrend.push({
        period,
        value: mockProfit,
        currency: holding.baseCurrency,
        companyBreakdown: {}
      });
      
      assetTrend.push({
        period,
        value: mockAssets,
        currency: holding.baseCurrency,
        companyBreakdown: {}
      });
    }
    
    // Generate top/bottom performers
    const topPerformers: CompanyRanking[] = holding.companies.slice(0, 3).map((company, index) => ({
      companyId: company.companyId,
      companyName: company.companyName,
      metric: 'ROE',
      value: 15 + Math.random() * 10,
      rank: index + 1,
      trend: 'up'
    }));
    
    const underperformers: CompanyRanking[] = holding.companies.slice(-2).map((company, index) => ({
      companyId: company.companyId,
      companyName: company.companyName,
      metric: 'ROE',
      value: -5 + Math.random() * 10,
      rank: holding.companies.length - index,
      trend: 'down'
    }));
    
    return {
      holding,
      timeRange: { start: startDate, end: endDate },
      revenueTrend,
      profitTrend,
      assetTrend,
      topPerformers,
      underperformers
    };
  }
  
  /**
   * Generate period labels for trend analysis
   */
  private static generatePeriods(startDate: Date, endDate: Date): string[] {
    const periods: string[] = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      periods.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
      current.setMonth(current.getMonth() + 1);
    }
    
    return periods;
  }
}