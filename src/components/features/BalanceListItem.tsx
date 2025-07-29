import React from 'react';
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
import { AccountBalance } from '@/types/balance.types';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';

interface BalanceListItemProps {
  balance: AccountBalance;
  onEditInitialBalance?: (accountId: string, accountType: 'bank' | 'wallet') => void;
  compact?: boolean;
}

export const BalanceListItem: React.FC<BalanceListItemProps> = ({
  balance,
  onEditInitialBalance,
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
    lastTransactionDate 
  } = balance;
  
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
};