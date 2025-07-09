/**
 * SaaS Metrics Business Service
 * 
 * Comprehensive service for calculating and analyzing SaaS business metrics
 * including ARR, MRR, churn, cohort analysis, and growth metrics.
 * 
 * Key Metrics:
 * - Annual Recurring Revenue (ARR) and Monthly Recurring Revenue (MRR)
 * - Customer churn rates and revenue churn
 * - Customer Acquisition Cost (CAC) and Lifetime Value (LTV)
 * - Net Revenue Retention (NRR) and Gross Revenue Retention (GRR)
 * - Unit economics and cohort analysis
 */

export interface SaaSMetricsData {
  companyId: string;
  companyName: string;
  currency: string;
  period: string;
  
  // Core Revenue Metrics
  arr: ARRMetrics;
  mrr: MRRMetrics;
  
  // Customer Metrics
  customers: CustomerMetrics;
  
  // Churn and Retention
  churn: ChurnMetrics;
  retention: RetentionMetrics;
  
  // Growth Metrics
  growth: GrowthMetrics;
  
  // Unit Economics
  unitEconomics: UnitEconomics;
  
  // Cohort Analysis
  cohorts: CohortAnalysis[];
  
  // Subscription Tiers
  subscriptionTiers: SubscriptionTierMetrics[];
  
  generatedAt: Date;
}

export interface ARRMetrics {
  current: number;
  previous: number;
  growth: number;
  growthPercent: number;
  
  // ARR Breakdown
  newArr: number;
  expansionArr: number;
  contractionArr: number;
  churnedArr: number;
  netNewArr: number;
  
  // Formatted values
  currentFormatted: string;
  previousFormatted: string;
  netNewArrFormatted: string;
}

export interface MRRMetrics {
  current: number;
  previous: number;
  growth: number;
  growthPercent: number;
  
  // MRR Movement
  newMrr: number;
  expansionMrr: number;
  contractionMrr: number;
  churnedMrr: number;
  netNewMrr: number;
  
  // MRR by source
  mrrBySource: { [source: string]: number };
  
  // Formatted values
  currentFormatted: string;
  previousFormatted: string;
  netNewMrrFormatted: string;
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  netNewCustomers: number;
  
  // Customer segments
  customersByTier: { [tier: string]: number };
  customersByRegion: { [region: string]: number };
  
  // Average metrics
  averageRevenuePerUser: number;
  averageRevenuePerAccount: number;
  
  // Customer concentration
  topCustomerPercent: number; // Top 10 customers as % of ARR
  customerConcentrationRisk: 'Low' | 'Medium' | 'High';
}

export interface ChurnMetrics {
  // Customer churn
  customerChurnRate: number;
  customerChurnCount: number;
  
  // Revenue churn
  revenueChurnRate: number;
  revenueChurnAmount: number;
  
  // Churn reasons
  churnReasons: ChurnReason[];
  
  // Monthly churn trend
  monthlyChurnTrend: MonthlyMetric[];
}

export interface RetentionMetrics {
  // Net Revenue Retention
  netRevenueRetention: number;
  
  // Gross Revenue Retention
  grossRevenueRetention: number;
  
  // Logo retention
  logoRetention: number;
  
  // Cohort retention
  cohortRetention: CohortRetention[];
}

export interface GrowthMetrics {
  // Growth rates
  arrGrowthRate: number;
  mrrGrowthRate: number;
  customerGrowthRate: number;
  
  // Growth efficiency
  growthEfficiencyRatio: number; // Net New ARR / Sales & Marketing spend
  
  // Rule of 40
  ruleOf40Score: number; // Growth Rate + Profit Margin
  
  // Quick Ratio
  quickRatio: number; // (New MRR + Expansion MRR) / (Churned MRR + Contraction MRR)
  
  // Monthly trends
  arrTrend: MonthlyMetric[];
  mrrTrend: MonthlyMetric[];
  customerTrend: MonthlyMetric[];
}

export interface UnitEconomics {
  // Customer Acquisition Cost
  customerAcquisitionCost: number;
  
  // Customer Lifetime Value
  customerLifetimeValue: number;
  
  // LTV:CAC Ratio
  ltvToCacRatio: number;
  
  // Payback Period (months)
  paybackPeriod: number;
  
  // Gross margin
  grossMargin: number;
  grossMarginPercent: number;
  
  // Average contract value
  averageContractValue: number;
  averageContractLength: number; // in months
}

export interface CohortAnalysis {
  cohortMonth: string;
  customersStarted: number;
  revenueStarted: number;
  
  // Retention by month
  retentionByMonth: { [month: number]: CohortMonth };
}

export interface CohortMonth {
  month: number;
  customersRemaining: number;
  revenueRemaining: number;
  retentionRate: number;
  revenueRetentionRate: number;
}

export interface SubscriptionTierMetrics {
  tierName: string;
  tierPrice: number;
  
  // Customer metrics
  customers: number;
  newCustomers: number;
  churnedCustomers: number;
  
  // Revenue metrics
  mrr: number;
  arr: number;
  churnRate: number;
  
  // Conversion metrics
  upgradeRate?: number;
  downgradeRate?: number;
}

export interface ChurnReason {
  reason: string;
  count: number;
  percentage: number;
  impact: number; // ARR impact
}

export interface CohortRetention {
  period: string;
  customersStarted: number;
  month1: number;
  month3: number;
  month6: number;
  month12: number;
}

export interface MonthlyMetric {
  month: string;
  value: number;
  growth: number;
  growthPercent: number;
}

export interface SaaSBenchmarks {
  industry: string;
  
  // Benchmark ranges
  arrGrowthRate: { good: number; great: number };
  churnRate: { good: number; great: number };
  netRevenueRetention: { good: number; great: number };
  ltvToCacRatio: { good: number; great: number };
  grossMargin: { good: number; great: number };
  
  // Rule of 40
  ruleOf40: { good: number; great: number };
}

/**
 * SaaS Metrics Business Service Implementation
 */
export class SaaSMetricsBusinessService {
  
  /**
   * Calculate comprehensive SaaS metrics for a company
   */
  static async calculateSaaSMetrics(
    companyId: string,
    period: string,
    includeCohorts: boolean = true
  ): Promise<SaaSMetricsData> {
    
    // Get company data
    const company = await this.getCompanyData(companyId);
    
    // Get subscription data for the period
    const subscriptionData = await this.getSubscriptionData(companyId, period);
    
    // Calculate core metrics
    const arr = this.calculateARRMetrics(subscriptionData);
    const mrr = this.calculateMRRMetrics(subscriptionData);
    const customers = this.calculateCustomerMetrics(subscriptionData);
    const churn = this.calculateChurnMetrics(subscriptionData);
    const retention = this.calculateRetentionMetrics(subscriptionData);
    const growth = this.calculateGrowthMetrics(subscriptionData);
    const unitEconomics = this.calculateUnitEconomics(subscriptionData);
    const subscriptionTiers = this.calculateSubscriptionTierMetrics(subscriptionData);
    
    // Calculate cohort analysis if requested
    const cohorts = includeCohorts ? 
      await this.calculateCohortAnalysis(companyId, period) : [];
    
    return {
      companyId,
      companyName: company.name,
      currency: company.currency,
      period,
      arr,
      mrr,
      customers,
      churn,
      retention,
      growth,
      unitEconomics,
      cohorts,
      subscriptionTiers,
      generatedAt: new Date()
    };
  }
  
  /**
   * Calculate ARR metrics
   */
  private static calculateARRMetrics(data: unknown): ARRMetrics {
    // Mock calculation - in real implementation, calculate from actual subscription data
    const currentArr = 2400000 + Math.random() * 600000; // $2.4M - $3M
    const previousArr = currentArr * (0.85 + Math.random() * 0.1); // 85-95% of current
    const growth = currentArr - previousArr;
    const growthPercent = (growth / previousArr) * 100;
    
    // ARR movements (mock data)
    const newArr = currentArr * (0.15 + Math.random() * 0.1); // 15-25% new ARR
    const expansionArr = currentArr * (0.05 + Math.random() * 0.05); // 5-10% expansion
    const contractionArr = currentArr * (0.02 + Math.random() * 0.03); // 2-5% contraction
    const churnedArr = currentArr * (0.03 + Math.random() * 0.02); // 3-5% churned
    const netNewArr = newArr + expansionArr - contractionArr - churnedArr;
    
    return {
      current: currentArr,
      previous: previousArr,
      growth,
      growthPercent,
      newArr,
      expansionArr,
      contractionArr,
      churnedArr,
      netNewArr,
      currentFormatted: this.formatCurrency(currentArr),
      previousFormatted: this.formatCurrency(previousArr),
      netNewArrFormatted: this.formatCurrency(netNewArr)
    };
  }
  
  /**
   * Calculate MRR metrics
   */
  private static calculateMRRMetrics(data: unknown): MRRMetrics {
    const currentMrr = 200000 + Math.random() * 50000; // $200K - $250K
    const previousMrr = currentMrr * (0.9 + Math.random() * 0.05); // 90-95% of current
    const growth = currentMrr - previousMrr;
    const growthPercent = (growth / previousMrr) * 100;
    
    // MRR movements
    const newMrr = currentMrr * (0.15 + Math.random() * 0.1);
    const expansionMrr = currentMrr * (0.05 + Math.random() * 0.05);
    const contractionMrr = currentMrr * (0.02 + Math.random() * 0.03);
    const churnedMrr = currentMrr * (0.03 + Math.random() * 0.02);
    const netNewMrr = newMrr + expansionMrr - contractionMrr - churnedMrr;
    
    // MRR by source (mock data)
    const mrrBySource = {
      'Direct Sales': currentMrr * 0.4,
      'Inbound Marketing': currentMrr * 0.3,
      'Partner Channel': currentMrr * 0.2,
      'Referrals': currentMrr * 0.1
    };
    
    return {
      current: currentMrr,
      previous: previousMrr,
      growth,
      growthPercent,
      newMrr,
      expansionMrr,
      contractionMrr,
      churnedMrr,
      netNewMrr,
      mrrBySource,
      currentFormatted: this.formatCurrency(currentMrr),
      previousFormatted: this.formatCurrency(previousMrr),
      netNewMrrFormatted: this.formatCurrency(netNewMrr)
    };
  }
  
  /**
   * Calculate customer metrics
   */
  private static calculateCustomerMetrics(data: unknown): CustomerMetrics {
    const totalCustomers = 1200 + Math.floor(Math.random() * 300); // 1200-1500 customers
    const newCustomers = Math.floor(totalCustomers * (0.05 + Math.random() * 0.03)); // 5-8% new
    const churnedCustomers = Math.floor(totalCustomers * (0.02 + Math.random() * 0.02)); // 2-4% churned
    const netNewCustomers = newCustomers - churnedCustomers;
    
    // Customer segmentation (mock data)
    const customersByTier = {
      'Enterprise': Math.floor(totalCustomers * 0.1),
      'Professional': Math.floor(totalCustomers * 0.3),
      'Standard': Math.floor(totalCustomers * 0.4),
      'Starter': Math.floor(totalCustomers * 0.2)
    };
    
    const customersByRegion = {
      'North America': Math.floor(totalCustomers * 0.5),
      'Europe': Math.floor(totalCustomers * 0.3),
      'Asia Pacific': Math.floor(totalCustomers * 0.15),
      'Other': Math.floor(totalCustomers * 0.05)
    };
    
    // Average revenue metrics
    const monthlyRevenue = 200000; // From MRR calculation
    const averageRevenuePerUser = monthlyRevenue / totalCustomers;
    const averageRevenuePerAccount = averageRevenuePerUser; // Same for B2B SaaS
    
    // Customer concentration (mock - top 10 customers)
    const topCustomerPercent = 15 + Math.random() * 10; // 15-25%
    const customerConcentrationRisk = topCustomerPercent > 25 ? 'High' : 
                                   topCustomerPercent > 15 ? 'Medium' : 'Low';
    
    return {
      totalCustomers,
      newCustomers,
      churnedCustomers,
      netNewCustomers,
      customersByTier,
      customersByRegion,
      averageRevenuePerUser,
      averageRevenuePerAccount,
      topCustomerPercent,
      customerConcentrationRisk
    };
  }
  
  /**
   * Calculate churn metrics
   */
  private static calculateChurnMetrics(data: unknown): ChurnMetrics {
    const customerChurnRate = 2 + Math.random() * 3; // 2-5% monthly churn
    const customerChurnCount = Math.floor(1200 * (customerChurnRate / 100));
    
    const revenueChurnRate = customerChurnRate * 0.8; // Revenue churn usually lower
    const revenueChurnAmount = 200000 * (revenueChurnRate / 100);
    
    // Churn reasons (mock data)
    const churnReasons: ChurnReason[] = [
      { reason: 'Price sensitivity', count: Math.floor(customerChurnCount * 0.3), percentage: 30, impact: revenueChurnAmount * 0.3 },
      { reason: 'Feature gaps', count: Math.floor(customerChurnCount * 0.25), percentage: 25, impact: revenueChurnAmount * 0.25 },
      { reason: 'Poor onboarding', count: Math.floor(customerChurnCount * 0.2), percentage: 20, impact: revenueChurnAmount * 0.2 },
      { reason: 'Competitor switch', count: Math.floor(customerChurnCount * 0.15), percentage: 15, impact: revenueChurnAmount * 0.15 },
      { reason: 'Business closure', count: Math.floor(customerChurnCount * 0.1), percentage: 10, impact: revenueChurnAmount * 0.1 }
    ];
    
    // Monthly churn trend (mock data for last 12 months)
    const monthlyChurnTrend: MonthlyMetric[] = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const churnRate = customerChurnRate + (Math.random() - 0.5) * 2; // ±1% variation
      
      monthlyChurnTrend.push({
        month: date.toISOString().substring(0, 7),
        value: churnRate,
        growth: i === 11 ? 0 : churnRate - monthlyChurnTrend[monthlyChurnTrend.length - 1]?.value || 0,
        growthPercent: i === 11 ? 0 : ((churnRate - (monthlyChurnTrend[monthlyChurnTrend.length - 1]?.value || churnRate)) / (monthlyChurnTrend[monthlyChurnTrend.length - 1]?.value || churnRate)) * 100
      });
    }
    
    return {
      customerChurnRate,
      customerChurnCount,
      revenueChurnRate,
      revenueChurnAmount,
      churnReasons,
      monthlyChurnTrend
    };
  }
  
  /**
   * Calculate retention metrics
   */
  private static calculateRetentionMetrics(data: unknown): RetentionMetrics {
    // Net Revenue Retention (should be >100% for healthy SaaS)
    const netRevenueRetention = 108 + Math.random() * 15; // 108-123%
    
    // Gross Revenue Retention (excludes expansion)
    const grossRevenueRetention = 92 + Math.random() * 6; // 92-98%
    
    // Logo retention (customer retention)
    const logoRetention = 94 + Math.random() * 4; // 94-98%
    
    // Cohort retention (mock data)
    const cohortRetention: CohortRetention[] = [];
    for (const i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const period = date.toISOString().substring(0, 7);
      
      const customersStarted = 100 + Math.floor(Math.random() * 50);
      
      cohortRetention.push({
        period,
        customersStarted,
        month1: Math.floor(customersStarted * (0.85 + Math.random() * 0.1)), // 85-95%
        month3: Math.floor(customersStarted * (0.75 + Math.random() * 0.1)), // 75-85%
        month6: Math.floor(customersStarted * (0.65 + Math.random() * 0.1)), // 65-75%
        month12: Math.floor(customersStarted * (0.55 + Math.random() * 0.1)) // 55-65%
      });
    }
    
    return {
      netRevenueRetention,
      grossRevenueRetention,
      logoRetention,
      cohortRetention
    };
  }
  
  /**
   * Calculate growth metrics
   */
  private static calculateGrowthMetrics(data: unknown): GrowthMetrics {
    const arrGrowthRate = 25 + Math.random() * 20; // 25-45% annual
    const mrrGrowthRate = arrGrowthRate / 12; // Monthly equivalent
    const customerGrowthRate = 20 + Math.random() * 15; // 20-35% annual
    
    // Growth efficiency (Net New ARR / Sales & Marketing spend)
    const growthEfficiencyRatio = 0.8 + Math.random() * 0.4; // 0.8-1.2
    
    // Rule of 40 (Growth Rate + Profit Margin)
    const profitMargin = 15 + Math.random() * 10; // 15-25%
    const ruleOf40Score = arrGrowthRate + profitMargin;
    
    // Quick Ratio
    const quickRatio = 3 + Math.random() * 2; // 3-5x
    
    // Generate trend data
    const arrTrend = this.generateTrendData(12, 2000000, arrGrowthRate / 12);
    const mrrTrend = this.generateTrendData(12, 180000, mrrGrowthRate);
    const customerTrend = this.generateTrendData(12, 1100, customerGrowthRate / 12);
    
    return {
      arrGrowthRate,
      mrrGrowthRate,
      customerGrowthRate,
      growthEfficiencyRatio,
      ruleOf40Score,
      quickRatio,
      arrTrend,
      mrrTrend,
      customerTrend
    };
  }
  
  /**
   * Calculate unit economics
   */
  private static calculateUnitEconomics(data: unknown): UnitEconomics {
    const customerAcquisitionCost = 800 + Math.random() * 400; // $800-$1200
    const customerLifetimeValue = 4000 + Math.random() * 2000; // $4000-$6000
    const ltvToCacRatio = customerLifetimeValue / customerAcquisitionCost;
    
    // Payback period in months
    const monthlyRevenue = customerLifetimeValue / 24; // Assume 24 month average lifecycle
    const paybackPeriod = customerAcquisitionCost / monthlyRevenue;
    
    // Gross margin
    const grossMarginPercent = 75 + Math.random() * 15; // 75-90%
    const grossMargin = 200000 * (grossMarginPercent / 100); // Based on MRR
    
    // Contract metrics
    const averageContractValue = customerLifetimeValue;
    const averageContractLength = 12 + Math.random() * 12; // 12-24 months
    
    return {
      customerAcquisitionCost,
      customerLifetimeValue,
      ltvToCacRatio,
      paybackPeriod,
      grossMargin,
      grossMarginPercent,
      averageContractValue,
      averageContractLength
    };
  }
  
  /**
   * Calculate subscription tier metrics
   */
  private static calculateSubscriptionTierMetrics(data: unknown): SubscriptionTierMetrics[] {
    const tiers = [
      { name: 'Starter', price: 29, customerShare: 0.2 },
      { name: 'Standard', price: 79, customerShare: 0.4 },
      { name: 'Professional', price: 199, customerShare: 0.3 },
      { name: 'Enterprise', price: 499, customerShare: 0.1 }
    ];
    
    const totalCustomers = 1200;
    const totalMrr = 200000;
    
    return tiers.map(tier => {
      const customers = Math.floor(totalCustomers * tier.customerShare);
      const mrr = customers * tier.price;
      const arr = mrr * 12;
      const churnRate = tier.price < 100 ? 5 + Math.random() * 3 : 2 + Math.random() * 2; // Higher churn for lower tiers
      const newCustomers = Math.floor(customers * (0.05 + Math.random() * 0.03));
      const churnedCustomers = Math.floor(customers * (churnRate / 100));
      
      return {
        tierName: tier.name,
        tierPrice: tier.price,
        customers,
        newCustomers,
        churnedCustomers,
        mrr,
        arr,
        churnRate,
        upgradeRate: tier.name !== 'Enterprise' ? 2 + Math.random() * 3 : undefined,
        downgradeRate: tier.name !== 'Starter' ? 1 + Math.random() * 2 : undefined
      };
    });
  }
  
  /**
   * Calculate cohort analysis
   */
  private static async calculateCohortAnalysis(companyId: string, period: string): Promise<CohortAnalysis[]> {
    const cohorts: CohortAnalysis[] = [];
    
    // Generate cohorts for last 12 months
    for (const i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const cohortMonth = date.toISOString().substring(0, 7);
      
      const customersStarted = 80 + Math.floor(Math.random() * 40); // 80-120 customers
      const revenueStarted = customersStarted * (150 + Math.random() * 100); // $150-250 ARPU
      
      const retentionByMonth: { [month: number]: CohortMonth } = {};
      
      // Calculate retention for each subsequent month
      for (const month = 1; month <= Math.min(12, 12 - i); month++) {
        const retentionRate = Math.max(0.3, 0.95 - (month * 0.05) + (Math.random() - 0.5) * 0.1);
        const revenueRetentionRate = retentionRate * (1 + Math.random() * 0.2); // Revenue retention can be higher due to expansion
        
        retentionByMonth[month] = {
          month,
          customersRemaining: Math.floor(customersStarted * retentionRate),
          revenueRemaining: revenueStarted * revenueRetentionRate,
          retentionRate: retentionRate * 100,
          revenueRetentionRate: revenueRetentionRate * 100
        };
      }
      
      cohorts.push({
        cohortMonth,
        customersStarted,
        revenueStarted,
        retentionByMonth
      });
    }
    
    return cohorts;
  }
  
  /**
   * Get SaaS industry benchmarks
   */
  static getSaaSBenchmarks(industry: string = 'SaaS'): SaaSBenchmarks {
    return {
      industry,
      arrGrowthRate: { good: 20, great: 40 },
      churnRate: { good: 5, great: 2 }, // Monthly churn %
      netRevenueRetention: { good: 110, great: 120 },
      ltvToCacRatio: { good: 3, great: 5 },
      grossMargin: { good: 70, great: 85 },
      ruleOf40: { good: 40, great: 60 }
    };
  }
  
  /**
   * Helper method to generate trend data
   */
  private static generateTrendData(months: number, baseValue: number, growthRate: number): MonthlyMetric[] {
    const trend: MonthlyMetric[] = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toISOString().substring(0, 7);
      
      const value = baseValue * Math.pow(1 + growthRate / 100, months - 1 - i) * (0.95 + Math.random() * 0.1);
      const previousValue = i === months - 1 ? baseValue : trend[trend.length - 1]?.value || baseValue;
      const growth = value - previousValue;
      const growthPercent = (growth / previousValue) * 100;
      
      trend.push({
        month,
        value,
        growth,
        growthPercent
      });
    }
    
    return trend;
  }
  
  /**
   * Get company data (mock implementation)
   */
  private static async getCompanyData(companyId: string): Promise<{ name: string; currency: string }> {
    return {
      name: 'TechCorp SaaS',
      currency: 'USD'
    };
  }
  
  /**
   * Get subscription data (mock implementation)
   */
  private static async getSubscriptionData(companyId: string, period: string): Promise<any> {
    // In real implementation, this would fetch actual subscription data
    return {};
  }
  
  /**
   * Format currency values
   */
  private static formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }
}