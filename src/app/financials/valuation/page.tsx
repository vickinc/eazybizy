'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  TrendingUpIcon,
  AlertTriangleIcon,
  TargetIcon,
  CalculatorIcon,
  LoaderIcon,
  InfoIcon,
  DollarSignIcon,
  BarChart3Icon,
  PieChartIcon,
  BookOpenIcon,
  HistoryIcon
} from 'lucide-react';
import { ValuationCalculator } from '@/components/features/ValuationCalculator';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { 
  CompanyValuation,
  FinancialInputs,
  CompanyValuationBusinessService
} from '@/services/business/companyValuationBusinessService';
import { toast } from 'sonner';

export default function ValuationPage() {
  // State management
  const [currentValuation, setCurrentValuation] = useState<CompanyValuation | null>(null);
  const [valuationHistory, setValuationHistory] = useState<CompanyValuation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  
  // Hooks
  const { companies, selectedCompany } = useCompanyFilter();

  // Get current company
  const currentCompany = companies.find(c => c.id === selectedCompany);

  // Load valuation history
  useEffect(() => {
    if (currentCompany) {
      loadValuationHistory();
    } else {
      // Initial load when no company selected
      const timer = setTimeout(() => {
        setIsLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [currentCompany]);

  const loadValuationHistory = async () => {
    setIsLoading(true);
    // Mock valuation history - in production, load from storage
    const mockHistory: CompanyValuation[] = [];
    setValuationHistory(mockHistory);
    setIsLoading(false);
  };

  const handleValuationComplete = (valuation: CompanyValuation) => {
    setCurrentValuation(valuation);
    setValuationHistory(prev => [valuation, ...prev.slice(0, 9)]); // Keep last 10
    toast.success('Company valuation completed successfully');
  };

  const getIndustryInfo = (industry: string) => {
    const industryData: { [key: string]: { description: string; typicalMultiples: string; keyFactors: string[] } } = {
      'SaaS': {
        description: 'Software as a Service companies with recurring revenue models',
        typicalMultiples: '4-15x Revenue, 15-40x EBITDA',
        keyFactors: ['Recurring revenue', 'Growth rate', 'Churn rate', 'Unit economics']
      },
      'Technology': {
        description: 'Technology companies including software, hardware, and services',
        typicalMultiples: '2-10x Revenue, 10-30x EBITDA',
        keyFactors: ['Innovation', 'Market position', 'Scalability', 'IP portfolio']
      },
      'Manufacturing': {
        description: 'Companies involved in production and manufacturing',
        typicalMultiples: '0.5-3x Revenue, 5-15x EBITDA',
        keyFactors: ['Asset efficiency', 'Supply chain', 'Margins', 'Capacity utilization']
      },
      'Healthcare': {
        description: 'Healthcare services, devices, and pharmaceutical companies',
        typicalMultiples: '1-6x Revenue, 8-25x EBITDA',
        keyFactors: ['Regulatory compliance', 'Clinical outcomes', 'Market access', 'Innovation']
      }
    };
    
    return industryData[industry] || industryData['Technology'];
  };

  if (!currentCompany) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <TargetIcon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Valuation</h1>
            <p className="text-muted-foreground">
              Multi-method valuation analysis and calculator
            </p>
          </div>
        </div>

        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-amber-800 text-sm">
                <strong>Important Disclaimer:</strong> These valuations are estimates for analytical purposes only and are not certified financial valuations. 
                Always consult with professional valuation experts and financial advisors for official business valuations, investment decisions, or legal proceedings.
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <TargetIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Company Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Please select a company to perform valuation analysis and access the valuation calculator.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  if (showCalculator) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="container mx-auto py-6" suppressHydrationWarning>
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowCalculator(false)}>
            ← Back to Overview
          </Button>
        </div>
        
        <ValuationCalculator
          companyId={currentCompany.id}
          onValuationComplete={handleValuationComplete}
        />
        </div>
      </div>
    );
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-red-100 rounded-lg">
            <TargetIcon className="h-8 w-8 text-red-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Valuation</h1>
            <p className="text-muted-foreground">
              {currentCompany.tradingName} - Multi-method valuation analysis
            </p>
          </div>
        </div>

        <Button onClick={() => setShowCalculator(true)}>
          <CalculatorIcon className="h-4 w-4 mr-2" />
          Open Calculator
        </Button>
      </div>

      {/* Important Disclaimer */}
      <Card className="border-amber-200 bg-amber-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangleIcon className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="text-amber-800 text-sm">
              <strong>Important Disclaimer:</strong> These valuations are estimates for analytical purposes only and are not certified financial valuations. 
              Always consult with professional valuation experts and financial advisors for official business valuations, investment decisions, or legal proceedings.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Valuation Summary */}
      {currentValuation && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Valuation Summary</CardTitle>
            <CardDescription>
              Generated on {currentValuation.generatedAt.toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Weighted Valuation</p>
                <p className="text-3xl font-bold text-blue-600">
                  ${currentValuation.valuationSummary.weightedValuation.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Valuation Range</p>
                <p className="text-sm">
                  ${currentValuation.valuationSummary.valuationRange.low.toLocaleString()} - 
                  ${currentValuation.valuationSummary.valuationRange.high.toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Revenue Multiple</p>
                <p className="text-xl font-bold">
                  {currentValuation.valuationSummary.impliedMultiples.revenueMultiple.toFixed(1)}x
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Confidence Score</p>
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-xl font-bold">
                    {currentValuation.valuationSummary.overallConfidence.toFixed(1)}/10
                  </span>
                  <Badge className={
                    currentValuation.valuationSummary.dataQuality === 'High' ? 'bg-green-100 text-green-800' :
                    currentValuation.valuationSummary.dataQuality === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }>
                    {currentValuation.valuationSummary.dataQuality}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="methods">Methods</TabsTrigger>
          <TabsTrigger value="industry">Industry Guide</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {currentValuation ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Valuation Methods Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Valuation Methods Used</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(currentValuation.valuationMethods).map(([key, method]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between p-2 rounded bg-gray-50">
                        <span className="text-sm font-medium">{method.method}</span>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm">${method.valuationRange.median.toLocaleString()}</span>
                          <Badge variant="outline" className="text-xs">
                            {(method.weight * 100).toFixed(0)}% weight
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Risk Factors */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  {currentValuation.riskFactors.length > 0 ? (
                    <div className="space-y-2">
                      {currentValuation.riskFactors.slice(0, 3).map((risk, index) => (
                        <div key={index} className="flex items-start space-x-2 p-2 rounded bg-gray-50">
                          <AlertTriangleIcon className={`h-4 w-4 mt-0.5 ${
                            risk.impact === 'High' ? 'text-red-500' :
                            risk.impact === 'Medium' ? 'text-yellow-500' :
                            'text-green-500'
                          }`} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{risk.factor}</p>
                            <p className="text-xs text-muted-foreground">{risk.description}</p>
                          </div>
                          <Badge className={`text-xs ${
                            risk.impact === 'High' ? 'bg-red-100 text-red-800' :
                            risk.impact === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {risk.impact}
                          </Badge>
                        </div>
                      ))}
                      {currentValuation.riskFactors.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{currentValuation.riskFactors.length - 3} more risk factors
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-muted-foreground">No significant risk factors identified</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Getting Started Cards */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <CalculatorIcon className="h-5 w-5 mr-2" />
                    Valuation Calculator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Use our comprehensive calculator with 6 different valuation methods including revenue multiples, DCF, and comparable analysis.
                  </p>
                  <Button className="w-full" onClick={() => setShowCalculator(true)}>
                    <CalculatorIcon className="h-4 w-4 mr-2" />
                    Start Valuation
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <BarChart3Icon className="h-5 w-5 mr-2" />
                    Multiple Methods
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Revenue multiples, EBITDA multiples, DCF analysis, asset-based valuation, comparable company analysis, and precedent transactions.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center">
                    <PieChartIcon className="h-5 w-5 mr-2" />
                    Risk Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Comprehensive risk factor identification, sensitivity analysis, and scenario modeling with confidence scoring.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        <TabsContent value="methods">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Valuation Method Explanations */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <DollarSignIcon className="h-5 w-5 mr-2" />
                  Revenue Multiple
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Method:</strong> Company Value = Revenue × Industry Multiple</p>
                <p><strong>Best for:</strong> Growth companies, SaaS businesses</p>
                <p><strong>Pros:</strong> Simple, market-based, good for unprofitable companies</p>
                <p><strong>Cons:</strong> Ignores profitability and asset base</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <BarChart3Icon className="h-5 w-5 mr-2" />
                  EBITDA Multiple
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Method:</strong> Company Value = EBITDA × Industry Multiple</p>
                <p><strong>Best for:</strong> Profitable, mature companies</p>
                <p><strong>Pros:</strong> Considers profitability, widely used</p>
                <p><strong>Cons:</strong> Requires positive EBITDA, ignores capex needs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <TrendingUpIcon className="h-5 w-5 mr-2" />
                  Discounted Cash Flow
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Method:</strong> Present value of future cash flows</p>
                <p><strong>Best for:</strong> Stable, predictable businesses</p>
                <p><strong>Pros:</strong> Intrinsic value, detailed analysis</p>
                <p><strong>Cons:</strong> Many assumptions, sensitive to inputs</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2" />
                  Asset-Based
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Method:</strong> Adjusted book value of assets</p>
                <p><strong>Best for:</strong> Asset-heavy businesses, liquidation scenarios</p>
                <p><strong>Pros:</strong> Conservative, tangible basis</p>
                <p><strong>Cons:</strong> Ignores intangibles and earning power</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <TargetIcon className="h-5 w-5 mr-2" />
                  Comparable Company
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Method:</strong> Multiples from similar public companies</p>
                <p><strong>Best for:</strong> Companies with public comparables</p>
                <p><strong>Pros:</strong> Market-based, current valuations</p>
                <p><strong>Cons:</strong> Requires liquidity discount, limited comparables</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center">
                  <BookOpenIcon className="h-5 w-5 mr-2" />
                  Precedent Transaction
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <p><strong>Method:</strong> Multiples from M&A transactions</p>
                <p><strong>Best for:</strong> Acquisition scenarios</p>
                <p><strong>Pros:</strong> Includes control premium, transaction-based</p>
                <p><strong>Cons:</strong> Historical data, limited transaction data</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="industry">
          <div className="space-y-6">
            {['SaaS', 'Technology', 'Manufacturing', 'Healthcare'].map(industry => {
              const info = getIndustryInfo(industry);
              return (
                <Card key={industry}>
                  <CardHeader>
                    <CardTitle className="text-base">{industry} Industry</CardTitle>
                    <CardDescription>{info.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Typical Valuation Multiples</h4>
                        <p className="text-sm text-muted-foreground">{info.typicalMultiples}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium mb-2">Key Valuation Factors</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {info.keyFactors.map((factor, index) => (
                            <li key={index} className="flex items-center">
                              <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <HistoryIcon className="h-5 w-5 mr-2" />
                Valuation History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {valuationHistory.length > 0 ? (
                <div className="space-y-3">
                  {valuationHistory.map((valuation, index) => (
                    <div key={index} className="flex items-center justify-between p-3 rounded border">
                      <div>
                        <p className="font-medium">${valuation.valuationSummary.weightedValuation.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground">
                          {valuation.generatedAt.toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm">{valuation.valuationSummary.impliedMultiples.revenueMultiple.toFixed(1)}x Revenue</p>
                        <Badge className="text-xs">
                          {valuation.valuationSummary.dataQuality} Quality
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <HistoryIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No valuation history available</p>
                  <p className="text-sm">Complete your first valuation to see history here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
} 