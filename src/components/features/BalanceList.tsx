import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronRight from "lucide-react/dist/esm/icons/chevron-right";
import Landmark from "lucide-react/dist/esm/icons/landmark";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Package from "lucide-react/dist/esm/icons/package";
import Eye from "lucide-react/dist/esm/icons/eye";
import EyeOff from "lucide-react/dist/esm/icons/eye-off";
import Edit2 from "lucide-react/dist/esm/icons/edit-2";
import { AccountBalance, GroupedBalances, BalanceGroupBy } from '@/types/balance.types';
import { BalanceListItem } from './BalanceListItem';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';
import { Skeleton } from '@/components/ui/loading-states';

interface BalanceListProps {
  balances: AccountBalance[];
  groupedBalances: GroupedBalances;
  groupBy: BalanceGroupBy;
  loading?: boolean;
  onEditInitialBalance?: (accountId: string, accountType: 'bank' | 'wallet') => void;
  onRefreshBlockchain?: (walletId: string) => Promise<void>;
  compact?: boolean;
}

interface CryptoBalancesContentProps {
  cryptoBalances: any[];
  onEditInitialBalance?: (accountId: string, accountType: 'bank' | 'wallet') => void;
}

// Server-side USD Display Component - uses server-calculated USD amounts for consistency
const ServerUSDDisplay: React.FC<{ usdAmount: number }> = ({ usdAmount }) => {
  return (
    <div className="text-xs text-gray-600">
      ≈ ${usdAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
    </div>
  );
};

// Crypto Balances Content Component
const CryptoBalancesContent: React.FC<CryptoBalancesContentProps> = ({ 
  cryptoBalances, 
  onEditInitialBalance 
}) => {
  // Group balances by original wallet ID
  const walletGroups: { [key: string]: any[] } = {};
  
  cryptoBalances.forEach(balance => {
    let originalAccountId = balance.account.id;
    // For multi-currency wallets, extract original wallet ID
    if (balance.account.id.includes('-')) {
      originalAccountId = balance.account.id.split('-')[0];
    }
    
    if (!walletGroups[originalAccountId]) {
      walletGroups[originalAccountId] = [];
    }
    walletGroups[originalAccountId].push(balance);
  });

  return (
    <div className="bg-lime-100 rounded-lg p-4 ml-4">
      <div className="space-y-3">
        {Object.entries(walletGroups).map(([walletId, walletBalances]) => {
          // Get the base wallet info from the first balance
          const firstBalance = walletBalances[0];
          const walletName = firstBalance.account.walletName?.replace(/\s*\([^)]*\)$/, '') || walletId;
          
          return (
            <div key={walletId} className="bg-white rounded-lg p-4 shadow-sm">
              {/* Wallet header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-lime-100 rounded-lg">
                    <Wallet className="h-4 w-4 text-lime-600" />
                  </div>
                  <div>
                    <div className="font-medium text-base">{walletName}</div>
                    <div className="text-xs text-gray-600">
                      {firstBalance.company.tradingName} • {walletBalances.length} currencies
                    </div>
                  </div>
                </div>
              </div>

              {/* Currency balances */}
              <div className="space-y-2">
                {walletBalances.map((balance: any) => (
                  <div key={balance.currency} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-lime-300"></div>
                      <span className="font-medium text-sm">{balance.currency}</span>
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${balance.finalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {['USDT', 'USDC', 'BUSD'].includes(balance.currency.toUpperCase()) 
                          ? balance.finalBalance.toFixed(2) 
                          : balance.finalBalance.toFixed(8)
                        } {balance.currency}
                      </div>
                      {balance.currency !== 'USD' && balance.finalBalanceUSD !== undefined && (
                        <ServerUSDDisplay usdAmount={balance.finalBalanceUSD} />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Edit buttons for initial balances */}
              {walletBalances.some(b => Math.abs(b.initialBalance) > 0.01) && (
                <div className="mt-3 pt-3 border-t">
                  <div className="text-xs text-gray-500 mb-2">Initial balances:</div>
                  {walletBalances
                    .filter(b => Math.abs(b.initialBalance) > 0.01)
                    .map((balance: any) => (
                    <div key={`initial-${balance.currency}`} className="flex justify-between items-center py-1">
                      <span className="text-xs text-gray-500">
                        {balance.currency}: {BalanceBusinessService.formatCurrency(balance.initialBalance, balance.currency)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEditInitialBalance?.(balance.account.id, 'wallet')}
                        className="h-5 px-2"
                      >
                        <Edit2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

interface GroupHeaderProps {
  groupName: string;
  balances: AccountBalance[];
  isExpanded: boolean;
  onToggle: () => void;
  compact?: boolean;
}

const GroupHeader: React.FC<GroupHeaderProps> = ({
  groupName,
  balances,
  isExpanded,
  onToggle,
  compact = false
}) => {
  // Count unique accounts, not currency entries
  const uniqueAccountIds = new Set<string>();
  balances.forEach(balance => {
    let originalAccountId = balance.account.id;
    // For multi-currency wallets, extract original wallet ID
    if (balance.account.id.includes('-')) {
      originalAccountId = balance.account.id.split('-')[0];
    }
    uniqueAccountIds.add(originalAccountId);
  });
  const accountCount = uniqueAccountIds.size;
  
  const currencies = [...new Set(balances.map(b => b.currency))];
  
  // Calculate total balance - if multiple currencies, show multi-currency indicator
  const hasMixedCurrencies = currencies.length > 1;
  const totalBalance = balances.reduce((sum, balance) => sum + balance.finalBalance, 0);
  
  // For mixed currencies, calculate USD equivalent
  const [totalBalanceUSD, setTotalBalanceUSD] = React.useState<number | null>(null);

  React.useEffect(() => {
    if (hasMixedCurrencies) {
      // Use server-provided USD amounts for consistency
      const total = balances.reduce((sum, balance) => {
        return sum + (balance.finalBalanceUSD || 0);
      }, 0);
      setTotalBalanceUSD(total);
    }
  }, [balances, hasMixedCurrencies]);

  const formatCurrency = (amount: number) => {
    return BalanceBusinessService.formatCurrency(amount, 'USD');
  };

  const getGroupIcon = () => {
    if (groupName.includes('Bank')) return <CreditCard className="h-4 w-4" />;
    if (groupName.includes('Wallet')) return <Wallet className="h-4 w-4" />;
    if (groupName.includes('USD') || groupName.includes('EUR')) return <DollarSign className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  return (
    <div className="mb-2 border border-gray-200 rounded-lg hover:bg-lime-100 transition-colors duration-200">
      <div className="p-4">
        <Button
          variant="ghost"
          onClick={onToggle}
          className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
        >
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-gray-500" />
              ) : (
                <ChevronRight className="h-4 w-4 text-gray-500" />
              )}
              <div className="p-2">
                {getGroupIcon()}
              </div>
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-lg">{groupName}</h3>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{accountCount} account{accountCount !== 1 ? 's' : ''}</span>
                {currencies.length > 1 && (
                  <span>{currencies.length} currencies</span>
                )}
              </div>
            </div>
          </div>

          <div className="text-right">
            {hasMixedCurrencies ? (
              totalBalanceUSD !== null ? (
                <div>
                  <div className={`font-bold text-lg ${totalBalanceUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(totalBalanceUSD)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {currencies.length} currencies
                  </div>
                </div>
              ) : (
                <div>
                  <div className="font-bold text-lg text-gray-500">
                    Calculating...
                  </div>
                  <div className="text-xs text-gray-500">
                    {currencies.length} currencies
                  </div>
                </div>
              )
            ) : (
              <div className={`font-bold text-lg ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(totalBalance)}
              </div>
            )}
          </div>
        </Button>
      </div>
    </div>
  );
};

export const BalanceList: React.FC<BalanceListProps> = ({
  balances,
  groupedBalances,
  groupBy,
  loading = false,
  onEditInitialBalance,
  onRefreshBlockchain,
  compact = false
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  // Initialize all groups as collapsed by default
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(groupedBalances).forEach(groupName => {
      initialExpanded[groupName] = false;
    });
    setExpandedGroups(initialExpanded);
  }, [groupedBalances]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupName]: !prev[groupName]
    }));
  };

  const toggleAllGroups = () => {
    const allExpanded = Object.values(expandedGroups).every(Boolean);
    const newState: Record<string, boolean> = {};
    Object.keys(groupedBalances).forEach(groupName => {
      newState[groupName] = !allExpanded;
    });
    setExpandedGroups(newState);
  };

  // Show structure immediately and let individual items handle loading states

  if (balances.length === 0) {
    if (loading) {
      return (
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
      );
    }
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
          <CardDescription>No accounts found with the current filters.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Landmark className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-lg font-medium mb-2 text-gray-500">No Balances Found</p>
            <p className="text-gray-400">
              Try adjusting your filters or add some bank accounts and wallets to get started.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // If no grouping, show simple list
  if (groupBy === 'none') {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>
                {getUniqueAccountCount(balances)} account{getUniqueAccountCount(balances) !== 1 ? 's' : ''} found
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {balances.map((balance) => (
              <BalanceListItem
                key={`${balance.account.id}-${BalanceBusinessService.isAccountBank(balance.account) ? 'bank' : 'wallet'}`}
                balance={balance}
                onEditInitialBalance={onEditInitialBalance}
                onRefreshBlockchain={onRefreshBlockchain}
                compact={compact}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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

  // Grouped view
  const groupNames = Object.keys(groupedBalances);
  const allExpanded = Object.values(expandedGroups).every(Boolean);

  return (
    <div className="space-y-4">
      {/* Header with expand/collapse all */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Account Balances</h2>
          <p className="text-sm text-gray-600">
            {getUniqueAccountCount(balances)} account{getUniqueAccountCount(balances) !== 1 ? 's' : ''} in {groupNames.length} group{groupNames.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={toggleAllGroups}
          className="flex items-center gap-2 bg-lime-200 hover:bg-lime-100 transition-colors duration-200"
        >
          {allExpanded ? (
            <>
              <EyeOff className="h-4 w-4" />
              Collapse All
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Expand All
            </>
          )}
        </Button>
      </div>

      {/* Check if we have crypto balances to group */}
      {(() => {
        // Identify crypto balances
        const cryptoCurrencies = ['BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'SOL', 'TRX', 'MATIC', 'AVAX', 'DOT', 'LINK', 'UNI', 'SATS'];
        const cryptoBalances: any[] = [];
        const nonCryptoGroups: any = {};

        // Separate crypto and non-crypto balances
        groupNames.forEach(groupName => {
          const groupBalances = groupedBalances[groupName];
          const cryptoInGroup: any[] = [];
          const nonCryptoInGroup: any[] = [];

          groupBalances.forEach((balance: any) => {
            const isCryptoWallet = !BalanceBusinessService.isAccountBank(balance.account) && 
              (balance.account as any).walletType?.toLowerCase() === 'crypto';
            const isCryptoCurrency = cryptoCurrencies.includes(balance.currency.toUpperCase()) || isCryptoWallet;

            if (isCryptoCurrency) {
              cryptoInGroup.push(balance);
            } else {
              nonCryptoInGroup.push(balance);
            }
          });

          // Add crypto balances to unified list
          cryptoBalances.push(...cryptoInGroup);

          // Keep non-crypto balances in their original groups
          if (nonCryptoInGroup.length > 0) {
            nonCryptoGroups[groupName] = nonCryptoInGroup;
          }
        });

        return (
          <>
            {/* Unified Crypto Card */}
            {cryptoBalances.length > 0 && (
              <div key="crypto-unified" className="mb-4">
                {/* Crypto Group Header */}
                <div className="mb-2 border border-gray-200 rounded-lg hover:bg-lime-100 transition-colors duration-200">
                  <div className="p-4">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        const cryptoGroupName = 'Cryptocurrency Balances';
                        toggleGroup(cryptoGroupName);
                      }}
                      className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {expandedGroups['Cryptocurrency Balances'] ? (
                            <ChevronDown className="h-4 w-4 text-gray-500" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-500" />
                          )}
                          <div className="p-2">
                            <Wallet className="h-4 w-4 text-lime-600" />
                          </div>
                        </div>
                        <div className="text-left">
                          <h3 className="font-semibold text-lg">Cryptocurrency Balances</h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span>{(() => {
                              const uniqueAccountIds = new Set<string>();
                              cryptoBalances.forEach(balance => {
                                let originalAccountId = balance.account.id;
                                // For multi-currency wallets, extract original wallet ID
                                if (balance.account.id.includes('-')) {
                                  originalAccountId = balance.account.id.split('-')[0];
                                }
                                uniqueAccountIds.add(originalAccountId);
                              });
                              const count = uniqueAccountIds.size;
                              return `${count} account${count !== 1 ? 's' : ''}`;
                            })()}</span>
                            <span>{[...new Set(cryptoBalances.map(b => b.currency))].length} currencies</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        {(() => {
                          // Calculate total USD equivalent using server-provided USD amounts
                          const totalBalanceUSD = cryptoBalances.reduce((total, balance) => {
                            return total + (balance.finalBalanceUSD || 0);
                          }, 0);

                          return (
                            <div>
                              <div className={`font-bold text-lg ${totalBalanceUSD >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {BalanceBusinessService.formatCurrency(totalBalanceUSD, 'USD')}
                              </div>
                              <div className="text-xs text-gray-500">
                                {[...new Set(cryptoBalances.map(b => b.currency))].length} currencies
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </Button>
                  </div>
                </div>

                {/* Crypto Content - Only show if expanded */}
                {expandedGroups['Cryptocurrency Balances'] && (
                  <CryptoBalancesContent 
                    cryptoBalances={cryptoBalances}
                    onEditInitialBalance={onEditInitialBalance}
                  />
                )}
              </div>
            )}

            {/* Regular Non-Crypto Groups */}
            {Object.keys(nonCryptoGroups).map((groupName) => {
              const groupBalances = nonCryptoGroups[groupName];
              const isExpanded = expandedGroups[groupName];

              return (
                <div key={groupName}>
                  <GroupHeader
                    groupName={groupName}
                    balances={groupBalances}
                    isExpanded={isExpanded}
                    onToggle={() => toggleGroup(groupName)}
                    compact={compact}
                  />
                  
                  {isExpanded && (
                    <div className="ml-4 space-y-4">
                      {groupBalances.map((balance: any) => (
                        <BalanceListItem
                          key={`${balance.account.id}-${BalanceBusinessService.isAccountBank(balance.account) ? 'bank' : 'wallet'}`}
                          balance={balance}
                          onEditInitialBalance={onEditInitialBalance}
                          onRefreshBlockchain={onRefreshBlockchain}
                          compact={compact}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </>
        );
      })()}
    </div>
  );
};