"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Download from "lucide-react/dist/esm/icons/download";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import ArrowRightLeft from "lucide-react/dist/esm/icons/arrow-right-left";
import Plus from "lucide-react/dist/esm/icons/plus";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useTransactionsManagementDB } from "@/hooks/useTransactionsManagementDB";
import { TransactionApiService } from "@/services/api/transactionApiService";
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function TransactionsClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const [isHydrated, setIsHydrated] = useState(false);

  // Prevent hydration mismatches by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    // Data
    transactions,
    groupedTransactions,
    statistics,
    pagination,
    hasTransactions,
    
    // Loading states
    isLoading,
    isError,
    error,
    isFetching,
    isLoadingStats,
    isCreating,
    isUpdating,
    isDeleting,
    isLinking,
    
    // State
    filters,
    grouping,
    uiState,
    bulkTransactions,
    bulkSelectedAccountId,
    
    // Filter actions
    updateFilters,
    resetFilters,
    
    // Grouping actions
    updateGrouping,
    
    // UI actions
    toggleTransactionSelection,
    toggleSelectAll,
    toggleGroupExpansion,
    toggleTransactionExpansion,
    setUIState,
    
    // CRUD operations
    createTransaction,
    createBulkTransactions,
    updateTransaction,
    deleteTransaction,
    deleteBulkTransactions,
    linkTransaction,
    unlinkTransaction,
    
    // Bulk operations
    setBulkTransactions,
    setBulkSelectedAccountId,
    addBulkTransactionRow,
    removeBulkTransactionRow,
    updateBulkTransaction,
    handleBulkCreate,
    confirmBulkDelete,
    
    // Utility
    refetch,
    pageTitle,
    pageDescription,
  } = useTransactionsManagementDB(globalSelectedCompany, companies);

  // Handle export
  const handleExport = useCallback(async (format: 'csv' | 'excel') => {
    try {
      const blob = await TransactionApiService.exportTransactions({
        companyId: globalSelectedCompany,
        ...filters,
      }, format);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  }, [globalSelectedCompany, filters]);

  // Handle bulk delete confirmation
  const handleBulkDelete = useCallback(() => {
    setUIState(prev => ({ ...prev, showDeleteConfirmDialog: true }));
  }, [setUIState]);

  // Clear error
  const clearError = useCallback(() => {
    // Error is managed by React Query - refetch to clear
    refetch();
  }, [refetch]);

  // Show loading screen for initial load
  const showDelayedLoading = useDelayedLoading(isLoading);
  
  if (showDelayedLoading) {
    return <LoadingScreen message="Loading transactions..." />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowRightLeft className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {!isHydrated 
                  ? 'Transactions'
                  : pageTitle
                }
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {!isHydrated 
                  ? 'View and manage your financial transactions'
                  : pageDescription
                }
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => setUIState(prev => ({ 
                  ...prev, 
                  bulkAddType: 'incoming',
                  showBulkAddDialog: true 
                }))}
                disabled={isCreating}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isCreating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Incoming</span>
                  </div>
                )}
              </Button>

              <Button 
                onClick={() => setUIState(prev => ({ 
                  ...prev, 
                  bulkAddType: 'outgoing',
                  showBulkAddDialog: true 
                }))}
                disabled={isCreating}
                className="bg-black hover:bg-gray-800 text-white"
              >
                {isCreating ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Creating...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Add Outgoing</span>
                  </div>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={isFetching}
              >
                {isFetching ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Refreshing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <RefreshCw className="h-4 w-4" />
                    <span>Refresh</span>
                  </div>
                )}
              </Button>

              <Button 
                variant="outline" 
                onClick={() => handleExport('csv')}
              >
                <div className="flex items-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Export CSV</span>
                </div>
              </Button>
            </div>

            {uiState.selectedTransactions.size > 0 && (
              <Button 
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </div>
                ) : (
                  `Delete Selected (${uiState.selectedTransactions.size})`
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Error Display */}
        <ErrorBoundary level="page">
          <ApiErrorBoundary onRetry={refetch}>
            {isError && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error?.message || 'Failed to load transactions'}</span>
                  <Button variant="ghost" size="sm" onClick={clearError}>
                    Dismiss
                  </Button>
                </AlertDescription>
              </Alert>
            )}

            {/* Statistics Cards */}
            {statistics && !isLoadingStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Transactions</h3>
                  <p className="text-2xl font-bold text-gray-900">{statistics.summary.totalTransactions}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Incoming</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD' 
                    }).format(statistics.summary.totalIncoming)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Total Outgoing</h3>
                  <p className="text-2xl font-bold text-red-600">
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD' 
                    }).format(statistics.summary.totalOutgoing)}
                  </p>
                </div>
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-sm font-medium text-gray-500">Net Amount</h3>
                  <p className={`text-2xl font-bold ${
                    statistics.summary.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {new Intl.NumberFormat('en-US', { 
                      style: 'currency', 
                      currency: 'USD' 
                    }).format(statistics.summary.netAmount)}
                  </p>
                </div>
              </div>
            )}

            {/* Filter Bar would go here */}
            <div className="mb-6 p-4 bg-white rounded-lg shadow">
              <div className="flex flex-wrap gap-4 items-center">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
                  <input
                    type="text"
                    value={filters.searchTerm}
                    onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                    placeholder="Search transactions..."
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filters.status}
                    onChange={(e) => updateFilters({ status: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="cleared">Cleared</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => updateFilters({ dateRange: e.target.value as any })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Time</option>
                    <option value="thisMonth">This Month</option>
                    <option value="lastMonth">Last Month</option>
                    <option value="thisYear">This Year</option>
                    <option value="lastYear">Last Year</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <Button variant="outline" onClick={resetFilters}>
                    Reset Filters
                  </Button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            {hasTransactions ? (
              <div className="bg-white rounded-lg shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-gray-900">
                      Transactions ({pagination?.total || transactions.length})
                    </h2>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={uiState.selectedTransactions.size === transactions.length && transactions.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                      <label className="text-sm text-gray-700">Select All</label>
                    </div>
                  </div>

                  <div className="space-y-4">
                    {transactions.map((transaction) => {
                      const isSelected = uiState.selectedTransactions.has(transaction.id);
                      const isExpanded = uiState.expandedTransactions.has(transaction.id);
                      const isIncoming = transaction.incomingAmount > 0;
                      
                      return (
                        <div 
                          key={transaction.id} 
                          className={`border rounded-lg p-4 transition-all ${
                            isSelected ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleTransactionSelection(transaction.id)}
                                className="rounded"
                              />
                              
                              <div className={`w-3 h-3 rounded-full ${
                                isIncoming ? 'bg-green-500' : 'bg-red-500'
                              }`} />
                              
                              <div>
                                <p className="font-medium text-gray-900">
                                  {isIncoming ? transaction.paidBy : transaction.paidTo}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.reference || 'No reference'}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {new Date(transaction.date).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            
                            <div className="text-right">
                              <p className={`text-lg font-semibold ${
                                isIncoming ? 'text-green-600' : 'text-red-600'
                              }`}>
                                {isIncoming ? '+' : '-'}
                                {new Intl.NumberFormat('en-US', { 
                                  style: 'currency', 
                                  currency: transaction.currency 
                                }).format(Math.abs(transaction.netAmount))}
                              </p>
                              <p className="text-sm text-gray-600">{transaction.category}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`inline-flex px-2 py-1 text-xs rounded-full ${
                                  transaction.status === 'CLEARED' ? 'bg-green-100 text-green-800' :
                                  transaction.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {transaction.status}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {transaction.description && (
                            <div className="mt-3 pt-3 border-t">
                              <p className="text-sm text-gray-600">{transaction.description}</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Pagination */}
                  {pagination && pagination.hasMore && (
                    <div className="mt-6 flex justify-center">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          // Implement pagination logic
                        }}
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12">
                <div className="text-center">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-600 mb-6">
                    {filters.searchTerm || filters.status !== 'all' || filters.dateRange !== 'all'
                      ? 'Try adjusting your filters to see more transactions.'
                      : 'Start by adding your first transaction.'
                    }
                  </p>
                  <Button 
                    onClick={() => setUIState(prev => ({ 
                      ...prev, 
                      bulkAddType: 'incoming',
                      showBulkAddDialog: true 
                    }))}
                    className="bg-black hover:bg-gray-800 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Transaction
                  </Button>
                </div>
              </div>
            )}

            {/* Dialogs would go here - using existing dialog components */}
            {/* BulkAddTransactionDialog, LinkEntryDialog, ConfirmationDialog, etc. */}

          </ApiErrorBoundary>
        </ErrorBoundary>
      </div>
    </div>
  );
}