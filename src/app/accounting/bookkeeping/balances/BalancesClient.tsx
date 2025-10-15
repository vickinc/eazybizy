"use client";

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Download from "lucide-react/dist/esm/icons/download";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import CalendarIcon from "lucide-react/dist/esm/icons/calendar";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useBalanceManagementDB } from "@/hooks/useBalanceManagementDB";
import { ManualBalanceDialog } from "@/components/features/ManualBalanceDialog";
import { BalancesSummaryDialog } from "@/components/features/BalancesSummaryDialog";
import { Skeleton } from '@/components/ui/loading-states';
import BalancesLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

// Lazy load heavy components to improve initial bundle size
const BalanceStats = dynamic(
  () => import('@/components/features/BalanceStats').then(mod => ({ default: mod.BalanceStats })),
  {
    loading: () => (
      <div>
        {/* Stats Cards Skeleton - Simplified */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
              <Skeleton className="h-8 w-24 mb-2" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
        
        {/* Pie Chart Skeleton - Simplified */}
        <div className="bg-white rounded-lg shadow border p-6 mb-6">
          <Skeleton className="h-6 w-40 mb-6" />
          <div className="flex items-center justify-center">
            <div className="w-48 h-48 rounded-full bg-gray-200 animate-pulse"></div>
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
          {[...Array(2)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="flex gap-4">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
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

  // Prevent hydration mismatches by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    balances,
    groupedBalances,
    summary,
    isLoading,
    isFetching,
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

  // Date picker state management
  const dateChangeTimeoutRef = useRef<NodeJS.Timeout>();
  const dateInputRef = useRef<HTMLInputElement>(null);
  const [pendingDate, setPendingDate] = useState<string>('');
  const [datePickerActive, setDatePickerActive] = useState<boolean>(false);

  const handleDateChange = useCallback((newDate: string) => {
    setPendingDate(newDate);
    
    // Clear existing timeout
    if (dateChangeTimeoutRef.current) {
      clearTimeout(dateChangeTimeoutRef.current);
    }
    
    // Longer delay when date picker might be open (user is navigating)
    const delay = datePickerActive ? 1500 : 500;
    
    // Set new timeout to update filters after user stops changing the date
    dateChangeTimeoutRef.current = setTimeout(() => {
      updateFilters({ 
        asOfDate: newDate,
        selectedPeriod: 'asOfDate' 
      });
      setPendingDate('');
    }, delay);
  }, [updateFilters, datePickerActive]);

  const handleDateInputFocus = useCallback(() => {
    setDatePickerActive(true);
  }, []);

  const handleDateInputBlur = useCallback(() => {
    // When user clicks away or finishes with date picker, apply immediately
    if (pendingDate) {
      if (dateChangeTimeoutRef.current) {
        clearTimeout(dateChangeTimeoutRef.current);
      }
      updateFilters({ 
        asOfDate: pendingDate,
        selectedPeriod: 'asOfDate' 
      });
      setPendingDate('');
    }
    
    // Mark date picker as inactive
    setTimeout(() => {
      setDatePickerActive(false);
    }, 200);
  }, [pendingDate, updateFilters]);

  const handleDateInputKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Apply date immediately when user presses Enter
    if (e.key === 'Enter' && pendingDate) {
      if (dateChangeTimeoutRef.current) {
        clearTimeout(dateChangeTimeoutRef.current);
      }
      updateFilters({ 
        asOfDate: pendingDate,
        selectedPeriod: 'asOfDate' 
      });
      setPendingDate('');
      setDatePickerActive(false);
      dateInputRef.current?.blur();
    }
  }, [pendingDate, updateFilters]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (dateChangeTimeoutRef.current) {
        clearTimeout(dateChangeTimeoutRef.current);
      }
    };
  }, []);

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
      loadBalances();

    } catch (error) {
      console.error('Error refreshing blockchain balance:', error);
      // Error will be shown in the BalanceList component
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
                      : (() => {
                          const baseText = globalSelectedCompany === 'all' 
                            ? 'View and manage account balances across all companies' 
                            : (() => {
                                const company = companies.find(c => c.id === globalSelectedCompany);
                                return company 
                                  ? `Account balances for ${company.tradingName}` 
                                  : 'View and manage account balances';
                              })();
                          
                          return baseText;
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
                  title="Refresh all balances (uses 5-min cached blockchain data)"
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

            {/* Compact Date Filter Section */}
            <div className="mb-6 bg-lime-200 rounded-lg border border-lime-300 p-4">
              <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
                {/* Date Selection */}
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-4 w-4 text-gray-700" />
                    <Label className="text-sm font-medium text-gray-800">Balance as of:</Label>
                  </div>
                  
                  <div className="relative">
                    <Input
                      ref={dateInputRef}
                      type="date"
                      value={pendingDate || filters.asOfDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => handleDateChange(e.target.value)}
                      onFocus={handleDateInputFocus}
                      onBlur={handleDateInputBlur}
                      onKeyDown={handleDateInputKeyDown}
                      className="w-[160px] bg-lime-50 border-lime-400 focus:border-lime-500 focus:ring-lime-500"
                      disabled={isFetching}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {(isFetching || pendingDate) && (
                      <div className="absolute inset-0 bg-lime-50/80 rounded flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                  </div>
                  
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => {
                      // Clear any pending date changes
                      if (dateChangeTimeoutRef.current) {
                        clearTimeout(dateChangeTimeoutRef.current);
                      }
                      setPendingDate('');
                      
                      // Immediately set to today
                      updateFilters({ 
                        asOfDate: new Date().toISOString().split('T')[0],
                        selectedPeriod: 'asOfDate' 
                      });
                    }}
                    disabled={isFetching}
                    className="bg-gray-700 hover:bg-gray-800 text-white border-gray-700 hover:border-gray-800 px-4 font-medium shadow-sm"
                  >
                    Today
                  </Button>
                  
                  {/* Historical View Indicator */}
                  {filters.asOfDate && filters.asOfDate !== new Date().toISOString().split('T')[0] && (
                    <div className="flex items-center gap-2 text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-200">
                      <span className="text-sm font-medium">Historical View</span>
                    </div>
                  )}
                  
                  {/* Loading indicator for data updates */}
                  {isFetching && (
                    <div className="flex items-center gap-2 text-gray-600 bg-gray-100 px-3 py-1 rounded-full border border-gray-200">
                      <div className="w-3 h-3 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Updating...</span>
                    </div>
                  )}
                  
                  {/* Pending date change indicator */}
                  {pendingDate && !isFetching && (
                    <div className="flex items-center gap-2 text-orange-700 bg-orange-100 px-3 py-1 rounded-full border border-orange-200">
                      <div className="w-3 h-3 border-2 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm font-medium">Waiting...</span>
                    </div>
                  )}
                </div>

                {/* Quick Filters */}
                <div className="flex gap-2">
                  <Select 
                    value={filters.accountTypeFilter} 
                    onValueChange={(value: any) => updateFilters({ accountTypeFilter: value })}
                    disabled={isFetching}
                  >
                    <SelectTrigger className="w-[130px] bg-lime-50 border-lime-400 hover:bg-lime-100 focus:border-lime-500 focus:ring-lime-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Accounts</SelectItem>
                      <SelectItem value="banks">Banks</SelectItem>
                      <SelectItem value="wallets">Wallets</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select 
                    value={filters.groupBy} 
                    onValueChange={(value: any) => updateFilters({ groupBy: value })}
                    disabled={isFetching}
                  >
                    <SelectTrigger className="w-[130px] bg-lime-50 border-lime-400 hover:bg-lime-100 focus:border-lime-500 focus:ring-lime-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Group</SelectItem>
                      <SelectItem value="account">By Account</SelectItem>
                      <SelectItem value="currency">By Currency</SelectItem>
                      <SelectItem value="type">By Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                ))}
              </div>
            }>
              {hasBalances && (
                <BalanceStats
                  summary={summary}
                  loading={isLoading}
                  onSummaryClick={handleOpenSummaryDialog}
                  selectedPeriod={filters.selectedPeriod}
                  customDateRange={filters.customDateRange}
                  asOfDate={filters.asOfDate}
                />
              )}
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
                  {[...Array(2)].map((_, index) => (
                    <div key={index} className="p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-4">
                          <Skeleton className="h-10 w-10 rounded-lg" />
                          <Skeleton className="h-5 w-32" />
                        </div>
                        <Skeleton className="h-6 w-24" />
                      </div>
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-20" />
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