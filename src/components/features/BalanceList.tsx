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
import { AccountBalance, GroupedBalances, BalanceGroupBy } from '@/types/balance.types';
import { BalanceListItem } from './BalanceListItem';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';

interface BalanceListProps {
  balances: AccountBalance[];
  groupedBalances: GroupedBalances;
  groupBy: BalanceGroupBy;
  loading?: boolean;
  onEditInitialBalance?: (accountId: string, accountType: 'bank' | 'wallet') => void;
  compact?: boolean;
}

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
  const totalBalance = balances.reduce((sum, balance) => sum + balance.finalBalance, 0);
  const accountCount = balances.length;
  const currencies = [...new Set(balances.map(b => b.currency))];
  
  // Get primary currency for display (most common or first)
  const primaryCurrency = currencies.length === 1 ? currencies[0] : 
    currencies.reduce((a, b) => 
      balances.filter(bal => bal.currency === a).length >= 
      balances.filter(bal => bal.currency === b).length ? a : b
    );

  const formatCurrency = (amount: number) => {
    return BalanceBusinessService.formatCurrency(amount, primaryCurrency);
  };

  const getGroupIcon = () => {
    if (groupName.includes('Bank')) return <CreditCard className="h-4 w-4" />;
    if (groupName.includes('Wallet')) return <Wallet className="h-4 w-4" />;
    if (groupName.includes('USD') || groupName.includes('EUR')) return <DollarSign className="h-4 w-4" />;
    return <Package className="h-4 w-4" />;
  };

  return (
    <div className="mb-2 border border-gray-200 rounded-lg">
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
            <div className={`font-bold text-lg ${totalBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalBalance)}
            </div>
            {currencies.length > 1 && (
              <div className="text-xs text-gray-500">
                Multi-currency
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
  compact = false
}) => {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>({});

  // Initialize all groups as expanded
  React.useEffect(() => {
    const initialExpanded: Record<string, boolean> = {};
    Object.keys(groupedBalances).forEach(groupName => {
      initialExpanded[groupName] = true;
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Account Balances</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-500">Loading balances...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (balances.length === 0) {
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
                {balances.length} account{balances.length !== 1 ? 's' : ''} found
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
                compact={compact}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grouped view
  const groupNames = Object.keys(groupedBalances);
  const allExpanded = Object.values(expandedGroups).every(Boolean);

  return (
    <div className="space-y-4">
      {/* Header with expand/collapse all */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Account Balances</CardTitle>
              <CardDescription>
                {balances.length} account{balances.length !== 1 ? 's' : ''} in {groupNames.length} group{groupNames.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={toggleAllGroups}
              className="flex items-center gap-2"
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
        </CardHeader>
      </Card>

      {/* Grouped Balances */}
      {groupNames.map((groupName) => {
        const groupBalances = groupedBalances[groupName];
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
                {groupBalances.map((balance) => (
                  <BalanceListItem
                    key={`${balance.account.id}-${BalanceBusinessService.isAccountBank(balance.account) ? 'bank' : 'wallet'}`}
                    balance={balance}
                    onEditInitialBalance={onEditInitialBalance}
                    compact={compact}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};