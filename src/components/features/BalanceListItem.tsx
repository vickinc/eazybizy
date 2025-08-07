import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Building from "lucide-react/dist/esm/icons/building";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Info from "lucide-react/dist/esm/icons/info";
import RefreshCw from "lucide-react/dist/esm/icons/refresh-cw";
import CheckCircle from "lucide-react/dist/esm/icons/check-circle";
import AlertCircle from "lucide-react/dist/esm/icons/alert-circle";
import Clock from "lucide-react/dist/esm/icons/clock";
import { AccountBalance } from '@/types/balance.types';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';
import { DigitalWallet } from '@/types/payment.types';

interface BalanceListItemProps {
  balance: AccountBalance;
  onEditInitialBalance?: (accountId: string, accountType: 'bank' | 'wallet') => void;
  onRefreshBlockchain?: (walletId: string) => Promise<void>;
  compact?: boolean;
}

export const BalanceListItem: React.FC<BalanceListItemProps> = React.memo(({
  balance,
  onEditInitialBalance,
  onRefreshBlockchain,
  compact = false
}) => {
  const { 
    account, 
    company, 
    initialBalance, 
    transactionBalance, 
    finalBalance, 
    incomingAmount, 
    outgoingAmount, 
    currency, 
    lastTransactionDate,
    blockchainBalance,
    blockchainSyncStatus
  } = balance;
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const isBank = BalanceBusinessService.isAccountBank(account);
  const isPositive = finalBalance >= 0;
  const hasInitialBalance = Math.abs(initialBalance) > 0.01;
  const hasTransactions = Math.abs(transactionBalance) > 0.01;

  const formatCurrency = (amount: number) => {
    return BalanceBusinessService.formatCurrency(amount, currency);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const getBalanceColor = (amount: number) => {
    if (Math.abs(amount) < 0.01) return 'text-gray-500';
    return amount >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const handleEditClick = () => {
    if (onEditInitialBalance) {
      onEditInitialBalance(account.id, isBank ? 'bank' : 'wallet');
    }
  };

  const handleRefreshBlockchain = async () => {
    if (!onRefreshBlockchain || isBank) return;
    
    setIsRefreshing(true);
    try {
      await onRefreshBlockchain(account.id);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getBlockchainSyncIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    
    switch (blockchainSyncStatus) {
      case 'synced':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const isCryptoWallet = !isBank && (account as DigitalWallet).walletType?.toLowerCase() === 'crypto';
  const hasBlockchainData = blockchainBalance && blockchainBalance.isLive;

  // Check if this is a cryptocurrency (common crypto currencies)
  const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'TRX', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI', 'SATS'];
  const isCryptoCurrency = cryptoCurrencies.includes(currency.toUpperCase()) || isCryptoWallet;

  // For crypto, calculate USD equivalent
  const [usdEquivalent, setUsdEquivalent] = useState<number | null>(null);
  
  useEffect(() => {
    if (isCryptoCurrency && currency !== 'USD') {
      // Fetch USD equivalent using the CurrencyService
      import('@/services/business/currencyService').then(({ CurrencyService }) => {
        CurrencyService.convertToUSDAsync(finalBalance, currency)
          .then(setUsdEquivalent)
          .catch(() => setUsdEquivalent(null));
      });
    }
  }, [finalBalance, currency, isCryptoCurrency]);

  if (compact) {
    return (
      <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-gray-50">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            {isBank ? (
              <CreditCard className="h-4 w-4 text-blue-600" />
            ) : (
              <Wallet className="h-4 w-4 text-purple-600" />
            )}
          </div>
          <div>
            <div className="font-medium">
              {isBank 
                ? (account.accountName || account.bankName) 
                : account.walletName}
            </div>
            <div className="text-sm text-gray-500">{company.tradingName}</div>
          </div>
        </div>
        <div className="text-right">
          <div className={`font-bold ${getBalanceColor(finalBalance)}`}>
            {formatCurrency(finalBalance)}
          </div>
          <div className="text-xs text-gray-500">{currency}</div>
        </div>
      </div>
    );
  }

  // Show compact view for cryptocurrency balances
  if (isCryptoCurrency) {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-3">
          <div className="flex items-center justify-between">
            {/* Left side - Account info */}
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Wallet className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-base">
                  {isBank 
                    ? (account.accountName || account.bankName) 
                    : account.walletName}
                </h3>
                <div className="flex items-center space-x-2 text-xs text-gray-600">
                  <span>{company.tradingName}</span>
                  {lastTransactionDate && (
                    <>
                      <span>•</span>
                      <span>Last: {formatDate(lastTransactionDate)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Right side - Crypto amount and USD equivalent */}
            <div className="text-right">
              <div className={`font-bold text-lg ${getBalanceColor(finalBalance)}`}>
                {finalBalance.toFixed(8)} {currency}
              </div>
              {usdEquivalent !== null && currency !== 'USD' && (
                <div className="text-sm text-gray-600">
                  ≈ ${usdEquivalent.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              )}
              {/* Blockchain sync status for crypto wallets */}
              {isCryptoWallet && (
                <div className="flex items-center justify-end mt-1 space-x-1">
                  {getBlockchainSyncIcon()}
                  {onRefreshBlockchain && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleRefreshBlockchain}
                      disabled={isRefreshing}
                      className="h-5 px-1 text-purple-600 hover:text-purple-800"
                    >
                      <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Optional: Show initial balance button if exists */}
          {hasInitialBalance && (
            <div className="mt-2 pt-2 border-t flex justify-between items-center">
              <span className="text-xs text-gray-500">Initial: {formatCurrency(initialBalance)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleEditClick}
                className="h-5 px-2"
              >
                <Edit2 className="h-3 w-3" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Regular full view for non-crypto accounts
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start space-x-3">
            <div className="p-3 bg-gray-100 rounded-lg">
              {isBank ? (
                <CreditCard className="h-6 w-6 text-blue-600" />
              ) : (
                <Wallet className="h-6 w-6 text-purple-600" />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {isBank 
                  ? (account.accountName || account.bankName) 
                  : account.walletName}
              </h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span>{company.tradingName}</span>
              </div>
              {isBank && 'accountName' in account && (
                <div className="text-sm text-gray-500 mt-1">
                  Account: {account.accountName}
                </div>
              )}
              {isBank && 'accountNumber' in account && account.accountNumber && (
                <div className="text-sm text-gray-500 mt-1">
                  Number: {account.accountNumber}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-start space-x-2">
            <Badge variant={isBank ? "default" : "secondary"}>
              {isBank ? 'Bank' : 'Wallet'}
            </Badge>
            <Badge variant="outline">{currency}</Badge>
          </div>
        </div>

        {/* Balance Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 bg-blue-50 rounded-lg cursor-help">
                  <div className="text-sm text-gray-600 mb-1">Initial Balance</div>
                  <div className={`font-semibold ${getBalanceColor(initialBalance)}`}>
                    {formatCurrency(initialBalance)}
                  </div>
                  {hasInitialBalance && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleEditClick}
                      className="mt-1 h-6 px-2"
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Manually entered starting balance</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 bg-green-50 rounded-lg cursor-help">
                  <div className="text-sm text-gray-600 mb-1">Incoming</div>
                  <div className={`font-semibold ${getBalanceColor(incomingAmount)}`}>
                    +{formatCurrency(incomingAmount)}
                  </div>
                  {incomingAmount > 0 && (
                    <div className="flex items-center justify-center mt-1">
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total incoming transactions for selected period</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="text-center p-3 bg-red-50 rounded-lg cursor-help">
                  <div className="text-sm text-gray-600 mb-1">Outgoing</div>
                  <div className={`font-semibold ${outgoingAmount > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                    -{formatCurrency(outgoingAmount)}
                  </div>
                  {outgoingAmount > 0 && (
                    <div className="flex items-center justify-center mt-1">
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    </div>
                  )}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total outgoing transactions for selected period</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Final Balance</div>
            <div className={`font-bold text-lg ${getBalanceColor(finalBalance)}`}>
              {formatCurrency(finalBalance)}
            </div>
            <div className="flex items-center justify-center mt-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </div>
          </div>
        </div>

        {/* Blockchain Balance Section - Only for crypto wallets */}
        {isCryptoWallet && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <h4 className="text-sm font-medium text-purple-900">Blockchain Balance</h4>
                {getBlockchainSyncIcon()}
              </div>
              {onRefreshBlockchain && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefreshBlockchain}
                  disabled={isRefreshing}
                  className="h-7 px-2 text-purple-700 hover:text-purple-900 hover:bg-purple-100"
                >
                  <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
            </div>
            
            {hasBlockchainData ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">On-chain Balance:</span>
                  <span className={`font-semibold ${getBalanceColor(blockchainBalance.balance)}`}>
                    {blockchainBalance.balance} {blockchainBalance.unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Calculated Balance:</span>
                  <span className={`font-semibold ${getBalanceColor(finalBalance)}`}>
                    {formatCurrency(finalBalance)}
                  </span>
                </div>
                {Math.abs(blockchainBalance.balance - finalBalance) > 0.01 && (
                  <div className="mt-2 p-2 bg-yellow-100 rounded-md">
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                      <div className="text-xs text-yellow-800">
                        <p className="font-medium">Balance Discrepancy Detected</p>
                        <p>The on-chain balance differs from the calculated balance. This could be due to:</p>
                        <ul className="list-disc list-inside mt-1">
                          <li>Unrecorded transactions</li>
                          <li>Pending transactions</li>
                          <li>External transfers</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  Last synced: {new Date(blockchainBalance.lastUpdated).toLocaleString()}
                </div>
              </div>
            ) : blockchainSyncStatus === 'error' && blockchainBalance?.error ? (
              <div className="space-y-2">
                <div className="text-sm text-red-600">
                  Error: {blockchainBalance.error}
                </div>
                {blockchainBalance.error.includes('address_not_synced') && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      const wallet = account as DigitalWallet;
                      try {
                        const response = await fetch('/api/blockchain/sync', {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json'
                          },
                          body: JSON.stringify({
                            address: wallet.walletAddress,
                            blockchain: wallet.blockchain,
                            network: 'mainnet'
                          })
                        });
                        
                        const result = await response.json();
                        if (result.success) {
                          alert('Address sync initiated! Please refresh in a few minutes to see the balance.');
                        } else {
                          alert('Sync failed: ' + result.error);
                        }
                      } catch (error) {
                        alert('Sync failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
                      }
                    }}
                    className="h-7 px-2 text-xs"
                  >
                    🔄 Sync Address
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-sm text-gray-600">
                {(account as DigitalWallet).walletAddress ? 
                  'Click refresh to fetch on-chain balance' : 
                  'No wallet address configured'}
              </div>
            )}
          </div>
        )}

        {/* Additional Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 pt-4 border-t">
          <div className="flex items-center space-x-4">
            {lastTransactionDate && (
              <div className="flex items-center space-x-1">
                <Calendar className="h-4 w-4" />
                <span>Last transaction: {formatDate(lastTransactionDate)}</span>
              </div>
            )}
            {!hasInitialBalance && onEditInitialBalance && (
              <Button
                size="sm"
                onClick={handleEditClick}
                className="bg-blue-600 text-white hover:bg-white hover:text-black border hover:border-black h-8 px-3"
              >
                <DollarSign className="h-3 w-3 mr-1" />
                Set Initial Balance
              </Button>
            )}
          </div>

          {(Math.abs(finalBalance) < 0.01) && (
            <div className="flex items-center space-x-1 text-yellow-600">
              <Info className="h-4 w-4" />
              <span>Zero Balance</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});

// Add display name for better debugging
BalanceListItem.displayName = 'BalanceListItem';