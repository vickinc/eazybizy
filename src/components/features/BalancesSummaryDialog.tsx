import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Wallet, 
  Building2,
  Calculator
} from "lucide-react";
import { AccountBalance } from '@/types/balance.types';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';

interface BalancesSummaryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  balances: AccountBalance[];
  title?: string;
}

export const BalancesSummaryDialog: React.FC<BalancesSummaryDialogProps> = ({
  isOpen,
  onClose,
  balances,
  title = "Balances Summary"
}) => {
  const formatCurrency = (amount: number, currency: string): string => {
    return BalanceBusinessService.formatCurrency(amount, currency);
  };

  const getAccountIcon = (isBank: boolean) => {
    return isBank ? <CreditCard className="h-4 w-4" /> : <Wallet className="h-4 w-4" />;
  };

  const getAccountDisplayName = (balance: AccountBalance) => {
    const isBank = BalanceBusinessService.isAccountBank(balance.account);
    if (isBank && 'bankName' in balance.account) {
      return balance.account.bankName;
    }
    if (!isBank && 'walletName' in balance.account) {
      return balance.account.walletName;
    }
    return balance.account.name || 'Unknown Account';
  };

  // Group balances by currency for total calculation
  const currencyTotals = balances.reduce((acc, balance) => {
    const currency = balance.currency;
    if (!acc[currency]) {
      acc[currency] = 0;
    }
    acc[currency] += balance.finalBalance;
    return acc;
  }, {} as Record<string, number>);

  // Sort balances by final balance (highest first)
  const sortedBalances = [...balances].sort((a, b) => b.finalBalance - a.finalBalance);

  const totalBalances = Object.values(currencyTotals).reduce((sum, amount) => sum + amount, 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader className="pb-4">
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            Overview of all account balances for the selected company
          </DialogDescription>
        </DialogHeader>

        <div className="overflow-y-auto max-h-[calc(85vh-120px)]">
          {/* Total Summary Header */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900">Total Balance</span>
              </div>
              <div className="text-right">
                {Object.keys(currencyTotals).length === 1 ? (
                  <div className="text-xl font-bold text-blue-900">
                    {formatCurrency(totalBalances, Object.keys(currencyTotals)[0])}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {Object.entries(currencyTotals)
                      .sort(([,a], [,b]) => Math.abs(b) - Math.abs(a))
                      .map(([currency, total]) => (
                        <div key={currency} className="text-lg font-bold text-blue-900">
                          {formatCurrency(total, currency)}
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-2 text-sm text-blue-700">
              {balances.length} account{balances.length !== 1 ? 's' : ''} • 
              {Object.keys(currencyTotals).length} currenc{Object.keys(currencyTotals).length !== 1 ? 'ies' : 'y'}
            </div>
          </div>

          {/* Account Grid */}
          {balances.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sortedBalances.map((balance) => {
                const isBank = BalanceBusinessService.isAccountBank(balance.account);
                const displayName = getAccountDisplayName(balance);
                const isPositive = balance.finalBalance >= 0;

                return (
                  <Card key={`${balance.account.id}-${isBank ? 'bank' : 'wallet'}`} className="hover:shadow-sm transition-shadow">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* Header with icon and name */}
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${isBank ? 'bg-blue-100' : 'bg-purple-100'}`}>
                            {getAccountIcon(isBank)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-gray-900 truncate">
                              {displayName}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={isBank ? "default" : "secondary"} className="text-xs">
                                {isBank ? 'Bank' : 'Wallet'}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {balance.currency}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Balance information */}
                        <div className="flex justify-between items-end">
                          <div className="text-xs text-gray-500">
                            {balance.initialBalance !== 0 && (
                              <div>Initial: {formatCurrency(balance.initialBalance, balance.currency)}</div>
                            )}
                          </div>
                          <div className={`text-lg font-semibold ${
                            isPositive ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {formatCurrency(balance.finalBalance, balance.currency)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No balances found for the selected filters.</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};