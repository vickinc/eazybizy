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
import { ManualBalanceDialog } from "@/components/features/ManualBalanceDialog";
import { BalancesSummaryDialog } from "@/components/features/BalancesSummaryDialog";
import { Skeleton } from '@/components/ui/loading-states';
import BalancesLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components to improve initial bundle size
const BalanceFilterBar = dynamic(
  () => import('@/components/features/BalanceFilterBar').then(mod => ({ default: mod.BalanceFilterBar })),
  {
    loading: () => (
      <div className="mb-6 bg-white rounded-lg shadow border p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <Skeleton className="h-4 w-20 mb-2" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-20" />
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </div>
    ),
    ssr: true
  }
);

const BalanceStats = dynamic(
  () => import('@/components/features/BalanceStats').then(mod => ({ default: mod.BalanceStats })),
  {
    loading: () => (
      <div>
        {/* Stats Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
              <div className="flex items-center mb-2">
                <Skeleton className="h-4 w-4 mr-2" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
        
        {/* Pie Chart Skeleton */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <div className="flex items-center mb-6">
            <Skeleton className="h-5 w-5 mr-2" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="h-56 sm:h-72 md:h-80 lg:h-96 flex items-center justify-center">
                <div className="w-48 h-48 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 rounded-full bg-gray-200 animate-pulse"></div>
              </div>
            </div>
            <div className="lg:col-span-1">
              <Skeleton className="h-4 w-32 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center p-2">
                    <Skeleton className="w-3 h-3 rounded-full mr-3" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-12 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: true
  }
);

const BalanceList = dynamic(
  () => import('@/components/features/BalanceList').then(mod => ({ default: mod.BalanceList })),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-lg" />
                  <div>
                    <Skeleton className="h-5 w-40 mb-2" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
                <div className="text-right">
                  <Skeleton className="h-5 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="text-center">
                    <Skeleton className="h-4 w-20 mx-auto mb-2" />
                    <Skeleton className="h-5 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: true
  }
);
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { AccountBalance } from '@/types/balance.types';

export default function BalancesClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const [selectedAccountBalance, setSelectedAccountBalance] = useState<AccountBalance | undefined>();
  const [isManualBalanceDialogOpen, setIsManualBalanceDialogOpen] = useState(false);
  const [isSummaryDialogOpen, setIsSummaryDialogOpen] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [blockchainRefreshStatus, setBlockchainRefreshStatus] = useState<{
    walletId?: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
  }>({ status: 'idle' });

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

  const handleRefreshBlockchain = async (walletId: string) => {
    setBlockchainRefreshStatus({ 
      walletId, 
      status: 'loading', 
      message: 'Fetching blockchain balance...' 
    });

    try {
      // Find the wallet in balances to get its details
      const walletBalance = balances.find(b => b.account.id === walletId);
      if (!walletBalance || 'bankName' in walletBalance.account) {
        throw new Error('Wallet not found or invalid');
      }

      const wallet = walletBalance.account as any; // DigitalWallet type
      if (!wallet.walletAddress || wallet.walletType?.toLowerCase() !== 'crypto') {
        throw new Error('Not a crypto wallet or no address configured');
      }

      // Call the blockchain balance API
      const response = await fetch('/api/blockchain/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          address: wallet.walletAddress,
          blockchain: wallet.blockchain || 'ethereum',
          network: 'mainnet', // TODO: Add network field to wallet
          tokenSymbol: wallet.currency,
          forceRefresh: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch blockchain balance');
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Unknown error');
      }

      // Refresh the balances to reflect the new blockchain data
      await loadBalances();
      
      setBlockchainRefreshStatus({ 
        walletId, 
        status: 'success', 
        message: 'Blockchain balance updated successfully' 
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setBlockchainRefreshStatus({ status: 'idle' });
      }, 3000);

    } catch (error) {
      console.error('Error refreshing blockchain balance:', error);
      setBlockchainRefreshStatus({ 
        walletId, 
        status: 'error', 
        message: error instanceof Error ? error.message : 'Failed to refresh blockchain balance' 
      });

      // Clear error message after 5 seconds
      setTimeout(() => {
        setBlockchainRefreshStatus({ status: 'idle' });
      }, 5000);
    }
  };

  // Helper function to count unique accounts (not currency entries)
  const getUniqueAccountCount = (accountBalances: AccountBalance[]) => {
    const uniqueAccountIds = new Set<string>();
    accountBalances.forEach(balance => {
      let originalAccountId = balance.account.id;
      // For multi-currency wallets, extract original wallet ID
      if (balance.account.id.includes('-')) {
        originalAccountId = balance.account.id.split('-')[0];
      }
      uniqueAccountIds.add(originalAccountId);
    });
    return uniqueAccountIds.size;
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

  // Don't show full page skeleton - show structure immediately and let individual components handle their loading states

  // Handle loading state with skeleton UI
  if (showLoader) {
    return <BalancesLoading />;
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

            {/* Blockchain Refresh Status */}
            {blockchainRefreshStatus.status !== 'idle' && (
              <Alert className={`mb-6 ${
                blockchainRefreshStatus.status === 'success' ? 'border-green-200 bg-green-50' :
                blockchainRefreshStatus.status === 'error' ? 'border-red-200 bg-red-50' :
                'border-blue-200 bg-blue-50'
              }`}>
                <AlertCircle className={`h-4 w-4 ${
                  blockchainRefreshStatus.status === 'success' ? 'text-green-600' :
                  blockchainRefreshStatus.status === 'error' ? 'text-red-600' :
                  'text-blue-600'
                }`} />
                <AlertDescription className={
                  blockchainRefreshStatus.status === 'success' ? 'text-green-800' :
                  blockchainRefreshStatus.status === 'error' ? 'text-red-800' :
                  'text-blue-800'
                }>
                  {blockchainRefreshStatus.message}
                </AlertDescription>
              </Alert>
            )}

            {/* Balance Statistics */}
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
                    <div className="flex items-center mb-2">
                      <Skeleton className="h-4 w-4 mr-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-20 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            }>
              {hasBalances && (
                <BalanceStats
                  summary={summary}
                  loading={isLoading}
                  onSummaryClick={handleOpenSummaryDialog}
                />
              )}
            </Suspense>

            {/* Filters */}
            <Suspense fallback={
              <div className="mb-6 bg-white rounded-lg shadow border p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  {[...Array(4)].map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-20 mb-2" />
                      <Skeleton className="h-9 w-full" />
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-8 w-20" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                </div>
              </div>
            }>
              <BalanceFilterBar
                filters={filters}
                onUpdateFilters={updateFilters}
                onResetFilters={resetFilters}
                loading={isLoading}
              />
            </Suspense>

            {/* Results Summary */}
            {hasBalances && (
              <div className="mb-4 text-sm text-gray-600">
                {isLoading ? (
                  <Skeleton className="h-4 w-32" />
                ) : (
                  <>
                    Showing {getUniqueAccountCount(balances)} account{getUniqueAccountCount(balances) !== 1 ? 's' : ''} 
                    {filters.groupBy !== 'none' && ` in ${Object.keys(groupedBalances).length} groups`}
                  </>
                )}
              </div>
            )}

            {/* Balance List */}
            <Suspense fallback={
              <div className="bg-white rounded-lg shadow border">
                <div className="p-4 border-b border-gray-200">
                  <Skeleton className="h-6 w-32" />
                </div>
                <div className="divide-y divide-gray-200">
                  {[...Array(3)].map((_, index) => (
                    <div key={index} className="p-4 sm:p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-12 w-12 rounded-lg" />
                          <div>
                            <Skeleton className="h-5 w-40 mb-2" />
                            <Skeleton className="h-3 w-32" />
                          </div>
                        </div>
                        <div className="text-right">
                          <Skeleton className="h-5 w-24 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map((i) => (
                          <div key={i} className="text-center">
                            <Skeleton className="h-4 w-20 mx-auto mb-2" />
                            <Skeleton className="h-5 w-16 mx-auto" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            }>
              <BalanceList
                balances={balances}
                groupedBalances={groupedBalances}
                groupBy={filters.groupBy}
                loading={isLoading}
                onEditInitialBalance={handleEditInitialBalance}
                onRefreshBlockchain={handleRefreshBlockchain}
              />
            </Suspense>

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