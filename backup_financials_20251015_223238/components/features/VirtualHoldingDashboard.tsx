'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import FolderOpenIcon from "lucide-react/dist/esm/icons/folder-open";
import TrendingUpIcon from "lucide-react/dist/esm/icons/trending-up";
import TrendingDownIcon from "lucide-react/dist/esm/icons/trending-down";
import AlertTriangleIcon from "lucide-react/dist/esm/icons/alert-triangle";
import PieChartIcon from "lucide-react/dist/esm/icons/pie-chart";
import BarChart3Icon from "lucide-react/dist/esm/icons/bar-chart-3";
import DollarSignIcon from "lucide-react/dist/esm/icons/dollar-sign";
import GlobeIcon from "lucide-react/dist/esm/icons/globe";
import BuildingIcon from "lucide-react/dist/esm/icons/building";
import Users2Icon from "lucide-react/dist/esm/icons/users-2";
import TargetIcon from "lucide-react/dist/esm/icons/target";
import ShieldIcon from "lucide-react/dist/esm/icons/shield";
import ArrowUpIcon from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDownIcon from "lucide-react/dist/esm/icons/arrow-down";
import MinusIcon from "lucide-react/dist/esm/icons/minus";
import ExternalLinkIcon from "lucide-react/dist/esm/icons/external-link";
import RefreshCwIcon from "lucide-react/dist/esm/icons/refresh-cw";
import DownloadIcon from "lucide-react/dist/esm/icons/download";
import SettingsIcon from "lucide-react/dist/esm/icons/settings";
import { 
  VirtualHolding, 
  ConsolidatedFinancials, 
  CompanyFinancialSummary,
  HoldingPerformanceMetrics,
  HoldingRiskAssessment,
  RiskFactor
} from '@/services/business/virtualHoldingBusinessService';

interface VirtualHoldingDashboardProps {
  holding: VirtualHolding;
  consolidatedFinancials: ConsolidatedFinancials;
  onRefresh?: () => void;
  onExport?: (format: 'PDF' | 'Excel') => void;
  onEditHolding?: () => void;
  className?: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  trend?: number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface CompanyBreakdownTableProps {
  companies: CompanyFinancialSummary[];
  baseCurrency: string;
}

interface RiskAssessmentPanelProps {
  riskAssessment: HoldingRiskAssessment;
}

interface PerformanceMetricsPanelProps {
  metrics: HoldingPerformanceMetrics;
}

/**
 * Metric card component with trend indicators
 */
const MetricCard: React.FC<MetricCardProps> = ({ 
  title, 
  value, 
  trend, 
  subtitle, 
  icon: Icon, 
  color 
}) => {
  const getTrendIcon = () => {
    if (!trend) return null;
    if (trend > 0) return <ArrowUpIcon className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <ArrowDownIcon className="h-4 w-4 text-red-500" />;
    return <MinusIcon className="h-4 w-4 text-gray-500" />;
  };

  const getTrendColor = () => {
    if (!trend) return '';
    return trend > 0 ? 'text-green-600' : trend < 0 ? 'text-red-600' : 'text-gray-600';
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
        {(trend !== undefined || subtitle) && (
          <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
            {trend !== undefined && (
              <>
                {getTrendIcon()}
                <span className={getTrendColor()}>
                  {Math.abs(trend).toFixed(1)}%
                </span>
              </>
            )}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Company breakdown table with sorting and filtering
 */
const CompanyBreakdownTable: React.FC<CompanyBreakdownTableProps> = ({ 
  companies, 
  baseCurrency 
}) => {
  const [sortBy, setSortBy] = useState<'revenue' | 'profit' | 'margin' | 'roa'>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const sortedCompanies = [...companies].sort((a, b) => {
    let aValue: number, bValue: number;
    
    switch (sortBy) {
      case 'revenue':
        aValue = a.revenue.converted;
        bValue = b.revenue.converted;
        break;
      case 'profit':
        aValue = a.netProfit.converted;
        bValue = b.netProfit.converted;
        break;
      case 'margin':
        aValue = a.profitMargin;
        bValue = b.profitMargin;
        break;
      case 'roa':
        aValue = a.roa;
        bValue = b.roa;
        break;
      default:
        return 0;
    }
    
    return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
  });

  const handleSort = (column: typeof sortBy) => {
    if (sortBy === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortDirection('desc');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Company Performance</h3>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Sort by:</span>
          {(['revenue', 'profit', 'margin', 'roa'] as const).map((option) => (
            <Button
              key={option}
              variant={sortBy === option ? 'default' : 'outline'}
              size="sm"
              onClick={() => handleSort(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 rounded-lg text-sm">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-700">Company</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Revenue</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Net Profit</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">Margin</th>
              <th className="px-4 py-3 text-right font-medium text-gray-700">ROA</th>
              <th className="px-4 py-3 text-center font-medium text-gray-700">Currency</th>
            </tr>
          </thead>
          <tbody>
            {sortedCompanies.map((company, index) => (
              <tr key={company.companyId} className="border-t hover:bg-gray-25">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium">{company.companyName}</div>
                    <div className="text-xs text-muted-foreground">
                      {company.segment && `${company.segment} • `}
                      {company.region && company.region}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="font-medium">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: baseCurrency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(company.revenue.converted)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {company.revenue.percentage.toFixed(1)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={`font-medium ${
                    company.netProfit.converted >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: baseCurrency,
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }).format(company.netProfit.converted)}
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={`font-medium ${
                    company.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {company.profitMargin.toFixed(1)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className={`font-medium ${
                    company.roa >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {company.roa.toFixed(1)}%
                  </div>
                </td>
                <td className="px-4 py-3 text-center">
                  <Badge variant="outline" className="text-xs">
                    {company.currency}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Risk assessment panel with visual indicators
 */
const RiskAssessmentPanel: React.FC<RiskAssessmentPanelProps> = ({ riskAssessment }) => {
  const getRiskColor = (score: number) => {
    if (score <= 3) return 'text-green-600 bg-green-100';
    if (score <= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getRiskLabel = (score: number) => {
    if (score <= 3) return 'Low Risk';
    if (score <= 6) return 'Medium Risk';
    return 'High Risk';
  };

  const getSeverityColor = (severity: 'Low' | 'Medium' | 'High') => {
    switch (severity) {
      case 'Low': return 'bg-green-100 text-green-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'High': return 'bg-red-100 text-red-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <ShieldIcon className="h-5 w-5 mr-2" />
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overall Risk Score */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">Overall Risk Score</p>
            <p className="text-xs text-muted-foreground">Scale: 1-10</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl font-bold px-3 py-1 rounded-lg ${getRiskColor(riskAssessment.overallRiskScore)}`}>
              {riskAssessment.overallRiskScore.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getRiskLabel(riskAssessment.overallRiskScore)}
            </p>
          </div>
        </div>

        <Separator />

        {/* Currency Exposure */}
        <div>
          <h4 className="text-sm font-medium mb-3">Currency Exposure</h4>
          <div className="space-y-2">
            {Object.entries(riskAssessment.currencyExposure).map(([currency, exposure]) => (
              <div key={currency} className="flex items-center justify-between">
                <span className="text-sm">{currency}</span>
                <div className="flex items-center space-x-2">
                  <Progress value={exposure} className="w-20" />
                  <span className="text-sm font-medium w-12 text-right">
                    {exposure.toFixed(1)}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Risk Factors */}
        <div>
          <h4 className="text-sm font-medium mb-3">Risk Factors</h4>
          <div className="space-y-3">
            {riskAssessment.riskFactors.map((factor, index) => (
              <div key={index} className="border rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Badge className={`text-xs ${getSeverityColor(factor.severity)}`}>
                      {factor.severity}
                    </Badge>
                    <p className="font-medium text-sm mt-1">{factor.description}</p>
                  </div>
                  <AlertTriangleIcon className={`h-4 w-4 ${
                    factor.severity === 'High' ? 'text-red-500' :
                    factor.severity === 'Medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{factor.impact}</p>
                {factor.mitigation && (
                  <p className="text-xs text-blue-600">{factor.mitigation}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        {riskAssessment.recommendations.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Recommendations</h4>
              <ul className="space-y-1">
                {riskAssessment.recommendations.map((recommendation, index) => (
                  <li key={index} className="text-sm text-muted-foreground flex items-start">
                    <TargetIcon className="h-3 w-3 mr-2 mt-0.5 text-blue-500" />
                    {recommendation}
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Performance metrics panel with key indicators
 */
const PerformanceMetricsPanel: React.FC<PerformanceMetricsPanelProps> = ({ metrics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <BarChart3Icon className="h-5 w-5 mr-2" />
          Performance Metrics
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Profit Margin</p>
            <p className="text-2xl font-bold text-green-600">
              {metrics.overallProfitMargin.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Asset Turnover</p>
            <p className="text-2xl font-bold text-blue-600">
              {metrics.assetTurnover.toFixed(2)}x
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Weighted ROA</p>
            <p className="text-2xl font-bold text-purple-600">
              {metrics.weightedAverageROA.toFixed(1)}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Weighted ROE</p>
            <p className="text-2xl font-bold text-orange-600">
              {metrics.weightedAverageROE.toFixed(1)}%
            </p>
          </div>
        </div>

        <Separator />

        <div>
          <h4 className="text-sm font-medium mb-3">Diversification Metrics</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Revenue Concentration</span>
              <div className="flex items-center space-x-2">
                <Progress value={metrics.revenueConcentration * 100} className="w-20" />
                <span className="text-sm font-medium">
                  {(metrics.revenueConcentration * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Geographic Markets</span>
              <Badge variant="outline">{metrics.geographicDiversification}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Business Segments</span>
              <Badge variant="outline">{metrics.segmentDiversification}</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main Virtual Holding Dashboard Component
 */
export const VirtualHoldingDashboard: React.FC<VirtualHoldingDashboardProps> = ({
  holding,
  consolidatedFinancials,
  onRefresh,
  onExport,
  onEditHolding,
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: consolidatedFinancials.baseCurrency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <FolderOpenIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">{holding.name}</h1>
            <p className="text-muted-foreground">
              {holding.description || 'Virtual holding consolidation'}
            </p>
            <div className="flex items-center space-x-4 mt-1">
              <span className="text-sm text-muted-foreground">
                {holding.companies.length} companies
              </span>
              <span className="text-sm text-muted-foreground">
                Base currency: {holding.baseCurrency}
              </span>
              <span className="text-sm text-muted-foreground">
                Period: {consolidatedFinancials.period}
              </span>
            </div>
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
          
          {onEditHolding && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditHolding}
            >
              <SettingsIcon className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}

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
          title="Total Revenue"
          value={formatCurrency(consolidatedFinancials.totalRevenue.amount)}
          subtitle={`${consolidatedFinancials.baseCurrency}`}
          icon={DollarSignIcon}
          color="bg-green-500"
        />
        <MetricCard
          title="Net Profit"
          value={formatCurrency(consolidatedFinancials.netProfit.amount)}
          subtitle={`${consolidatedFinancials.metrics.overallProfitMargin.toFixed(1)}% margin`}
          icon={TrendingUpIcon}
          color="bg-blue-500"
        />
        <MetricCard
          title="Total Assets"
          value={formatCurrency(consolidatedFinancials.totalAssets.amount)}
          subtitle="Consolidated"
          icon={BuildingIcon}
          color="bg-purple-500"
        />
        <MetricCard
          title="Total Equity"
          value={formatCurrency(consolidatedFinancials.totalEquity.amount)}
          subtitle={`ROE: ${consolidatedFinancials.metrics.weightedAverageROE.toFixed(1)}%`}
          icon={PieChartIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Performance Table */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <CompanyBreakdownTable
                companies={consolidatedFinancials.companyBreakdown}
                baseCurrency={consolidatedFinancials.baseCurrency}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar with metrics and risk */}
        <div className="space-y-6">
          <PerformanceMetricsPanel metrics={consolidatedFinancials.metrics} />
          <RiskAssessmentPanel riskAssessment={consolidatedFinancials.riskAssessment} />
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Exchange Rates */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <GlobeIcon className="h-5 w-5 mr-2" />
              Exchange Rates
            </CardTitle>
            <CardDescription>
              Rates used for currency conversion (base: {consolidatedFinancials.baseCurrency})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(consolidatedFinancials.exchangeRates).map(([currency, rate]) => (
                <div key={currency} className="flex justify-between">
                  <span className="text-sm">{currency}</span>
                  <span className="text-sm font-medium">{rate.toFixed(4)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Generation Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users2Icon className="h-5 w-5 mr-2" />
              Consolidation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Companies included:</span>
              <span className="font-medium">
                {consolidatedFinancials.companyBreakdown.length}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Generated:</span>
              <span className="font-medium">
                {consolidatedFinancials.generatedAt.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Base currency:</span>
              <span className="font-medium">{consolidatedFinancials.baseCurrency}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Period:</span>
              <span className="font-medium">{consolidatedFinancials.period}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};