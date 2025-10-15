'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import ScaleIcon from "lucide-react/dist/esm/icons/scale";
import DownloadIcon from "lucide-react/dist/esm/icons/download";
import RefreshCwIcon from "lucide-react/dist/esm/icons/refresh-cw";
import SettingsIcon from "lucide-react/dist/esm/icons/settings";
import AlertCircleIcon from "lucide-react/dist/esm/icons/alert-circle";
import CheckCircleIcon from "lucide-react/dist/esm/icons/check-circle";
import LoaderIcon from "lucide-react/dist/esm/icons/loader";
import InfoIcon from "lucide-react/dist/esm/icons/info";
import { StatementOfChangesInEquity } from '@/components/features/StatementOfChangesInEquity';
import { FinancialPeriodSelector } from '@/components/features/FinancialPeriodSelector';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { SettingsStorageService } from '@/services/storage/settingsStorageService';
import { StatementOfChangesInEquityBusinessService } from '@/services/business/statementOfChangesInEquityBusinessService';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import { StatementPeriod, EquityChangesData, StatementCalculationResult } from '@/types/financialStatements.types';
import { toast } from 'sonner';

export default function EquityChangesPage() {
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
  const [isGenerating, setIsGenerating] = useState(false);
  const [equityChangesData, setEquityChangesData] = useState<StatementCalculationResult<EquityChangesData> | null>(null);
  
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

  // Generate Statement of Changes in Equity
  const generateEquityChanges = async () => {
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
      const result = await StatementOfChangesInEquityBusinessService.generateStatementOfChangesInEquity(
        selectedPeriod,
        showComparatives ? priorPeriod || undefined : undefined,
        settings.ifrs,
        companySettings
      );

      setEquityChangesData(result);

      // Check for validation issues
      const errors = result.validation.filter(v => v.severity === 'error');
      const warnings = result.validation.filter(v => v.severity === 'warning');

      if (errors.length > 0) {
        toast.error(`Statement of Changes in Equity generated with ${errors.length} error(s). Please review the validation results.`);
      } else if (warnings.length > 0) {
        toast.warning(`Statement generated with ${warnings.length} warning(s).`);
      } else {
        toast.success('Statement of Changes in Equity generated successfully');
      }
    } catch (error) {
      console.error('Failed to generate Statement of Changes in Equity:', error);
      toast.error('Failed to generate statement. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Export handlers
  const handleExport = async (format: 'PDF' | 'Excel') => {
    if (!equityChangesData) return;

    try {
      // TODO: Implement actual export functionality
      toast.info(`Exporting Statement of Changes in Equity to ${format}...`);
    } catch (error) {
      toast.error('Failed to export statement.');
    }
  };

  // Auto-generate when period changes
  useEffect(() => {
    if (selectedPeriod && companySettings) {
      generateEquityChanges();
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
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ScaleIcon className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Statement of Changes in Equity</h1>
            <p className="text-muted-foreground">
              IFRS-compliant equity movements analysis (IAS 1)
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateEquityChanges()}
            disabled={!selectedPeriod || isGenerating}
          >
            <RefreshCwIcon className={`h-4 w-4 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
            Regenerate
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
            statementType="EquityChanges"
          />

          {/* IFRS Compliance Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center">
                <InfoIcon className="h-4 w-4 mr-2" />
                IFRS Compliance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-xs text-muted-foreground space-y-2">
                <p><strong>IAS 1.106:</strong> Present changes in equity for each component</p>
                <p><strong>IAS 1.107:</strong> Show movements between opening and closing balances</p>
                <p><strong>IAS 1.108:</strong> Include comprehensive income attribution</p>
                <p><strong>IFRS 2:</strong> Share-based payment transactions</p>
              </div>
              <Badge variant="outline" className="w-full justify-center py-2">
                IFRS Compliant
              </Badge>
            </CardContent>
          </Card>

          {/* Validation Summary */}
          {equityChangesData && equityChangesData.validation.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Validation Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {equityChangesData.validation.map((validation, index) => (
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
                    {index < equityChangesData.validation.length - 1 && (
                      <Separator className="my-2" />
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Key Equity Metrics */}
          {equityChangesData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Equity Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Opening Equity</span>
                  <span className="text-sm font-medium">
                    {equityChangesData.data.totalEquity.openingBalanceFormatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Movements</span>
                  <span className={`text-sm font-medium ${
                    equityChangesData.data.totalEquity.totalMovements >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {equityChangesData.data.totalEquity.totalMovementsFormatted}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Closing Equity</span>
                  <span className="text-sm font-medium">
                    {equityChangesData.data.totalEquity.closingBalanceFormatted}
                  </span>
                </div>
                
                {showComparatives && equityChangesData.data.totalEquity.priorYearClosing && (
                  <>
                    <Separator />
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Prior Year</span>
                      <span className="text-sm font-medium">
                        {equityChangesData.data.totalEquity.priorYearClosingFormatted}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">Year-on-Year</span>
                      <span className={`text-sm font-medium ${
                        (equityChangesData.data.totalEquity.variance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {equityChangesData.data.totalEquity.variancePercent?.toFixed(1)}%
                      </span>
                    </div>
                  </>
                )}

                <Separator />
                <div className="flex items-center space-x-2 pt-1">
                  {equityChangesData.data.reconciliation.balanceSheetEquityMatches ? (
                    <>
                      <CheckCircleIcon className="h-3 w-3 text-green-500" />
                      <span className="text-xs text-green-600">Reconciled with Balance Sheet</span>
                    </>
                  ) : (
                    <>
                      <AlertCircleIcon className="h-3 w-3 text-red-500" />
                      <span className="text-xs text-red-600">
                        Reconciliation Issue: {equityChangesData.data.reconciliation.formattedDifference}
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content - Statement of Changes in Equity */}
        <div className="lg:col-span-3">
          {isGenerating ? (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <LoaderIcon className="h-10 w-10 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Generating Statement of Changes in Equity...
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : equityChangesData ? (
            <StatementOfChangesInEquity
              data={equityChangesData.data}
              showComparatives={showComparatives}
              showVariances={true}
              onExport={handleExport}
            />
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center py-20">
                <div className="text-center space-y-4">
                  <ScaleIcon className="h-10 w-10 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-lg font-medium">No Statement Generated</p>
                    <p className="text-muted-foreground">
                      Select a reporting period to generate your Statement of Changes in Equity
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