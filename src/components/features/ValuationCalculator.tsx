'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  TrendingUpIcon,
  CalculatorIcon,
  DollarSignIcon,
  BarChart3Icon,
  PieChartIcon,
  AlertTriangleIcon,
  InfoIcon,
  CheckCircleIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  RefreshCwIcon,
  DownloadIcon,
  SettingsIcon,
  TargetIcon,
  TrendingDownIcon
} from 'lucide-react';
import { 
  CompanyValuation,
  FinancialInputs,
  ValuationSummary,
  ValuationMethods,
  SensitivityAnalysis,
  ValuationRiskFactor,
  IndustryType,
  BusinessModel,
  MarketPosition,
  CompanyValuationBusinessService
} from '@/services/business/companyValuationBusinessService';

interface ValuationCalculatorProps {
  companyId?: string;
  initialData?: Partial<FinancialInputs>;
  onValuationComplete?: (valuation: CompanyValuation) => void;
  className?: string;
}

interface FinancialInputFormProps {
  inputs: FinancialInputs;
  onChange: (inputs: FinancialInputs) => void;
}

interface ValuationResultsProps {
  valuation: CompanyValuation;
  onExport?: (format: 'PDF' | 'Excel') => void;
}

interface ValuationMethodCardProps {
  method: unknown;
  methodName: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface SensitivityChartProps {
  analysis: SensitivityAnalysis;
}

interface RiskFactorsProps {
  riskFactors: ValuationRiskFactor[];
}

/**
 * Financial inputs form component
 */
const FinancialInputForm: React.FC<FinancialInputFormProps> = ({ inputs, onChange }) => {
  const updateInput = (field: keyof FinancialInputs, value: unknown) => {
    onChange({ ...inputs, [field]: value });
  };

  const formatNumber = (value: number) => {
    return value.toLocaleString();
  };

  const parseNumber = (value: string) => {
    return parseFloat(value.replace(/,/g, '')) || 0;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Company Information */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Company Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="industryType">Industry Type</Label>
              <Select value={inputs.industryType} onValueChange={(value: IndustryType) => updateInput('industryType', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SaaS">SaaS</SelectItem>
                  <SelectItem value="Technology">Technology</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Retail">Retail</SelectItem>
                  <SelectItem value="Healthcare">Healthcare</SelectItem>
                  <SelectItem value="Financial Services">Financial Services</SelectItem>
                  <SelectItem value="Energy">Energy</SelectItem>
                  <SelectItem value="Real Estate">Real Estate</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="businessModel">Business Model</Label>
              <Select value={inputs.businessModel} onValueChange={(value: BusinessModel) => updateInput('businessModel', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B2B SaaS">B2B SaaS</SelectItem>
                  <SelectItem value="B2C SaaS">B2C SaaS</SelectItem>
                  <SelectItem value="Marketplace">Marketplace</SelectItem>
                  <SelectItem value="E-commerce">E-commerce</SelectItem>
                  <SelectItem value="Manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="Services">Services</SelectItem>
                  <SelectItem value="Hybrid">Hybrid</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="marketPosition">Market Position</Label>
              <Select value={inputs.marketPosition} onValueChange={(value: MarketPosition) => updateInput('marketPosition', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Market Leader">Market Leader</SelectItem>
                  <SelectItem value="Strong Competitor">Strong Competitor</SelectItem>
                  <SelectItem value="Niche Player">Niche Player</SelectItem>
                  <SelectItem value="Emerging">Emerging</SelectItem>
                  <SelectItem value="Declining">Declining</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employeeCount">Employee Count</Label>
              <Input
                id="employeeCount"
                type="number"
                value={inputs.employeeCount || ''}
                onChange={(e) => updateInput('employeeCount', parseInt(e.target.value) || 0)}
                placeholder="100"
              />
            </div>
          </CardContent>
        </Card>

        {/* Revenue Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="annualRevenue">Annual Revenue ($)</Label>
              <Input
                id="annualRevenue"
                type="text"
                value={formatNumber(inputs.annualRevenue)}
                onChange={(e) => updateInput('annualRevenue', parseNumber(e.target.value))}
                placeholder="5,000,000"
              />
            </div>

            <div>
              <Label htmlFor="revenueGrowthRate">Revenue Growth Rate (%)</Label>
              <Input
                id="revenueGrowthRate"
                type="number"
                step="0.1"
                value={inputs.revenueGrowthRate}
                onChange={(e) => updateInput('revenueGrowthRate', parseFloat(e.target.value) || 0)}
                placeholder="25"
              />
            </div>

            <div>
              <Label htmlFor="monthlyRecurringRevenue">Monthly Recurring Revenue ($)</Label>
              <Input
                id="monthlyRecurringRevenue"
                type="text"
                value={inputs.monthlyRecurringRevenue ? formatNumber(inputs.monthlyRecurringRevenue) : ''}
                onChange={(e) => updateInput('monthlyRecurringRevenue', parseNumber(e.target.value))}
                placeholder="400,000"
              />
              <p className="text-xs text-muted-foreground mt-1">For SaaS companies</p>
            </div>

            <div>
              <Label htmlFor="customersCount">Total Customers</Label>
              <Input
                id="customersCount"
                type="number"
                value={inputs.customersCount || ''}
                onChange={(e) => updateInput('customersCount', parseInt(e.target.value) || 0)}
                placeholder="1000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Profitability Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profitability Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="grossProfit">Gross Profit ($)</Label>
              <Input
                id="grossProfit"
                type="text"
                value={formatNumber(inputs.grossProfit)}
                onChange={(e) => updateInput('grossProfit', parseNumber(e.target.value))}
                placeholder="3,750,000"
              />
            </div>

            <div>
              <Label htmlFor="grossMargin">Gross Margin (%)</Label>
              <Input
                id="grossMargin"
                type="number"
                step="0.1"
                value={inputs.grossMargin}
                onChange={(e) => updateInput('grossMargin', parseFloat(e.target.value) || 0)}
                placeholder="75"
              />
            </div>

            <div>
              <Label htmlFor="ebitda">EBITDA ($)</Label>
              <Input
                id="ebitda"
                type="text"
                value={formatNumber(inputs.ebitda)}
                onChange={(e) => updateInput('ebitda', parseNumber(e.target.value))}
                placeholder="1,000,000"
              />
            </div>

            <div>
              <Label htmlFor="ebitdaMargin">EBITDA Margin (%)</Label>
              <Input
                id="ebitdaMargin"
                type="number"
                step="0.1"
                value={inputs.ebitdaMargin}
                onChange={(e) => updateInput('ebitdaMargin', parseFloat(e.target.value) || 0)}
                placeholder="20"
              />
            </div>

            <div>
              <Label htmlFor="netIncome">Net Income ($)</Label>
              <Input
                id="netIncome"
                type="text"
                value={formatNumber(inputs.netIncome)}
                onChange={(e) => updateInput('netIncome', parseNumber(e.target.value))}
                placeholder="750,000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Balance Sheet */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balance Sheet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="totalAssets">Total Assets ($)</Label>
              <Input
                id="totalAssets"
                type="text"
                value={formatNumber(inputs.totalAssets)}
                onChange={(e) => updateInput('totalAssets', parseNumber(e.target.value))}
                placeholder="7,500,000"
              />
            </div>

            <div>
              <Label htmlFor="totalLiabilities">Total Liabilities ($)</Label>
              <Input
                id="totalLiabilities"
                type="text"
                value={formatNumber(inputs.totalLiabilities)}
                onChange={(e) => updateInput('totalLiabilities', parseNumber(e.target.value))}
                placeholder="1,500,000"
              />
            </div>

            <div>
              <Label htmlFor="shareholdersEquity">Shareholders' Equity ($)</Label>
              <Input
                id="shareholdersEquity"
                type="text"
                value={formatNumber(inputs.shareholdersEquity)}
                onChange={(e) => updateInput('shareholdersEquity', parseNumber(e.target.value))}
                placeholder="6,000,000"
              />
            </div>

            <div>
              <Label htmlFor="operatingCashFlow">Operating Cash Flow ($)</Label>
              <Input
                id="operatingCashFlow"
                type="text"
                value={formatNumber(inputs.operatingCashFlow)}
                onChange={(e) => updateInput('operatingCashFlow', parseNumber(e.target.value))}
                placeholder="900,000"
              />
            </div>

            <div>
              <Label htmlFor="freeCashFlow">Free Cash Flow ($)</Label>
              <Input
                id="freeCashFlow"
                type="text"
                value={formatNumber(inputs.freeCashFlow)}
                onChange={(e) => updateInput('freeCashFlow', parseNumber(e.target.value))}
                placeholder="750,000"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Valuation method card component
 */
const ValuationMethodCard: React.FC<ValuationMethodCardProps> = ({ method, methodName, icon: Icon, color }) => {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 8) return 'text-green-600 bg-green-100';
    if (confidence >= 6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 8) return 'High';
    if (confidence >= 6) return 'Medium';
    return 'Low';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${color}`}>
              <Icon className="h-4 w-4 text-white" />
            </div>
            <CardTitle className="text-base">{methodName}</CardTitle>
          </div>
          <Badge className={`text-xs ${getConfidenceColor(method.confidence)}`}>
            {getConfidenceLabel(method.confidence)} Confidence
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-sm">
            <div>
              <p className="text-muted-foreground">Low</p>
              <p className="font-medium">{formatCurrency(method.valuationRange.low)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Median</p>
              <p className="font-medium text-blue-600">{formatCurrency(method.valuationRange.median)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">High</p>
              <p className="font-medium">{formatCurrency(method.valuationRange.high)}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Weight in Final Valuation</span>
            <span className="font-medium">{(method.weight * 100).toFixed(0)}%</span>
          </div>
          
          <Progress value={method.confidence * 10} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Sensitivity analysis component
 */
const SensitivityChart: React.FC<SensitivityChartProps> = ({ analysis }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Sensitivity Analysis</CardTitle>
        <CardDescription>Impact of key variables on valuation</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analysis.variables.map((variable, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{variable.variable}</span>
                <span className="text-sm text-muted-foreground">
                  Base: {variable.baseCase.toFixed(1)}%
                </span>
              </div>
              
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-red-600 font-medium">
                    {variable.impact.lowCase > 0 ? '+' : ''}{variable.impact.lowCase}%
                  </div>
                  <div className="text-muted-foreground">Low Case</div>
                </div>
                <div className="text-center">
                  <div className="font-medium">Base Case</div>
                  <div className="text-muted-foreground">0%</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 font-medium">
                    +{variable.impact.highCase}%
                  </div>
                  <div className="text-muted-foreground">High Case</div>
                </div>
              </div>
              
              <div className="relative">
                <Progress value={50} className="h-2" />
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-200 via-gray-200 to-green-200 rounded-full" />
              </div>
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <div>
          <h4 className="text-sm font-medium mb-3">Scenario Analysis</h4>
          <div className="space-y-2">
            {analysis.scenarios.map((scenario, index) => (
              <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50">
                <div>
                  <span className="text-sm font-medium">{scenario.scenario}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({(scenario.probability * 100).toFixed(0)}% probability)
                  </span>
                </div>
                <span className="text-sm font-medium">
                  ${scenario.valuation.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Risk factors component
 */
const RiskFactors: React.FC<RiskFactorsProps> = ({ riskFactors }) => {
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Market': return 'bg-blue-100 text-blue-800';
      case 'Financial': return 'bg-purple-100 text-purple-800';
      case 'Operational': return 'bg-orange-100 text-orange-800';
      case 'Regulatory': return 'bg-indigo-100 text-indigo-800';
      case 'Technology': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (riskFactors.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center">
            <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
            Risk Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <CheckCircleIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
            <p className="text-sm text-muted-foreground">No significant risk factors identified</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center">
          <AlertTriangleIcon className="h-5 w-5 mr-2 text-orange-500" />
          Risk Factors
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {riskFactors.map((risk, index) => (
            <div key={index} className="border rounded-lg p-3">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className={`text-xs ${getCategoryColor(risk.category)}`}>
                    {risk.category}
                  </Badge>
                  <Badge className={`text-xs ${getImpactColor(risk.impact)}`}>
                    {risk.impact} Impact
                  </Badge>
                </div>
                {risk.discountAdjustment && (
                  <span className="text-xs text-red-600 font-medium">
                    {risk.discountAdjustment}%
                  </span>
                )}
              </div>
              
              <h4 className="text-sm font-medium mb-1">{risk.factor}</h4>
              <p className="text-xs text-muted-foreground mb-2">{risk.description}</p>
              
              {risk.mitigation && (
                <div className="text-xs text-blue-600">
                  <strong>Mitigation:</strong> {risk.mitigation}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Main valuation results component
 */
const ValuationResults: React.FC<ValuationResultsProps> = ({ valuation, onExport }) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'High': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="space-y-6">
      {/* Valuation Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Valuation Summary</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge className={`${getDataQualityColor(valuation.valuationSummary.dataQuality)}`}>
                {valuation.valuationSummary.dataQuality} Quality
              </Badge>
              {onExport && (
                <div className="flex space-x-1">
                  <Button size="sm" variant="outline" onClick={() => onExport('PDF')}>
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    PDF
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onExport('Excel')}>
                    <DownloadIcon className="h-3 w-3 mr-1" />
                    Excel
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Weighted Average Valuation</p>
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {formatCurrency(valuation.valuationSummary.weightedValuation)}
                </p>
                <div className="flex items-center justify-center space-x-4 text-sm">
                  <span>Low: {formatCurrency(valuation.valuationSummary.valuationRange.low)}</span>
                  <span>High: {formatCurrency(valuation.valuationSummary.valuationRange.high)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Confidence Score</p>
              <div className="flex items-center space-x-2">
                <div className="text-2xl font-bold">
                  {valuation.valuationSummary.overallConfidence.toFixed(1)}/10
                </div>
                <div className="flex-1">
                  <Progress value={valuation.valuationSummary.overallConfidence * 10} className="h-2" />
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1">Methods Used</p>
              <p className="text-2xl font-bold">{valuation.valuationSummary.methodCount}</p>
              <p className="text-xs text-muted-foreground">valuation methods</p>
            </div>
          </div>

          <Separator className="my-4" />

          <div>
            <h4 className="text-sm font-medium mb-3">Implied Multiples</h4>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-muted-foreground">Revenue Multiple</p>
                <p className="text-lg font-bold">
                  {valuation.valuationSummary.impliedMultiples.revenueMultiple.toFixed(1)}x
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">EBITDA Multiple</p>
                <p className="text-lg font-bold">
                  {valuation.valuationSummary.impliedMultiples.ebitdaMultiple.toFixed(1)}x
                </p>
              </div>
              <div className="text-center">
                <p className="text-muted-foreground">Book Value Multiple</p>
                <p className="text-lg font-bold">
                  {valuation.valuationSummary.impliedMultiples.bookValueMultiple.toFixed(1)}x
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Valuation Methods */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Valuation by Method</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ValuationMethodCard
            method={valuation.valuationMethods.revenueMultiple}
            methodName="Revenue Multiple"
            icon={DollarSignIcon}
            color="bg-green-500"
          />
          <ValuationMethodCard
            method={valuation.valuationMethods.ebitdaMultiple}
            methodName="EBITDA Multiple"
            icon={BarChart3Icon}
            color="bg-blue-500"
          />
          <ValuationMethodCard
            method={valuation.valuationMethods.discountedCashFlow}
            methodName="Discounted Cash Flow"
            icon={TrendingUpIcon}
            color="bg-purple-500"
          />
          <ValuationMethodCard
            method={valuation.valuationMethods.assetBased}
            methodName="Asset-Based"
            icon={PieChartIcon}
            color="bg-orange-500"
          />
          <ValuationMethodCard
            method={valuation.valuationMethods.comparableCompany}
            methodName="Comparable Company"
            icon={TargetIcon}
            color="bg-indigo-500"
          />
          <ValuationMethodCard
            method={valuation.valuationMethods.precedentTransaction}
            methodName="Precedent Transaction"
            icon={TrendingDownIcon}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Analysis Tabs */}
      <Tabs defaultValue="sensitivity" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="sensitivity">Sensitivity</TabsTrigger>
          <TabsTrigger value="risks">Risk Factors</TabsTrigger>
          <TabsTrigger value="comparables">Comparables</TabsTrigger>
        </TabsList>

        <TabsContent value="sensitivity">
          <SensitivityChart analysis={valuation.sensitivityAnalysis} />
        </TabsContent>

        <TabsContent value="risks">
          <RiskFactors riskFactors={valuation.riskFactors} />
        </TabsContent>

        <TabsContent value="comparables">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Market Comparables</CardTitle>
            </CardHeader>
            <CardContent>
              {valuation.comparables.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Company</th>
                        <th className="text-right py-2">Market Cap</th>
                        <th className="text-right py-2">Revenue Multiple</th>
                        <th className="text-right py-2">EBITDA Multiple</th>
                        <th className="text-center py-2">Similarity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valuation.comparables.map((comp, index) => (
                        <tr key={index} className="border-b">
                          <td className="py-2 font-medium">{comp.companyName}</td>
                          <td className="text-right py-2">${comp.marketCap.toLocaleString()}</td>
                          <td className="text-right py-2">{comp.revenueMultiple.toFixed(1)}x</td>
                          <td className="text-right py-2">{comp.ebitdaMultiple.toFixed(1)}x</td>
                          <td className="text-center py-2">
                            <Progress value={comp.similarity} className="w-16 mx-auto" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No comparable companies data available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

/**
 * Main Valuation Calculator Component
 */
export const ValuationCalculator: React.FC<ValuationCalculatorProps> = ({
  companyId,
  initialData,
  onValuationComplete,
  className = ''
}) => {
  const [inputs, setInputs] = useState<FinancialInputs>({
    annualRevenue: 5000000,
    revenueGrowthRate: 25,
    grossProfit: 3750000,
    grossMargin: 75,
    ebitda: 1000000,
    ebitdaMargin: 20,
    netIncome: 750000,
    totalAssets: 7500000,
    totalLiabilities: 1500000,
    shareholdersEquity: 6000000,
    operatingCashFlow: 900000,
    freeCashFlow: 750000,
    industryType: 'SaaS',
    businessModel: 'B2B SaaS',
    marketPosition: 'Strong Competitor',
    employeeCount: 100,
    customersCount: 1000,
    ...initialData
  });

  const [valuation, setValuation] = useState<CompanyValuation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const calculateValuation = async () => {
    setIsCalculating(true);
    
    try {
      const result = await CompanyValuationBusinessService.calculateCompanyValuation(
        companyId || 'demo-company',
        inputs,
        {
          methods: ['revenue', 'ebitda', 'dcf', 'asset', 'comparable', 'transaction'],
          includeComparables: true,
          includeSensitivity: true
        }
      );
      
      setValuation(result);
      if (onValuationComplete) {
        onValuationComplete(result);
      }
    } catch (error) {
      console.error('Valuation calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleExport = (format: 'PDF' | 'Excel') => {
    // TODO: Implement export functionality
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <CalculatorIcon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Company Valuation Calculator</h2>
            <p className="text-muted-foreground">
              Multi-method valuation analysis with sensitivity and risk assessment
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2">
            <Label htmlFor="advanced-mode" className="text-sm">Advanced Mode</Label>
            <Switch
              id="advanced-mode"
              checked={showAdvanced}
              onCheckedChange={setShowAdvanced}
            />
          </div>
          
          <Button onClick={calculateValuation} disabled={isCalculating}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isCalculating ? 'animate-spin' : ''}`} />
            {isCalculating ? 'Calculating...' : 'Calculate Valuation'}
          </Button>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Inputs</CardTitle>
          <CardDescription>
            Enter your company's financial data for comprehensive valuation analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FinancialInputForm inputs={inputs} onChange={setInputs} />
        </CardContent>
      </Card>

      {/* Results */}
      {valuation && (
        <ValuationResults valuation={valuation} onExport={handleExport} />
      )}

      {/* Loading State */}
      {isCalculating && (
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <RefreshCwIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Calculating company valuation using multiple methods...
              </p>
              <p className="text-sm text-muted-foreground">
                This includes revenue multiples, DCF analysis, and comparable company analysis
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};