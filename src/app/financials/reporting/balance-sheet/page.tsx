'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Building2Icon from "lucide-react/dist/esm/icons/building-2";
import DownloadIcon from "lucide-react/dist/esm/icons/download";
import RefreshCwIcon from "lucide-react/dist/esm/icons/refresh-cw";
import SettingsIcon from "lucide-react/dist/esm/icons/settings";
import AlertCircleIcon from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircleIcon from "lucide-react/dist/esm/icons/check-circle";
import LoaderIcon from "lucide-react/dist/esm/icons/loader";
import { BalanceSheetStatement } from '@/components/features/BalanceSheetStatement';
import { FinancialPeriodSelector } from '@/components/features/FinancialPeriodSelector';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { SettingsStorageService } from '@/services/storage/settingsStorageService';
import { FinancialStatementsIntegrationService } from '@/services/business/financialStatementsIntegrationService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { StatementPeriod, BalanceSheetData, StatementCalculationResult } from '@/types/financialStatements.types';
import { toast } from 'sonner';

export default function BalanceSheetPage() {
  // State management
  const [selectedPeriod, setSelectedPeriod] = useState<StatementPeriod | null>(null);
  const [priorPeriod, setPriorPeriod] = useState<StatementPeriod | null>(null);
  const [showComparatives, setShowComparatives] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [balanceSheetData, setBalanceSheetData] = useState<StatementCalculationResult<BalanceSheetData> | null>(null);

  useEffect(() => {
    // Initial page load
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100); // Reduced delay, let delayed hook handle the rest
    
    return () => clearTimeout(timer);
  }, []);
  
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

  // Generate Balance Sheet
  const generateBalanceSheet = async () => {
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
      const result = await FinancialStatementsIntegrationService.generateBalanceSheet(
        selectedPeriod,
        showComparatives ? priorPeriod || undefined : undefined,
        settings.ifrs,
        companySettings
      );

      setBalanceSheetData(result);

      // Check for validation issues
      const errors = result.validation.filter(v => v.severity === 'error');
      const warnings = result.validation.filter(v => v.severity === 'warning');

      if (errors.length > 0) {
        toast.error(`Balance Sheet generated with ${errors.length} error(s). Please review the validation results.`);
      } else if (warnings.length > 0) {
        toast.warning(`Statement generated with ${warnings.length} warning(s).`);
      } else {
        toast.success('Balance Sheet generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate balance sheet:', error);
      toast.error('Failed to generate balance sheet. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export handlers
  const handleExport = async (format: 'PDF' | 'Excel') => {
    if (!balanceSheetData) return;

    try {
      // TODO: Implement actual export functionality
      toast.info(`Exporting balance sheet to ${format}...`);
    } catch (error) {
      toast.error('Failed to export balance sheet.');
    }
  };

  // Auto-generate when period changes
  useEffect(() => {
    if (selectedPeriod && companySettings) {
      generateBalanceSheet();
    }
  }, [selectedPeriod, priorPeriod, showComparatives]);

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
          <div className="p-2 bg-blue-100 rounded-lg">
            <Building2Icon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Balance Sheet</h1>
            <p className="text-muted-foreground">
              Statement of Financial Position - IFRS Compliant
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateBalanceSheet()}
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
            statementType="BalanceSheet"
          />

          {/* Validation Summary */}
          {balanceSheetData && balanceSheetData.validation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {balanceSheetData.validation.map((validation, index) => (
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
                    {index < balanceSheetData.validation.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Metrics */}
          {balanceSheetData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Key Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Assets</span>
                  <span className="text-sm font-medium">
                    {balanceSheetData.data.assets.totalAssets.formatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Liabilities</span>
                  <span className="text-sm font-medium">
                    {balanceSheetData.data.liabilities.totalLiabilities.formatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Equity</span>
                  <span className="text-sm font-medium">
                    {balanceSheetData.data.equity.totalEquity.formatted}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Current Ratio</span>
                  <span className="text-sm font-medium">
                    {balanceSheetData.data.assets.currentAssets.total > 0 && balanceSheetData.data.liabilities.currentLiabilities.total > 0
                      ? (balanceSheetData.data.assets.currentAssets.total / balanceSheetData.data.liabilities.currentLiabilities.total).toFixed(2)
                      : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Debt to Equity</span>
                  <span className="text-sm font-medium">
                    {balanceSheetData.data.equity.totalEquity.current > 0
                      ? (balanceSheetData.data.liabilities.totalLiabilities.current / balanceSheetData.data.equity.totalEquity.current).toFixed(2)
                      : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Balance Sheet Statement */}
        <div className="lg:col-span-3">
          {isGenerating ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Generating balance sheet...</p>
                </div>
              </CardContent>
            </Card>
          ) : balanceSheetData ? (
            <BalanceSheetStatement
              data={balanceSheetData.data}
              showComparatives={showComparatives}
              showVariances={true}
              onExport={handleExport}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <Building2Icon className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">No Balance Sheet Generated</p>
                    <p className="text-muted-foreground">
                      Select a reporting period to generate your balance sheet
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