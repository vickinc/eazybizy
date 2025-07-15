'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BarChart3Icon from "lucide-react/dist/esm/icons/bar-chart-3";
import TrendingUpIcon from "lucide-react/dist/esm/icons/trending-up";
import TrendingDownIcon from "lucide-react/dist/esm/icons/trending-down";
import UsersIcon from "lucide-react/dist/esm/icons/users";
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle";
import CheckCircleIcon from "lucide-react/dist/esm/icons/check-circle";
import ArrowUpIcon from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down";
import MinusIcon from "lucide-react/dist/esm/icons/minus";
import InfoIcon from "lucide-react/dist/esm/icons/info";
import PieChartIcon from "lucide-react/dist/esm/icons/pie-chart";
import ActivityIcon from "lucide-react/dist/esm/icons/activity";
import TargetIcon from "lucide-react/dist/esm/icons/target";
import RefreshCwIcon from "lucide-react/dist/esm/icons/refresh-cw";
import DownloadIcon from "lucide-react/dist/esm/icons/download";
import FilterIcon from "lucide-react/dist/esm/icons/filter";
import { 
  SaaSMetricsData,
  ARRMetrics,
  MRRMetrics,
  CustomerMetrics,
  ChurnMetrics,
  RetentionMetrics,
  GrowthMetrics,
  UnitEconomics,
  SubscriptionTierMetrics,
  SaaSBenchmarks
} from '@/services/business/saasMetricsBusinessService';

interface ARRDashboardProps {
  metricsData: SaaSMetricsData;
  benchmarks?: SaaSBenchmarks;
  onRefresh?: () => void;
  onExport?: (format: 'PDF' | 'Excel') => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  trend?: 'up' | 'down' | 'stable';
  benchmark?: { value: number; status: 'good' | 'great' | 'needs-improvement' };
}

interface ChurnAnalysisProps {
  churn: ChurnMetrics;
  retention: RetentionMetrics;
}

interface GrowthTrendsProps {
  growth: GrowthMetrics;
}

interface SubscriptionTiersProps {
  tiers: SubscriptionTierMetrics[];
  totalMrr: number;
}

interface UnitEconomicsProps {
  economics: UnitEconomics;
  benchmarks?: SaaSBenchmarks;
}

interface CohortTableProps {
  cohorts: unknown[];
}

/**
 * Metric card with trends and benchmarks
 */
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  change, 
  changeLabel, 
  subtitle, 
  icon: Icon, 
  color,
  trend,
  benchmark
}) => {
  const getTrendIcon = () => {
    if (change === undefined) return null;
    if (change > 0) return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (change < 0) return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return <MinusIcon className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (change === undefined) return '';
    return change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600';
  };

  const getBenchmarkColor = () => {
    if (!benchmark) return '';
    switch (benchmark.status) {
      case 'great': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'needs-improvement': return 'text-red-600 bg-red-100';
      default: return '';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="h-4 w-4 text-white" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {(change !== undefined || subtitle) && (
          <div className="flex items-center justify-between mt-1">
            {change !== undefined && (
              <div className="flex items-center space-x-1 text-xs">
                {getTrendIcon()}
                <span className={getTrendColor()}>
                  {Math.abs(change).toFixed(1)}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
            {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
          </div>
        )}
        
        {benchmark && (
          <div className="mt-2">
            <Badge className={`text-xs ${getBenchmarkColor()}`}>
              {benchmark.status === 'great' ? 'Excellent' : 
               benchmark.status === 'good' ? 'Good' : 'Needs Improvement'}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Churn analysis component
 */
const ChurnAnalysis: React.FC<ChurnAnalysisProps> = ({ churn, retention }) => {
  return (
    <div className="space-y-6">
      {/* Churn Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {churn.customerChurnRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              {churn.customerChurnCount} customers churned this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Churn</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600 mb-2">
              {churn.revenueChurnRate.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              ${churn.revenueChurnAmount.toLocaleString()} MRR lost
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Retention Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Retention Metrics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium">Net Revenue Retention</p>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold text-green-600">
                  {retention.netRevenueRetention.toFixed(0)}%
                </div>
                {retention.netRevenueRetention > 100 && (
                  <CheckCircleIcon className="h-4 w-4 text-green-500" />
                )}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Gross Revenue Retention</p>
              <div className="text-2xl font-bold text-blue-600">
                {retention.grossRevenueRetention.toFixed(0)}%
              </div>
            </div>
            <div>
              <p className="text-sm font-medium">Logo Retention</p>
              <div className="text-2xl font-bold text-purple-600">
                {retention.logoRetention.toFixed(0)}%
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Churn Reasons */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Churn Reasons</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {churn.churnReasons.map((reason, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{reason.reason}</span>
                    <span className="text-sm text-muted-foreground">
                      {reason.count} customers ({reason.percentage}%)
                    </span>
                  </div>
                  <Progress value={reason.percentage} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Growth trends component
 */
const GrowthTrends: React.FC<GrowthTrendsProps> = ({ growth }) => {
  return (
    <div className="space-y-6">
      {/* Key Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">ARR Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {growth.arrGrowthRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">Annual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quick Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {growth.quickRatio.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">Growth efficiency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Rule of 40</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              growth.ruleOf40Score >= 40 ? 'text-green-600' : 'text-orange-600'
            }`}>
              {growth.ruleOf40Score.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {growth.ruleOf40Score >= 40 ? 'Excellent' : 'Needs improvement'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Growth Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {growth.growthEfficiencyRatio.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground">Sales efficiency</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trends Chart Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Growth Trends</CardTitle>
          <CardDescription>Monthly progression of key metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-200 rounded-lg">
            <div className="text-center">
              <BarChart3Icon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
              <p className="text-gray-500">Interactive charts coming soon</p>
              <p className="text-xs text-gray-400">ARR, MRR, and customer growth trends</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Subscription tiers component
 */
const SubscriptionTiers: React.FC<SubscriptionTiersProps> = ({ tiers, totalMrr }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Subscription Tiers Performance</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Tier</th>
                <th className="text-right py-2">Price</th>
                <th className="text-right py-2">Customers</th>
                <th className="text-right py-2">MRR</th>
                <th className="text-right py-2">Churn Rate</th>
                <th className="text-center py-2">Share</th>
              </tr>
            </thead>
            <tbody>
              {tiers.map((tier, index) => {
                const mrrShare = (tier.mrr / totalMrr) * 100;
                return (
                  <tr key={index} className="border-b">
                    <td className="py-2 font-medium">{tier.tierName}</td>
                    <td className="text-right py-2">${tier.tierPrice}</td>
                    <td className="text-right py-2">{tier.customers.toLocaleString()}</td>
                    <td className="text-right py-2">${tier.mrr.toLocaleString()}</td>
                    <td className="text-right py-2">
                      <span className={`${
                        tier.churnRate > 5 ? 'text-red-600' : 
                        tier.churnRate > 3 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {tier.churnRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="text-center py-2">
                      <div className="flex items-center justify-center space-x-2">
                        <Progress value={mrrShare} className="w-16" />
                        <span className="text-xs">{mrrShare.toFixed(0)}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Unit economics component
 */
const UnitEconomics: React.FC<UnitEconomicsProps> = ({ economics, benchmarks }) => {
  const getLTVCACStatus = (ratio: number) => {
    if (!benchmarks) return 'good';
    if (ratio >= benchmarks.ltvToCacRatio.great) return 'great';
    if (ratio >= benchmarks.ltvToCacRatio.good) return 'good';
    return 'needs-improvement';
  };

  return (
    <div className="space-y-6">
      {/* Key Unit Economics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${economics.customerAcquisitionCost.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Customer Acquisition Cost</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${economics.customerLifetimeValue.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground">Customer Lifetime Value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">LTV:CAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${
              economics.ltvToCacRatio >= 3 ? 'text-green-600' : 'text-red-600'
            }`}>
              {economics.ltvToCacRatio.toFixed(1)}:1
            </div>
            <Badge className={`text-xs mt-1 ${
              getLTVCACStatus(economics.ltvToCacRatio) === 'great' ? 'bg-green-100 text-green-800' :
              getLTVCACStatus(economics.ltvToCacRatio) === 'good' ? 'bg-blue-100 text-blue-800' :
              'bg-red-100 text-red-800'
            }`}>
              {getLTVCACStatus(economics.ltvToCacRatio) === 'great' ? 'Excellent' :
               getLTVCACStatus(economics.ltvToCacRatio) === 'good' ? 'Good' : 'Poor'}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payback Period</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {economics.paybackPeriod.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Months</p>
          </CardContent>
        </Card>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gross Margin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">
              {economics.grossMarginPercent.toFixed(1)}%
            </div>
            <p className="text-sm text-muted-foreground">
              ${economics.grossMargin.toLocaleString()} monthly
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Average Contract</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">
              ${economics.averageContractValue.toLocaleString()}
            </div>
            <p className="text-sm text-muted-foreground">
              {economics.averageContractLength.toFixed(0)} months average length
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Cohort table component
 */
const CohortTable: React.FC<CohortTableProps> = ({ cohorts }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Cohort Retention Analysis</CardTitle>
        <CardDescription>Customer retention by acquisition cohort</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">Cohort</th>
                <th className="text-right py-2">Started</th>
                <th className="text-right py-2">Month 1</th>
                <th className="text-right py-2">Month 3</th>
                <th className="text-right py-2">Month 6</th>
                <th className="text-right py-2">Month 12</th>
              </tr>
            </thead>
            <tbody>
              {cohorts.slice(0, 6).map((cohort, index) => (
                <tr key={index} className="border-b">
                  <td className="py-2 font-medium">{cohort.period}</td>
                  <td className="text-right py-2">{cohort.customersStarted}</td>
                  <td className="text-right py-2">
                    {cohort.month1 || '-'}
                    {cohort.month1 && (
                      <div className="text-xs text-muted-foreground">
                        {((cohort.month1 / cohort.customersStarted) * 100).toFixed(0)}%
                      </div>
                    )}
                  </td>
                  <td className="text-right py-2">
                    {cohort.month3 || '-'}
                    {cohort.month3 && (
                      <div className="text-xs text-muted-foreground">
                        {((cohort.month3 / cohort.customersStarted) * 100).toFixed(0)}%
                      </div>
                    )}
                  </td>
                  <td className="text-right py-2">
                    {cohort.month6 || '-'}
                    {cohort.month6 && (
                      <div className="text-xs text-muted-foreground">
                        {((cohort.month6 / cohort.customersStarted) * 100).toFixed(0)}%
                      </div>
                    )}
                  </td>
                  <td className="text-right py-2">
                    {cohort.month12 || '-'}
                    {cohort.month12 && (
                      <div className="text-xs text-muted-foreground">
                        {((cohort.month12 / cohort.customersStarted) * 100).toFixed(0)}%
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main ARR Dashboard Component
 */
export const ARRDashboard: React.FC<ARRDashboardProps> = ({
  metricsData,
  benchmarks,
  onRefresh,
  onExport,
  className = ''
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (!onRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const getBenchmarkStatus = (metric: string, value: number): 'great' | 'good' | 'needs-improvement' => {
    if (!benchmarks) return 'good';
    
    const benchmark = benchmarks[metric as keyof typeof benchmarks];
    if (typeof benchmark === 'object' && 'good' in benchmark && 'great' in benchmark) {
      if (value >= benchmark.great) return 'great';
      if (value >= benchmark.good) return 'good';
    }
    return 'needs-improvement';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BarChart3Icon className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{metricsData.companyName} ARR Dashboard</h1>
            <p className="text-muted-foreground">
              SaaS metrics and recurring revenue analysis for {metricsData.period}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {onExport && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('PDF')}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExport('Excel')}
              >
                <DownloadIcon className="h-4 w-4 mr-2" />
                Excel
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Annual Recurring Revenue"
          value={metricsData.arr.currentFormatted}
          change={metricsData.arr.growthPercent}
          changeLabel="vs last year"
          icon={DollarSignIcon}
          color="bg-green-500"
          benchmark={{
            value: metricsData.arr.growthPercent,
            status: getBenchmarkStatus('arrGrowthRate', metricsData.arr.growthPercent)
          }}
        />
        
        <MetricCard
          title="Monthly Recurring Revenue"
          value={metricsData.mrr.currentFormatted}
          change={metricsData.mrr.growthPercent}
          changeLabel="vs last month"
          icon={CalendarIcon}
          color="bg-blue-500"
        />
        
        <MetricCard
          title="Total Customers"
          value={metricsData.customers.totalCustomers.toLocaleString()}
          change={metricsData.customers.netNewCustomers}
          changeLabel="net new"
          icon={UsersIcon}
          color="bg-purple-500"
        />
        
        <MetricCard
          title="Net Revenue Retention"
          value={`${metricsData.retention.netRevenueRetention.toFixed(0)}%`}
          icon={TargetIcon}
          color="bg-orange-500"
          benchmark={{
            value: metricsData.retention.netRevenueRetention,
            status: getBenchmarkStatus('netRevenueRetention', metricsData.retention.netRevenueRetention)
          }}
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="growth">Growth</TabsTrigger>
          <TabsTrigger value="churn">Churn & Retention</TabsTrigger>
          <TabsTrigger value="economics">Unit Economics</TabsTrigger>
          <TabsTrigger value="cohorts">Cohorts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* ARR Movement */}
          <Card>
            <CardHeader>
              <CardTitle>ARR Movement Analysis</CardTitle>
              <CardDescription>Breakdown of ARR changes</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    +{metricsData.arr.newArrFormatted}
                  </div>
                  <p className="text-xs text-muted-foreground">New ARR</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    +${metricsData.arr.expansionArr.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Expansion</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    -${metricsData.arr.contractionArr.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Contraction</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    -${metricsData.arr.churnedArr.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">Churned</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {metricsData.arr.netNewArrFormatted}
                  </div>
                  <p className="text-xs text-muted-foreground">Net New ARR</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Tiers */}
          <SubscriptionTiers 
            tiers={metricsData.subscriptionTiers} 
            totalMrr={metricsData.mrr.current}
          />
        </TabsContent>

        <TabsContent value="growth">
          <GrowthTrends growth={metricsData.growth} />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnAnalysis 
            churn={metricsData.churn} 
            retention={metricsData.retention}
          />
        </TabsContent>

        <TabsContent value="economics">
          <UnitEconomics 
            economics={metricsData.unitEconomics}
            benchmarks={benchmarks}
          />
        </TabsContent>

        <TabsContent value="cohorts">
          <CohortTable cohorts={metricsData.retention.cohortRetention} />
        </TabsContent>
      </Tabs>
    </div>
  );
};