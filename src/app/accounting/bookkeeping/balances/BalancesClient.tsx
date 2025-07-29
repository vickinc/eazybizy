"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Download from "lucide-react/dist/esm/icons/download";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useBalanceManagementDB } from "@/hooks/useBalanceManagementDB";
import { BalanceFilterBar } from "@/components/features/BalanceFilterBar";
import { BalanceStats } from "@/components/features/BalanceStats";
import { BalanceList } from "@/components/features/BalanceList";
import { ManualBalanceDialog } from "@/components/features/ManualBalanceDialog";
import { BalancesSummaryDialog } from "@/components/features/BalancesSummaryDialog";
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { AccountBalance } from '@/types/balance.types';

export default function BalancesClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<AccountBalance | undefined>();
  const [isManualBalanceDialogOpen, setIsManualBalanceDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatches by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    balances,
    groupedBalances,
    summary,
    isLoading,
    isError,
    error,
    filters,
    validation,
    // Filter actions
    updateFilters,
    resetFilters,
    // Initial balance actions
    saveInitialBalance,
    // Utility actions
    loadBalances,
    exportBalances,
    clearError,
    // Computed values
    hasBalances,
    filteredCount
  } = useBalanceManagementDB(globalSelectedCompany, companies);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Memoized retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  const handleEditInitialBalance = (accountId: string, accountType: 'bank' | 'wallet') => {
    const accountBalance = balances.find(
      b => b.account.id === accountId && 
           (('bankName' in b.account || 'iban' in b.account) ? 'bank' : 'wallet') === accountType
    );
    
    if (accountBalance) {
      setSelectedAccountBalance(accountBalance);
      setIsManualBalanceDialogOpen(true);
    }
  };

  const handleSaveInitialBalance = async (
    accountId: string,
    accountType: 'bank' | 'wallet',
    amount: number,
    currency: string,
    companyId: number,
    notes?: string
  ) => {
    await saveInitialBalance(accountId, accountType, amount, currency, companyId, notes);
  };

  const handleCloseManualBalanceDialog = () => {
    setIsManualBalanceDialogOpen(false);
    setSelectedAccountBalance(undefined);
  };

  const handleOpenSummaryDialog = () => {
    setIsSummaryDialogOpen(true);
  };

  const handleCloseSummaryDialog = () => {
    setIsSummaryDialogOpen(false);
  };

  const handleExport = (format: 'csv' | 'json' = 'csv') => {
    const data = exportBalances(format);
    const blob = new Blob([data], { 
      type: format === 'csv' ? 'text/csv' : 'application/json' 
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `balances-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Handle initial loading state
  if (showLoader && balances.length === 0) {
    return <LoadingScreen />;
  }

  // Handle error state
  if (isError) {
    return (
      <ErrorBoundary level="page">
        <div className="min-h-screen bg-lime-50 flex items-center justify-center">
          <div className="text-center">
            <Landmark className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Balances</h3>
            <p className="text-sm text-gray-600 mb-4">{error?.message || 'Failed to load balances'}</p>
            <Button 
              onClick={handleRetry} 
              className="bg-black hover:bg-gray-800 text-white"
            >
              Retry
            </Button>
          </div>
        </div>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary level="page">
      <ApiErrorBoundary onRetry={handleRetry}>
        <div className="min-h-screen bg-lime-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Landmark className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    {!isHydrated 
                      ? 'Account Balances'
                      : globalSelectedCompany === 'all' 
                        ? 'Account Balances' 
                        : (() => {
                            const company = companies.find(c => c.id === globalSelectedCompany);
                            return company ? `${company.tradingName} - Balances` : 'Account Balances';
                          })()
                    }
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {!isHydrated 
                      ? 'View and manage account balances'
                      : globalSelectedCompany === 'all' 
                        ? 'View and manage account balances across all companies' 
                        : (() => {
                            const company = companies.find(c => c.id === globalSelectedCompany);
                            return company 
                              ? `Account balances for ${company.tradingName}` 
                              : 'View and manage account balances';
                          })()
                    }
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={loadBalances}
                  disabled={isLoading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                
                {hasBalances && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport('csv')}
                    disabled={isLoading}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                )}
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error.message}</span>
                  <Button variant="ghost" size="sm" onClick={clearError}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Validation Warnings */}
            {validation.warnings.length > 0 && (
              <Alert className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div>
                    <p className="font-medium">Data Quality Warnings:</p>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {validation.warnings.map((warning, index) => (
                        <li key={index}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {/* Balance Statistics */}
            {hasBalances && (
              <BalanceStats
                summary={summary}
                loading={isLoading}
                onSummaryClick={handleOpenSummaryDialog}
              />
            )}

            {/* Filters */}
            <BalanceFilterBar
              filters={filters}
              onUpdateFilters={updateFilters}
              onResetFilters={resetFilters}
              loading={isLoading}
            />

            {/* Results Summary */}
            {!isLoading && hasBalances && (
              <div className="mb-4 text-sm text-gray-600">
                Showing {filteredCount} account{filteredCount !== 1 ? 's' : ''} 
                {filters.groupBy !== 'none' && ` in ${Object.keys(groupedBalances).length} groups`}
              </div>
            )}

            {/* Balance List */}
            <BalanceList
              balances={balances}
              groupedBalances={groupedBalances}
              groupBy={filters.groupBy}
              loading={isLoading}
              onEditInitialBalance={handleEditInitialBalance}
            />

            {/* Manual Balance Dialog */}
            <ManualBalanceDialog
              isOpen={isManualBalanceDialogOpen}
              onClose={handleCloseManualBalanceDialog}
              accountBalance={selectedAccountBalance}
              onSave={handleSaveInitialBalance}
              loading={isLoading}
            />

            {/* Balances Summary Dialog */}
            <BalancesSummaryDialog
              isOpen={isSummaryDialogOpen}
              onClose={handleCloseSummaryDialog}
              balances={balances}
              title={globalSelectedCompany === 'all' 
                ? 'All Companies - Balances Summary' 
                : (() => {
                    const company = companies.find(c => c.id === globalSelectedCompany);
                    return company ? `${company.tradingName} - Balances Summary` : 'Balances Summary';
                  })()
              }
            />
          </div>
        </div>
      </ApiErrorBoundary>
    </ErrorBoundary>
  );
}