"use client";

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Download from "lucide-react/dist/esm/icons/download";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import ArrowRightLeft from "lucide-react/dist/esm/icons/arrow-right-left";
import Plus from "lucide-react/dist/esm/icons/plus";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Database from "lucide-react/dist/esm/icons/database";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useTransactionsManagementDB } from "@/hooks/useTransactionsManagementDB";
import { TransactionApiService } from "@/services/api/transactionApiService";
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { PeriodPreset } from '@/services/utils/periodFilterService';
import { BlockchainIcon } from '@/components/ui/blockchain-icon';
import { Badge } from '@/components/ui/badge';
import { TransactionFilterWizard, type WizardState } from '@/components/features/TransactionFilterWizard';

export default function TransactionsClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const [isHydrated, setIsHydrated] = useState(false);
  const [enableLiveCryptoFetching, setEnableLiveCryptoFetching] = useState(false);

  // Prevent hydration mismatches by only showing dynamic content after hydration
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const {
    // Data
    transactions,
    transactionsByAccount,
    statistics,
    pagination,
    hasTransactions,
    
    // Loading states
    isLoading,
    isError,
    error,
    isFetching,
    isLoadingStats,
    isLoadingWallets,
    isLoadingLiveCrypto,
    isCreating,
    isDeleting,
    
    // Crypto data
    cryptoWallets,
    liveCryptoTransactions,
    
    // State
    filters,
    uiState,
    
    // Filter actions
    updateFilters,
    resetFilters,
    
    // UI actions
    toggleTransactionSelection,
    toggleSelectAll,
    setUIState,
    
    // Bulk operations
    handleBulkCreate,
    confirmBulkDelete,
    
    // Utility
    refetch,
    pageTitle,
    pageDescription,
    
    // Period filtering utilities
    updatePeriodFilter,
    validateCustomDateRange,
    getCurrentPeriodLabel,
    getAvailablePeriods,
  } = useTransactionsManagementDB(globalSelectedCompany, companies, {
    disableLiveCrypto: !enableLiveCryptoFetching
  });

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

  // Helper function to get blockchain explorer URL
  const getExplorerUrl = useCallback((transaction: any) => {
    const hash = transaction.reference;
    if (!hash) {
      return null; // No hash available
    }

    // Check if it's a blockchain transaction by checking:
    // 1. linkedEntryType is BLOCKCHAIN_IMPORT
    // 2. hash length suggests blockchain transaction (typically 40+ characters)
    // 3. or transaction ID starts with 'live-'
    const isBlockchainTx = transaction.linkedEntryType === 'BLOCKCHAIN_IMPORT' || 
                          hash.length >= 40 || 
                          transaction.id.startsWith('live-');
    
    if (!isBlockchainTx) {
      return null; // Not a blockchain transaction
    }

    // Get blockchain info from the linked entry if available
    const blockchain = transaction.linkedEntry?.blockchain?.toLowerCase();
    
    // Determine correct explorer based on blockchain
    switch (blockchain) {
      case 'tron':
        return `https://tronscan.org/#/transaction/${hash}`;
      case 'ethereum':
        return `https://etherscan.io/tx/${hash}`;
      case 'bsc':
      case 'binance-smart-chain':
        return `https://bscscan.com/tx/${hash}`;
      case 'bitcoin':
        return `https://blockchair.com/bitcoin/transaction/${hash}`;
      case 'solana':
        return `https://solscan.io/tx/${hash}`;
      default:
        // Fallback: try to determine from currency and other indicators
        const currency = transaction.currency?.toUpperCase();
        const description = transaction.description?.toLowerCase() || '';
        const notes = transaction.notes || '';
        
        // Check for Tron blockchain indicators
        if (currency === 'TRX' || 
            (currency === 'USDT' && (description.includes('trc') || notes.includes('tron'))) ||
            (currency === 'USDC' && (description.includes('trc') || notes.includes('tron'))) ||
            description.includes('trc20') || description.includes('trc-20')) {
          return `https://tronscan.org/#/transaction/${hash}`;
        } 
        // Check for Ethereum blockchain indicators
        else if (currency === 'ETH' || 
                 (currency === 'USDT' && (description.includes('erc') || notes.includes('ethereum'))) ||
                 (currency === 'USDC' && (description.includes('erc') || notes.includes('ethereum'))) ||
                 description.includes('erc20') || description.includes('erc-20')) {
          return `https://etherscan.io/tx/${hash}`;
        } 
        // Check for BSC blockchain indicators
        else if (currency === 'BNB' || 
                 (description.includes('bsc') || description.includes('binance')) ||
                 description.includes('bep20') || description.includes('bep-20')) {
          return `https://bscscan.com/tx/${hash}`;
        } 
        // Bitcoin
        else if (currency === 'BTC') {
          return `https://blockchair.com/bitcoin/transaction/${hash}`;
        } 
        // Solana
        else if (currency === 'SOL') {
          return `https://solscan.io/tx/${hash}`;
        }
        return null; // Unknown blockchain
    }
  }, []);

  // Helper function to get wallet explorer URL
  const getWalletExplorerUrl = useCallback((walletAddress: string, blockchain?: string) => {
    if (!walletAddress) return null;
    
    // Determine blockchain type from address format or passed blockchain param
    let blockchainType = blockchain?.toLowerCase();
    
    // Auto-detect if not provided
    if (!blockchainType) {
      if (walletAddress.startsWith('T') && walletAddress.length === 34) {
        blockchainType = 'tron';
      } else if (walletAddress.startsWith('0x') && walletAddress.length === 42) {
        // Could be ETH or BSC, default to ETH
        blockchainType = 'ethereum';
      } else if (walletAddress.length >= 32 && walletAddress.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(walletAddress)) {
        // Base58 encoded Solana address (32-44 characters)
        blockchainType = 'solana';
      }
    }
    
    // Return appropriate explorer URL
    switch (blockchainType) {
      case 'tron':
        return `https://tronscan.org/#/address/${walletAddress}`;
      case 'ethereum':
      case 'eth':
        return `https://etherscan.io/address/${walletAddress}`;
      case 'bsc':
      case 'binance':
      case 'binance-smart-chain':
        return `https://bscscan.com/address/${walletAddress}`;
      case 'solana':
      case 'sol':
        return `https://solscan.io/account/${walletAddress}`;
      default:
        return null;
    }
  }, []);

  // Helper function to detect blockchain transactions
  const getBlockchainInfo = useCallback((transaction: any) => {
    const isBlockchain = transaction.linkedEntryType === 'BLOCKCHAIN_IMPORT' || 
                        transaction.reference?.length >= 40; // Typical blockchain hash length
    
    if (!isBlockchain) return null;

    // Determine blockchain from various sources
    let blockchain = '';
    let tokenType = 'native';
    
    // Check linkedEntry blockchain info first
    if (transaction.linkedEntry?.blockchain) {
      blockchain = transaction.linkedEntry.blockchain.toLowerCase();
    }
    // Fallback to currency-based detection
    else {
      const currency = transaction.currency?.toUpperCase();
      if (currency === 'TRX' || (currency === 'USDT' && transaction.description?.includes('TRC')) || 
          (currency === 'USDC' && transaction.description?.includes('TRC'))) {
        blockchain = 'tron';
      } else if (currency === 'ETH' || transaction.description?.includes('ERC')) {
        blockchain = 'ethereum';
      } else if (currency === 'BNB') {
        blockchain = 'binance-smart-chain';
      }
    }

    // Determine if it's a token transaction
    const currency = transaction.currency?.toUpperCase();
    if (blockchain === 'tron') {
      tokenType = (currency === 'TRX') ? 'native' : 'trc20';
    } else if (blockchain === 'ethereum') {
      tokenType = (currency === 'ETH') ? 'native' : 'erc20';
    }

    return {
      blockchain,
      tokenType,
      isBlockchain: true,
      hash: transaction.reference
    };
  }, []);

  // Helper function to format currency amounts safely - shows FULL precision without rounding
  const formatCurrencyAmount = useCallback((amount: number, currency: string) => {
    // Debug: Log formatting for ETH amounts in development
    if (process.env.NODE_ENV === 'development' && currency === 'ETH' && Math.abs(amount) > 0) {
      console.log(`🎯 Formatting ${amount} ${currency}:`, {
        originalAmount: amount,
        amountString: amount.toString(),
        isVerySmall: Math.abs(amount) < 0.0001
      });
    }
    
    // List of standard ISO currency codes that Intl.NumberFormat supports
    const validCurrencyCodes = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SEK', 'NOK', 'MXN', 'NZD', 'SGD', 'HKD', 'KRW', 'TRY', 'RUB', 'INR', 'BRL', 'ZAR'];
    
    if (validCurrencyCodes.includes(currency.toUpperCase())) {
      // Use standard currency formatting for fiat currencies
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency.toUpperCase(),
        maximumFractionDigits: 8 // Allow more precision even for fiat
      }).format(amount);
    } else {
      // For cryptocurrencies: ALWAYS show full precision without rounding
      if (amount === 0) {
        return '0 ' + currency.toUpperCase();
      }
      
      // Convert to string to preserve full precision
      let amountStr = amount.toString();
      
      // Handle scientific notation from JavaScript
      if (amountStr.includes('e')) {
        // Convert scientific notation to decimal string
        amountStr = amount.toFixed(20).replace(/\.?0+$/, '');
      }
      
      // Remove any trailing zeros after decimal point
      if (amountStr.includes('.')) {
        amountStr = amountStr.replace(/\.?0+$/, '');
      }
      
      const result = `${amountStr} ${currency.toUpperCase()}`;
      
      // Debug: Log result for ETH amounts
      if (process.env.NODE_ENV === 'development' && currency === 'ETH' && Math.abs(amount) > 0) {
        console.log(`➡️ Formatted result: "${result}"`);
      }
      
      return result;
    }
  }, []);

  // State for deferred filter updates
  const [pendingFilters, setPendingFilters] = useState(filters);
  const [isBlockchainFilterActive, setIsBlockchainFilterActive] = useState(false);

  // Update the pending filters without triggering immediate refresh
  const updatePendingFilters = useCallback((updates: Partial<typeof filters>) => {
    setPendingFilters(prev => ({ ...prev, ...updates }));
  }, []);

  // Apply all pending filters at once
  const applyPendingFilters = useCallback(() => {
    updateFilters(pendingFilters);
  }, [pendingFilters, updateFilters]);

  // Handle wizard-based filter application
  const handleWizardApplyFilters = useCallback(async (wizardState: WizardState) => {
    try {
      // Convert wizard state to existing filter format
      const newFilters = {
        ...filters,
        blockchain: wizardState.selectedBlockchain || 'all',
        currency: wizardState.selectedCurrencies.length === 1 ? wizardState.selectedCurrencies[0] : 'all',
        accountType: 'wallet' as const, // Wizard is for blockchain transactions
        dateRange: wizardState.selectedPeriod as PeriodPreset,
        customDateFrom: wizardState.customDateRange?.startDate ? new Date(wizardState.customDateRange.startDate) : null,
        customDateTo: wizardState.customDateRange?.endDate ? new Date(wizardState.customDateRange.endDate) : null
      };

      // Enable live crypto fetching when wizard is applied
      setEnableLiveCryptoFetching(true);
      updateFilters(newFilters);
      console.log('🔧 Applied wizard filters and enabled live crypto fetching:', newFilters);
    } catch (error) {
      console.error('❌ Error applying wizard filters:', error);
    }
  }, [filters, updateFilters]);

  // Handle wizard-based import and apply
  const handleWizardImportAndApply = useCallback(async (wizardState: WizardState) => {
    try {
      setIsImporting(true);

      // Enable live crypto fetching when wizard import is used
      setEnableLiveCryptoFetching(true);

      // First apply the filters
      await handleWizardApplyFilters(wizardState);

      // Wait a bit for filters to be applied
      await new Promise(resolve => setTimeout(resolve, 200));

      // Then trigger blockchain import with the wizard settings
      if (!wizardState.selectedBlockchain) {
        throw new Error('No blockchain selected');
      }

      const blockchain = wizardState.selectedBlockchain;
      console.log(`🚀 Starting wizard-based blockchain import for ${blockchain}`);

      // Get crypto wallets for the selected blockchain
      const wallets = cryptoWallets || [];
      const eligibleWallets = wallets.filter(wallet => 
        blockchain === 'all' || wallet.blockchain?.toLowerCase() === blockchain.toLowerCase()
      );

      if (eligibleWallets.length === 0) {
        alert(`No ${blockchain.toUpperCase()} wallets found. Please add ${blockchain.toUpperCase()} wallets first in the Banks & Wallets page.`);
        return;
      }

      console.log(`📱 Found ${eligibleWallets.length} eligible ${blockchain} wallets`);

      let totalImported = 0;
      const errors: string[] = [];

      // Import transactions for each eligible wallet
      for (const wallet of eligibleWallets) {
        try {
          console.log(`🚀 Importing transactions for wallet: ${wallet.walletName} (${wallet.blockchain}) with overwrite enabled to fix any incorrect directions`);

          const importOptions = {
            walletId: wallet.originalId || wallet.id, // Use originalId for virtual wallets, fallback to id
            startDate: wizardState.customDateRange?.startDate,
            endDate: wizardState.customDateRange?.endDate,
            currencies: wizardState.selectedCurrencies.length > 0 ? wizardState.selectedCurrencies : undefined,
            limit: 10000, // Increased limit to capture all transactions
            overwriteDuplicates: true // Always overwrite to ensure corrected parsing logic is applied
          };

          // Call the blockchain import API for this wallet
          const response = await fetch('/api/blockchain/transactions/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(importOptions)
          });

          if (response.ok) {
            const apiResponse = await response.json();
            const importResult = apiResponse.result;
            totalImported += importResult?.importedTransactions || 0;
            console.log(`✅ Imported ${importResult?.importedTransactions || 0} transactions for ${wallet.walletName}`, {
              total: importResult?.totalTransactions || 0,
              imported: importResult?.importedTransactions || 0,
              duplicates: importResult?.duplicateTransactions || 0,
              failed: importResult?.failedTransactions || 0
            });
          } else {
            const errorText = await response.text();
            console.error(`❌ Failed to import for ${wallet.walletName}:`, errorText);
            errors.push(`${wallet.walletName}: ${errorText}`);
          }
        } catch (error) {
          console.error(`❌ Error importing transactions for ${wallet.walletName}:`, error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`${wallet.walletName}: ${errorMessage}`);
        }
      }

      // Refresh data after import
      await refetch();

      // Show success message
      const errorSummary = errors.length > 0 ? `\n\nErrors: ${errors.join(', ')}` : '';
      alert(`Successfully imported ${totalImported} blockchain transactions from ${eligibleWallets.length} wallet(s).${errorSummary}`);
      
    } catch (error) {
      console.error('❌ Error in wizard import and apply:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error importing blockchain transactions: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  }, [handleWizardApplyFilters, cryptoWallets, refetch]);

  // Handle blockchain filter activation
  useEffect(() => {
    const isActive = pendingFilters.accountType === 'wallet' || pendingFilters.blockchain !== 'all';
    setIsBlockchainFilterActive(isActive);
  }, [pendingFilters]);

  // Handle blockchain transactions import
  const handleImportBlockchainTransactions = useCallback(async () => {
    try {
      // Determine the blockchain to import from
      const blockchain = filters.blockchain !== 'all' ? filters.blockchain : 'tron';
      
      // Get crypto wallets for the selected blockchain
      if (!cryptoWallets || cryptoWallets.length === 0) {
        alert('No crypto wallets found. Please add crypto wallets first in the Banks & Wallets page.');
        return;
      }

      // Filter wallets by blockchain if specific blockchain is selected
      const eligibleWallets = cryptoWallets.filter(wallet => 
        blockchain === 'all' || wallet.blockchain?.toLowerCase() === blockchain.toLowerCase()
      );

      if (eligibleWallets.length === 0) {
        alert(`No ${blockchain.toUpperCase()} wallets found. Please add ${blockchain.toUpperCase()} wallets first in the Banks & Wallets page.`);
        return;
      }

      // Import transactions for each eligible wallet
      let totalImported = 0;
      let errors: string[] = [];

      for (const wallet of eligibleWallets) {
        try {
          console.log(`🚀 Importing transactions for wallet: ${wallet.walletName} (${wallet.blockchain})`);
          
          // Build the import request parameters for this wallet
          const importParams = {
            walletId: wallet.originalId || wallet.id,
            startDate: filters.customDateFrom || undefined,
            endDate: filters.customDateTo || undefined,
            currencies: filters.currency !== 'all' ? [filters.currency] : undefined,
            limit: 1000,
            overwriteDuplicates: true,
            createInitialBalances: true
          };

          // Call the blockchain import API for this wallet
          const response = await fetch('/api/blockchain/transactions/import', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(importParams),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Failed to import transactions for ${wallet.walletName}`);
          }

          const result = await response.json();
          totalImported += result.importedTransactions || 0;
          
          console.log(`✅ Import completed for ${wallet.walletName}:`, result);
          
        } catch (walletError) {
          const errorMessage = walletError instanceof Error ? walletError.message : 'Unknown error';
          errors.push(`${wallet.walletName}: ${errorMessage}`);
          console.error(`❌ Error importing transactions for ${wallet.walletName}:`, walletError);
        }
      }
      
      // Refresh transactions data
      refetch();
      
      // Show result message
      if (errors.length === 0) {
        alert(`Successfully imported ${totalImported} blockchain transactions from ${eligibleWallets.length} wallet(s).`);
      } else {
        const successCount = eligibleWallets.length - errors.length;
        alert(`Import completed with ${successCount} successful and ${errors.length} failed wallets.\n\nImported: ${totalImported} transactions\n\nErrors:\n${errors.join('\n')}`);
      }
      
    } catch (error) {
      console.error('❌ Error importing blockchain transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error importing blockchain transactions: ${errorMessage}`);
    }
  }, [filters, globalSelectedCompany, cryptoWallets, refetch]);

  // Map wizard state to legacy blockchain import (for backwards compatibility)
  const mapWizardStateToBlockchainImport = useCallback((wizardState: WizardState) => {
    if (!wizardState.selectedBlockchain) return null;

    return {
      blockchain: wizardState.selectedBlockchain,
      currencies: wizardState.selectedCurrencies,
      startDate: wizardState.customDateRange?.startDate,
      endDate: wizardState.customDateRange?.endDate,
      period: wizardState.selectedPeriod
    };
  }, []);

  // Handle period filter changes
  const handlePeriodChange = useCallback((newPeriod: PeriodPreset) => {
    if (newPeriod === 'custom') {
      setShowCustomDateInputs(true);
      // Don't update the filter yet - wait for dates to be entered
    } else {
      setShowCustomDateInputs(false);
      setCustomStartDate('');
      setCustomEndDate('');
      updatePeriodFilter(newPeriod);
    }
  }, [updatePeriodFilter]);


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

        {/* Live Crypto Loading Status */}
        {(isLoadingWallets || isLoadingLiveCrypto) && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertCircle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span>
                  {isLoadingWallets ? 'Loading crypto wallets...' : 
                   isLoadingLiveCrypto ? 'Fetching live cryptocurrency transactions...' : 'Loading...'}
                </span>
              </div>
              {cryptoWallets && cryptoWallets.length > 0 && (
                <div className="mt-2 text-sm">
                  Found {cryptoWallets.length} crypto wallet{cryptoWallets.length !== 1 ? 's' : ''} for live data
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

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


            {/* Transaction Filter Wizard */}
            <TransactionFilterWizard
              onApplyFilters={handleWizardApplyFilters}
              isLoading={isLoadingLiveCrypto}
              className="mb-6"
            />

            {/* Search Bar */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>


            {/* Transactions List - Grouped by Account */}
            {hasTransactions ? (
              <div className="space-y-6">
                {transactionsByAccount.map((account) => (
                  <div key={`${account.accountType}-${account.accountId}-${account.currency}`} className="bg-white rounded-lg shadow">
                    {/* Account Header */}
                    <div className="px-6 py-4 border-b bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-lg ${
                            account.accountType === 'wallet' ? 'bg-purple-100' : 'bg-blue-100'
                          }`}>
                            {account.accountType === 'wallet' ? (
                              <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                              </svg>
                            ) : (
                              <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {(() => {
                                // Find matching wallet to get address
                                const matchingWallet = cryptoWallets?.find(w => w.walletName === account.accountName);
                                if (matchingWallet?.walletAddress) {
                                  const explorerUrl = getWalletExplorerUrl(matchingWallet.walletAddress, matchingWallet.blockchain);
                                  // Display wallet name with clickable address
                                  return (
                                    <span>
                                      {account.accountName}{' '}
                                      {explorerUrl ? (
                                        <a
                                          href={explorerUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 hover:underline font-normal text-base"
                                          title={`View wallet on blockchain explorer: ${matchingWallet.walletAddress}`}
                                        >
                                          ({matchingWallet.walletAddress})
                                        </a>
                                      ) : (
                                        <span className="text-gray-600 font-normal text-base">({matchingWallet.walletAddress})</span>
                                      )}
                                    </span>
                                  );
                                }
                                return account.accountName;
                              })()}
                            </h3>
                            <p className="text-sm text-gray-600">
                              {account.transactions.length} transaction{account.transactions.length !== 1 ? 's' : ''} • {account.currency}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-600">Net Amount</div>
                          <div className={`text-lg font-bold ${
                            account.netAmount >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {account.netAmount >= 0 ? '+' : ''}
                            {formatCurrencyAmount(account.netAmount, account.currency)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Account Statistics */}
                    <div className="px-6 py-3 border-b bg-gray-50/50">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <span className="text-xs text-gray-500">Total Incoming</span>
                          <p className="text-sm font-medium text-green-600">
                            +{formatCurrencyAmount(account.totalIncoming, account.currency)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Total Outgoing</span>
                          <p className="text-sm font-medium text-red-600">
                            -{formatCurrencyAmount(account.totalOutgoing, account.currency)}
                          </p>
                        </div>
                        <div>
                          <span className="text-xs text-gray-500">Transaction Count</span>
                          <p className="text-sm font-medium text-gray-900">
                            {account.transactions.length}
                          </p>
                        </div>
                      </div>
                      
                      {/* Balance Information Notice */}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-start space-x-2">
                          <svg className="h-4 w-4 text-blue-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="text-xs text-gray-600">
                            <span className="font-medium">Note:</span> The net amount shown ({formatCurrencyAmount(account.netAmount, account.currency)}) represents the sum of all transactions. 
                            The current balance may differ due to initial balances or transactions outside the selected period. 
                            View the Balances page for current balance information.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Transactions for this Account */}
                    <div className="p-6">
                      <div className="space-y-4">
                        {account.transactions.map((transaction) => {
                      const isSelected = uiState.selectedTransactions.has(transaction.id);
                      const isExpanded = uiState.expandedTransactions.has(transaction.id);
                      const isIncoming = transaction.incomingAmount > 0;
                      const blockchainInfo = getBlockchainInfo(transaction);
                      
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
                              
                              {/* Blockchain icon or status indicator */}
                              {blockchainInfo ? (
                                <div className="p-1 bg-purple-100 rounded-lg">
                                  <BlockchainIcon 
                                    blockchain={blockchainInfo.blockchain} 
                                    className="h-4 w-4" 
                                  />
                                </div>
                              ) : (
                                <div className={`w-3 h-3 rounded-full ${
                                  isIncoming ? 'bg-green-500' : 'bg-red-500'
                                }`} />
                              )}
                              
                              <div>
                                <div className="flex items-center space-x-2 flex-wrap">
                                  <div className="font-medium text-gray-900">
                                    {(() => {
                                      const name = isIncoming ? transaction.paidBy : transaction.paidTo;
                                      // Find matching wallet to get address for both incoming and outgoing
                                      // Check if it's our wallet (for incoming, check paidTo; for outgoing, check paidBy)
                                      const ourWalletName = isIncoming ? transaction.paidTo : transaction.paidBy;
                                      const matchingWallet = cryptoWallets?.find(w => w.walletName === ourWalletName);
                                      
                                      // If the displayed name is our wallet, show with address
                                      if (name === ourWalletName && matchingWallet?.walletAddress) {
                                        const explorerUrl = getWalletExplorerUrl(matchingWallet.walletAddress, matchingWallet.blockchain);
                                        return (
                                          <span>
                                            {name}{' '}
                                            {explorerUrl ? (
                                              <a
                                                href={explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                                title={`View wallet on blockchain explorer: ${matchingWallet.walletAddress}`}
                                              >
                                                ({matchingWallet.walletAddress})
                                              </a>
                                            ) : (
                                              <span className="text-gray-600">({matchingWallet.walletAddress})</span>
                                            )}
                                          </span>
                                        );
                                      }
                                      
                                      // Also check if the counterparty is one of our wallets
                                      const counterpartyWallet = cryptoWallets?.find(w => w.walletName === name);
                                      if (counterpartyWallet?.walletAddress) {
                                        const explorerUrl = getWalletExplorerUrl(counterpartyWallet.walletAddress, counterpartyWallet.blockchain);
                                        return (
                                          <span>
                                            {name}{' '}
                                            {explorerUrl ? (
                                              <a
                                                href={explorerUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:text-blue-800 hover:underline"
                                                title={`View wallet on blockchain explorer: ${counterpartyWallet.walletAddress}`}
                                              >
                                                ({counterpartyWallet.walletAddress})
                                              </a>
                                            ) : (
                                              <span className="text-gray-600">({counterpartyWallet.walletAddress})</span>
                                            )}
                                          </span>
                                        );
                                      }
                                      
                                      return name;
                                    })()}
                                  </div>
                                  
                                  {/* Blockchain badges */}
                                  {blockchainInfo && (
                                    <div className="flex items-center space-x-1">
                                      <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                                        {blockchainInfo.blockchain.toUpperCase()}
                                      </Badge>
                                      {blockchainInfo.tokenType !== 'native' && (
                                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                          {blockchainInfo.tokenType.toUpperCase()}
                                        </Badge>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Live transaction badge */}
                                  {transaction.id.startsWith('live-') && (
                                    <Badge className="text-xs bg-purple-100 text-purple-800">
                                      LIVE
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600">
                                  {(() => {
                                    const explorerUrl = getExplorerUrl(transaction);
                                    const reference = transaction.reference || 'No reference';
                                    
                                    if (explorerUrl) {
                                      return (
                                        <a
                                          href={explorerUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                                          title={`View transaction on blockchain explorer: ${reference}`}
                                        >
                                          {reference}
                                        </a>
                                      );
                                    } else {
                                      return reference;
                                    }
                                  })()}
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
                                {formatCurrencyAmount(Math.abs(transaction.netAmount), transaction.currency)}
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow p-12">
                <div className="text-center">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                  <p className="text-gray-600 mb-6">
                    {filters.searchTerm || filters.status !== 'all' || filters.dateRange !== 'all'
                      ? 'Try adjusting your filters to see more transactions.'
                      : isLoadingLiveCrypto && cryptoWallets && cryptoWallets.length > 0
                      ? 'Loading live cryptocurrency transactions...'
                      : 'Start by adding your first transaction or ensure you have crypto wallets configured.'
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