'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSignIcon, 
  DownloadIcon, 
  RefreshCwIcon, 
  SettingsIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  LoaderIcon,
  ToggleLeftIcon,
  ToggleRightIcon
} from 'lucide-react';
import { CashFlowStatement } from '@/components/features/CashFlowStatement';
import { FinancialPeriodSelector } from '@/components/features/FinancialPeriodSelector';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { SettingsStorageService } from '@/services/storage/settingsStorageService';
import { FinancialStatementsIntegrationService } from '@/services/business/financialStatementsIntegrationService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { StatementPeriod, CashFlowData, StatementCalculationResult } from '@/types/financialStatements.types';
import { toast } from 'sonner';

export default function CashFlowPage() {
  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<StatementPeriod | null>(null);

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced delay, let delayed hook handle the rest
    
    return () => clearTimeout(timer);
  }, []);
  const [priorPeriod, setPriorPeriod] = useState<StatementPeriod | null>(null);
  const [showComparatives, setShowComparatives] = useState(true);
  const [cashFlowMethod, setCashFlowMethod] = useState<'direct' | 'indirect'>('indirect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [cashFlowData, setCashFlowData] = useState<StatementCalculationResult<CashFlowData> | null>(null);
  
  // Hooks
  const { companies, selectedCompany } = useCompanyFilter();
  const [settings] = useState(() => ({
    ifrs: SettingsStorageService.getIFRSSettings()
  }));

  // Get current company settings
  const currentCompany = companies.find(c => c.id === selectedCompany);
  const companySettings = currentCompany ? {
    companyId: currentCompany.id,
    companyName: currentCompany.tradingName,
    registrationNumber: currentCompany.registrationNumber || undefined,
    taxId: currentCompany.vatNumber || undefined,
    address: currentCompany.address || undefined,
    country: currentCompany.country || undefined,
    functionalCurrency: currentCompany.currency || 'USD'
  } : undefined;

  // Generate Cash Flow Statement
  const generateCashFlow = async () => {
    if (!selectedPeriod) {
      toast.error('Please select a reporting period');
      return;
    }

    if (!companySettings) {
      toast.error('Please select a company');
      return;
    }

    setIsGenerating(true);
    
    try {
      const result = await FinancialStatementsIntegrationService.generateCashFlow(
        selectedPeriod,
        showComparatives ? priorPeriod || undefined : undefined,
        settings.ifrs,
        companySettings,
        cashFlowMethod
      );

      setCashFlowData(result);

      // Check for validation issues
      const errors = result.validation.filter(v => v.severity === 'error');
      const warnings = result.validation.filter(v => v.severity === 'warning');

      if (errors.length > 0) {
        toast.error(`Cash Flow Statement generated with ${errors.length} error(s). Please review the validation results.`);
      } else if (warnings.length > 0) {
        toast.warning(`Statement generated with ${warnings.length} warning(s).`);
      } else {
        toast.success('Cash Flow Statement generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate cash flow statement:', error);
      toast.error('Failed to generate cash flow statement. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export handlers
  const handleExport = async (format: 'PDF' | 'Excel') => {
    if (!cashFlowData) return;

    try {
      // TODO: Implement actual export functionality
      toast.info(`Exporting cash flow statement to ${format}...`);
    } catch (error) {
      toast.error('Failed to export cash flow statement.');
    }
  };

  // Toggle method handler
  const handleToggleMethod = () => {
    const newMethod = cashFlowMethod === 'indirect' ? 'direct' : 'indirect';
    setCashFlowMethod(newMethod);
    
    // Regenerate with new method if we have a period selected
    if (selectedPeriod && companySettings) {
      generateCashFlow();
    }
  };

  // Auto-generate when period or method changes
  useEffect(() => {
    if (selectedPeriod && companySettings) {
      generateCashFlow();
    }
  }, [selectedPeriod, priorPeriod, showComparatives, cashFlowMethod]);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6" suppressHydrationWarning>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <DollarSignIcon className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Cash Flow Statement</h1>
            <p className="text-muted-foreground">
              Statement of Cash Flows - IFRS Compliant (IAS 7)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-2 p-1 bg-muted rounded-lg">
            <Button
              variant={cashFlowMethod === 'indirect' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCashFlowMethod('indirect')}
              className="h-7"
            >
              Indirect
            </Button>
            <Button
              variant={cashFlowMethod === 'direct' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCashFlowMethod('direct')}
              className="h-7"
            >
              Direct
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => generateCashFlow()}
            disabled={!selectedPeriod || isGenerating}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/accounting/accounting-settings'}
          >
            <SettingsIcon className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Period Selection */}
        <div className="lg:col-span-1 space-y-6">
          <FinancialPeriodSelector
            selectedPeriod={selectedPeriod}
            priorPeriod={priorPeriod}
            onPeriodChange={setSelectedPeriod}
            onPriorPeriodChange={setPriorPeriod}
            showComparatives={showComparatives}
            onShowComparativesChange={setShowComparatives}
            statementType="CashFlow"
          />

          {/* Method Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cash Flow Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant="outline" className="w-full justify-center py-2">
                {cashFlowMethod.charAt(0).toUpperCase() + cashFlowMethod.slice(1)} Method
              </Badge>
              <p className="text-xs text-muted-foreground">
                {cashFlowMethod === 'indirect' 
                  ? 'Starts with net profit and adjusts for non-cash items and working capital changes.'
                  : 'Shows actual cash receipts and payments from operating activities.'}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleToggleMethod}
                className="w-full"
              >
                {cashFlowMethod === 'indirect' ? (
                  <>
                    <ToggleRightIcon className="h-4 w-4 mr-2" />
                    Switch to Direct
                  </>
                ) : (
                  <>
                    <ToggleLeftIcon className="h-4 w-4 mr-2" />
                    Switch to Indirect
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Validation Summary */}
          {cashFlowData && cashFlowData.validation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {cashFlowData.validation.map((validation, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-start space-x-2">
                      {validation.severity === 'error' ? (
                        <AlertCircleIcon className="h-4 w-4 text-red-500 mt-0.5" />
                      ) : validation.severity === 'warning' ? (
                        <AlertCircleIcon className="h-4 w-4 text-amber-500 mt-0.5" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-blue-500 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">{validation.message}</p>
                        {validation.suggestion && (
                          <p className="text-xs text-muted-foreground">{validation.suggestion}</p>
                        )}
                        {validation.ifrsReference && (
                          <Badge variant="outline" className="text-xs mt-1">
                            {validation.ifrsReference}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {index < cashFlowData.validation.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          {cashFlowData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Cash Flow Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Operating Activities</span>
                  <span className={`text-sm font-medium ${
                    cashFlowData.data.operatingActivities.total >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cashFlowData.data.operatingActivities.formattedTotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Investing Activities</span>
                  <span className={`text-sm font-medium ${
                    cashFlowData.data.investingActivities.total >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cashFlowData.data.investingActivities.formattedTotal}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Financing Activities</span>
                  <span className={`text-sm font-medium ${
                    cashFlowData.data.financingActivities.total >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cashFlowData.data.financingActivities.formattedTotal}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span className="text-sm">Net Cash Flow</span>
                  <span className={`text-sm ${
                    cashFlowData.data.netCashFlow.current >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {cashFlowData.data.netCashFlow.formatted}
                  </span>
                </div>
                <Separator />
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Opening Cash</span>
                    <span className="text-xs font-medium">
                      {cashFlowData.data.cashReconciliation.formattedOpeningCash}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Closing Cash</span>
                    <span className="text-xs font-medium">
                      {cashFlowData.data.cashReconciliation.formattedClosingCash}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 pt-1">
                    {cashFlowData.data.cashReconciliation.isReconciled ? (
                      <>
                        <CheckCircleIcon className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">Reconciled</span>
                      </>
                    ) : (
                      <>
                        <AlertCircleIcon className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">
                          Difference: {cashFlowData.data.cashReconciliation.formattedDifference}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Cash Flow Statement */}
        <div className="lg:col-span-3">
          {isGenerating ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Generating cash flow statement ({cashFlowMethod} method)...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : cashFlowData ? (
            <CashFlowStatement
              data={cashFlowData.data}
              showComparatives={showComparatives}
              showVariances={true}
              onExport={handleExport}
              onToggleMethod={handleToggleMethod}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <DollarSignIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">No Cash Flow Statement Generated</p>
                    <p className="text-muted-foreground">
                      Select a reporting period to generate your cash flow statement
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}