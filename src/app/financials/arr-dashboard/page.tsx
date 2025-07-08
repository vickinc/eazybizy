'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3Icon,
  LoaderIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  SettingsIcon,
  InfoIcon
} from 'lucide-react';
import { ARRDashboard } from '@/components/features/ARRDashboard';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { 
  SaaSMetricsData,
  SaaSBenchmarks,
  SaaSMetricsBusinessService
} from '@/services/business/saasMetricsBusinessService';
import { toast } from 'sonner';

export default function ARRDashboardPage() {
  // State management
  const [metricsData, setMetricsData] = useState<SaaSMetricsData | null>(null);
  const [benchmarks, setBenchmarks] = useState<SaaSBenchmarks | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const { companies, selectedCompany } = useCompanyFilter();

  // Get current company
  const currentCompany = companies.find(c => c.id === selectedCompany);

  // Initialize data
  useEffect(() => {
    if (currentCompany) {
      loadSaaSMetrics();
      loadBenchmarks();
    }
  }, [currentCompany]);

  const loadSaaSMetrics = async () => {
    if (!currentCompany) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const period = new Date().getFullYear().toString();
      const metrics = await SaaSMetricsBusinessService.calculateSaaSMetrics(
        currentCompany.id,
        period,
        true // Include cohort analysis
      );
      
      setMetricsData(metrics);
      toast.success('SaaS metrics calculated successfully');
    } catch (error) {
      console.error('Failed to load SaaS metrics:', error);
      setError('Failed to load SaaS metrics');
      toast.error('Failed to load SaaS metrics');
    } finally {
      setIsGenerating(false);
    }
  };

  const loadBenchmarks = async () => {
    try {
      const industryBenchmarks = SaaSMetricsBusinessService.getSaaSBenchmarks('SaaS');
      setBenchmarks(industryBenchmarks);
    } catch (error) {
      console.error('Failed to load benchmarks:', error);
    }
  };

  const handleRefresh = async () => {
    await loadSaaSMetrics();
  };

  const handleExport = async (format: 'PDF' | 'Excel') => {
    if (!metricsData) return;
    
    try {
      toast.info(`Exporting ARR dashboard to ${format}...`);
      // TODO: Implement actual export functionality
    } catch (error) {
      toast.error('Failed to export dashboard');
    }
  };

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  // No company selected
  if (!currentCompany) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BarChart3Icon className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ARR Dashboard</h1>
            <p className="text-muted-foreground">
              Track Annual Recurring Revenue and SaaS metrics
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">No Company Selected</h3>
                <p className="text-muted-foreground max-w-md">
                  Please select a company to view its ARR dashboard and SaaS metrics.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3Icon className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ARR Dashboard</h1>
              <p className="text-muted-foreground">
                {currentCompany.tradingName} - SaaS Metrics Analysis
              </p>
            </div>
          </div>

          <Button onClick={handleRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-16 w-16 mx-auto text-red-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-700">Error Loading Metrics</h3>
                <p className="text-muted-foreground">{error}</p>
              </div>
              <Button onClick={handleRefresh} variant="outline">
                <RefreshCwIcon className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Generating state
  if (isGenerating) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-100 rounded-lg">
            <BarChart3Icon className="h-8 w-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">ARR Dashboard</h1>
            <p className="text-muted-foreground">
              {currentCompany.tradingName} - SaaS Metrics Analysis
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Calculating SaaS metrics and generating ARR analysis...
              </p>
              <div className="text-sm text-muted-foreground">
                This includes ARR/MRR calculations, cohort analysis, and churn metrics
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Main dashboard
  if (!metricsData) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChart3Icon className="h-8 w-8 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ARR Dashboard</h1>
              <p className="text-muted-foreground">
                {currentCompany.tradingName} - SaaS Metrics Analysis
              </p>
            </div>
          </div>

          <Button onClick={loadSaaSMetrics}>
            <BarChart3Icon className="h-4 w-4 mr-2" />
            Generate Metrics
          </Button>
        </div>

        {/* Getting Started */}
        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <BarChart3Icon className="h-16 w-16 mx-auto text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Generate SaaS Metrics</h3>
                <p className="text-muted-foreground max-w-md">
                  Calculate comprehensive SaaS metrics including ARR, MRR, churn rates, cohort analysis, and unit economics for {currentCompany.tradingName}.
                </p>
              </div>
              <Button onClick={loadSaaSMetrics}>
                <BarChart3Icon className="h-4 w-4 mr-2" />
                Calculate Metrics
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <BarChart3Icon className="h-5 w-5 mr-2" />
                ARR & MRR Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Track Annual and Monthly Recurring Revenue with detailed movement analysis including new, expansion, contraction, and churned revenue.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <RefreshCwIcon className="h-5 w-5 mr-2" />
                Churn & Retention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive churn analysis with customer and revenue churn rates, cohort retention, and Net Revenue Retention (NRR) calculations.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <InfoIcon className="h-5 w-5 mr-2" />
                Unit Economics
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Customer Acquisition Cost (CAC), Lifetime Value (LTV), payback periods, and the Rule of 40 with industry benchmark comparisons.
              </p>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="container mx-auto py-6" suppressHydrationWarning>
      <ARRDashboard
        metricsData={metricsData}
        benchmarks={benchmarks || undefined}
        onRefresh={handleRefresh}
        onExport={handleExport}
      />
      </div>
    </div>
  );
} 