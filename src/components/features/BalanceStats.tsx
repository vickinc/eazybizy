import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import PieChart from "lucide-react/dist/esm/icons/pie-chart";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import CreditCard from "lucide-react/dist/esm/icons/credit-card";
import Wallet from "lucide-react/dist/esm/icons/wallet";
import Building from "lucide-react/dist/esm/icons/building";
import MousePointer2 from "lucide-react/dist/esm/icons/mouse-pointer-2";
import { BalanceSummary } from '@/types/balance.types';
import { BalanceBusinessService } from '@/services/business/balanceBusinessService';

interface BalanceStatsProps {
  summary: BalanceSummary;
  loading?: boolean;
  baseCurrency?: string;
  onSummaryClick?: () => void;
}

export const BalanceStats: React.FC<BalanceStatsProps> = ({
  summary,
  loading = false,
  baseCurrency = 'USD',
  onSummaryClick
}) => {
  const formatCurrency = (amount: number, currency = baseCurrency): string => {
    return BalanceBusinessService.formatCurrency(amount, currency);
  };

  const getChangeColor = (amount: number): string => {
    if (amount > 0) return 'text-green-600';
    if (amount < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getChangeIcon = (amount: number) => {
    if (amount > 0) return <TrendingUp className="h-4 w-4" />;
    if (amount < 0) return <TrendingDown className="h-4 w-4" />;
    return <PieChart className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const mainCurrencies = Object.keys(summary.currencyBreakdown)
    .sort((a, b) => 
      Math.abs(summary.currencyBreakdown[b].netWorth) - 
      Math.abs(summary.currencyBreakdown[a].netWorth)
    )
    .slice(0, 3);

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        {/* Total Assets */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card 
              className={`transition-all duration-200 ${onSummaryClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] border-2 hover:border-blue-300' : 'cursor-help hover:shadow-md'}`}
              onClick={onSummaryClick}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  <div className="flex items-center">
                    <DollarSign className={`h-4 w-4 mr-2 ${getChangeColor(summary.totalAssets)}`} />
                    Total Assets
                  </div>
                  {onSummaryClick && (
                    <MousePointer2 className="h-3 w-3 text-blue-500 opacity-60" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${getChangeColor(summary.totalAssets)}`}>
                  {formatCurrency(summary.totalAssets)}
                </div>
                {mainCurrencies.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Multi-currency
                  </div>
                )}
                {onSummaryClick && (
                  <div className="text-xs text-blue-600 mt-1 font-medium">
                    Click for details
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Total value of all positive balances</p>
              {onSummaryClick && (
                <p className="text-blue-600 font-medium">Click to view detailed summary</p>
              )}
              {Object.keys(summary.currencyBreakdown).length > 1 && (
                <div className="text-xs">
                  <p className="font-medium">By Currency:</p>
                  {mainCurrencies.map(currency => (
                    <p key={currency}>
                      {currency}: {formatCurrency(summary.currencyBreakdown[currency].assets, currency)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Total Liabilities */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <TrendingDown className={`h-4 w-4 mr-2 ${summary.totalLiabilities > 0 ? 'text-red-600' : 'text-gray-400'}`} />
                  Total Liabilities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${summary.totalLiabilities > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatCurrency(summary.totalLiabilities)}
                </div>
                {mainCurrencies.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Multi-currency
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Total value of all negative balances</p>
              {Object.keys(summary.currencyBreakdown).length > 1 && (
                <div className="text-xs">
                  <p className="font-medium">By Currency:</p>
                  {mainCurrencies.map(currency => (
                    <p key={currency}>
                      {currency}: {formatCurrency(summary.currencyBreakdown[currency].liabilities, currency)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Net Worth */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  {getChangeIcon(summary.netWorth)}
                  <span className="ml-2">Net Worth</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${getChangeColor(summary.netWorth)}`}>
                  {formatCurrency(summary.netWorth)}
                </div>
                {summary.totalAssets > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {((summary.netWorth / summary.totalAssets) * 100).toFixed(1)}% of assets
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Net worth (Assets - Liabilities)</p>
              <p className="text-xs">
                Assets: {formatCurrency(summary.totalAssets)} - 
                Liabilities: {formatCurrency(summary.totalLiabilities)}
              </p>
              {Object.keys(summary.currencyBreakdown).length > 1 && (
                <div className="text-xs">
                  <p className="font-medium">By Currency:</p>
                  {mainCurrencies.map(currency => (
                    <p key={currency}>
                      {currency}: {formatCurrency(summary.currencyBreakdown[currency].netWorth, currency)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>

        {/* Account Summary */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {summary.accountCount}
                </div>
                <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                  <div className="flex items-center space-x-1">
                    <CreditCard className="h-3 w-3" />
                    <span>{summary.bankAccountCount}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Wallet className="h-3 w-3" />
                    <span>{summary.walletCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Total number of accounts tracked</p>
              <div className="text-xs">
                <p>Bank Accounts: {summary.bankAccountCount}</p>
                <p>Digital Wallets: {summary.walletCount}</p>
                {Object.keys(summary.currencyBreakdown).length > 1 && (
                  <p>Currencies: {Object.keys(summary.currencyBreakdown).length}</p>
                )}
              </div>
            </div>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Currency Breakdown (if multiple currencies) */}
      {Object.keys(summary.currencyBreakdown).length > 1 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Building className="h-5 w-5 mr-2" />
              Currency Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(summary.currencyBreakdown)
                .sort(([,a], [,b]) => Math.abs(b.netWorth) - Math.abs(a.netWorth))
                .map(([currency, breakdown]) => (
                  <Card key={currency} className="bg-gray-50">
                    <CardContent className="p-4">
                      <div className="text-center">
                        <div className="font-semibold text-lg mb-2">{currency}</div>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Assets:</span>
                            <span className={getChangeColor(breakdown.assets)}>
                              {formatCurrency(breakdown.assets, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Liabilities:</span>
                            <span className={breakdown.liabilities > 0 ? 'text-red-600' : 'text-gray-600'}>
                              {formatCurrency(breakdown.liabilities, currency)}
                            </span>
                          </div>
                          <div className="flex justify-between font-medium border-t pt-1">
                            <span>Net:</span>
                            <span className={getChangeColor(breakdown.netWorth)}>
                              {formatCurrency(breakdown.netWorth, currency)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </TooltipProvider>
  );
};