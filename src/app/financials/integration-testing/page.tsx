'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldCheckIcon,
  AlertCircleIcon,
  LoaderIcon,
  RefreshCwIcon,
  FileTextIcon,
  PlayIcon,
  SettingsIcon,
  InfoIcon
} from 'lucide-react';
import { IntegrationTestingDashboard } from '@/components/features/IntegrationTestingDashboard';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { 
  IntegratedFinancialStatements,
  FinancialStatementsIntegrationService
} from '@/services/integration/financialStatementsIntegrationService';
import { StatementPeriod } from '@/types/financialStatements.types';
import { toast } from 'sonner';

export default function IntegrationTestingPage() {
  // State management
  const [integratedStatements, setIntegratedStatements] = useState<IntegratedFinancialStatements | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const { companies, selectedCompany } = useCompanyFilter();

  // Get current company
  const currentCompany = companies.find(c => c.id === selectedCompany);

  // Initialize on company change
  useEffect(() => {
    if (currentCompany) {
      // Auto-generate statements when company changes
      generateIntegratedStatements();
    }
  }, [currentCompany]);

  const generateIntegratedStatements = async (): Promise<IntegratedFinancialStatements> => {
    if (!currentCompany) {
      throw new Error('No company selected');
    }
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const currentPeriod: StatementPeriod = {
        year: new Date().getFullYear(),
        month: 12,
        type: 'annual',
        startDate: new Date(new Date().getFullYear(), 0, 1),
        endDate: new Date(new Date().getFullYear(), 11, 31)
      };

      const statements = await FinancialStatementsIntegrationService.generateIntegratedStatements(
        currentCompany.id,
        currentPeriod,
        true, // Include business intelligence
        {
          version: 'IFRS 2023',
          reportingFramework: 'Full IFRS',
          functionalCurrency: 'USD',
          presentationCurrency: 'USD',
          roundingPolicy: 'Nearest Thousand',
          accountingPolicies: {
            inventoryValuation: 'FIFO',
            depreciationMethod: 'Straight Line',
            revenueRecognition: 'IFRS 15',
            leaseAccounting: 'IFRS 16',
            financialInstruments: 'IFRS 9'
          }
        },
        {
          companyName: currentCompany.tradingName,
          legalName: currentCompany.legalName,
          currency: 'USD',
          fiscalYearEnd: 'December',
          hasSubsidiaries: false,
          businessModel: 'SaaS',
          industry: 'Technology'
        }
      );
      
      setIntegratedStatements(statements);
      toast.success('Integrated financial statements generated successfully');
      return statements;
    } catch (error) {
      console.error('Failed to generate integrated statements:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate statements';
      setError(errorMessage);
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunTests = (statements: IntegratedFinancialStatements) => {
    toast.success('Integration tests completed');
  };

  const handleRefresh = async () => {
    await generateIntegratedStatements();
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
          <div className="p-2 bg-purple-100 rounded-lg">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integration Testing</h1>
            <p className="text-muted-foreground">
              Cross-statement validation and IFRS compliance testing
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
                  Please select a company to perform integration testing on its financial statements.
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Integration Testing</h1>
              <p className="text-muted-foreground">
                {currentCompany.tradingName} - Financial Statements Validation
              </p>
            </div>
          </div>

          <Button onClick={handleRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </div>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <AlertCircleIcon className="h-16 w-16 mx-auto text-red-500" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-red-700">Error Loading Integration Tests</h3>
                <p className="text-red-600">{error}</p>
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
  if (isGenerating && !integratedStatements) {
    return (
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integration Testing</h1>
            <p className="text-muted-foreground">
              {currentCompany.tradingName} - Financial Statements Validation
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="flex items-center justify-center py-20">
            <div className="text-center space-y-4">
              <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
              <p className="text-muted-foreground">
                Generating integrated financial statements and preparing validation tests...
              </p>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Generating Balance Sheet</p>
                <p>• Generating Income Statement</p>
                <p>• Generating Cash Flow Statement</p>
                <p>• Generating Statement of Changes in Equity</p>
                <p>• Generating Notes to Financial Statements</p>
                <p>• Running Cross-Statement Validation</p>
                <p>• Checking IFRS Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Integration Testing</h1>
            <p className="text-muted-foreground">
              {currentCompany.tradingName} - Financial Statements Validation & IFRS Compliance
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button onClick={handleRefresh} variant="outline" disabled={isGenerating}>
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Integration Info */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <InfoIcon className="h-5 w-5 text-blue-600 mt-0.5" />
            <div className="text-blue-800 text-sm">
              <strong>Integration Testing Overview:</strong> This comprehensive testing suite validates cross-statement consistency,
              performs IFRS compliance checks, and ensures data integrity across all financial statements. Tests include balance sheet
              equation verification, net income consistency, cash flow reconciliation, and regulatory compliance validation.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Features Overview */}
      {!integratedStatements && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <ShieldCheckIcon className="h-5 w-5 mr-2" />
                Cross-Statement Validation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ensures consistency of key figures across Balance Sheet, Income Statement, Cash Flow Statement, and Statement of Changes in Equity.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <FileTextIcon className="h-5 w-5 mr-2" />
                IFRS Compliance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Validates adherence to International Financial Reporting Standards including required disclosures and presentation requirements.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <PlayIcon className="h-5 w-5 mr-2" />
                Automated Testing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Comprehensive test suite with 8+ validation checks including mathematical accuracy, business logic, and regulatory compliance.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Dashboard */}
      <IntegrationTestingDashboard
        companyId={currentCompany.id}
        statements={integratedStatements || undefined}
        onRunTests={handleRunTests}
        onGenerateStatements={generateIntegratedStatements}
      />
      </div>
    </div>
  );
}