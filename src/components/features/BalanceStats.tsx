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
import { Skeleton } from '@/components/ui/loading-states';
import CurrencyBreakdownPieChart from './CurrencyBreakdownPieChart';

interface BalanceStatsProps {
  summary: BalanceSummary;
  loading?: boolean;
  baseCurrency?: string;
  onSummaryClick?: () => void;
  selectedPeriod?: string;
  customDateRange?: { startDate: string; endDate: string };
  asOfDate?: string;
}

export const BalanceStats: React.FC<BalanceStatsProps> = ({
  summary,
  loading = false,
  baseCurrency = 'USD',
  onSummaryClick,
  selectedPeriod = 'thisMonth',
  customDateRange,
  asOfDate
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

  const getPeriodDisplayText = () => {
    switch (selectedPeriod) {
      case 'thisMonth':
        return 'This Month';
      case 'lastMonth':
        return 'Last Month';
      case 'thisYear':
        return 'This Year';
      case 'lastYear':
        return 'Last Year';
      case 'allTime':
        return 'All Time';
      case 'custom':
        if (customDateRange?.startDate && customDateRange?.endDate) {
          const startDate = new Date(customDateRange.startDate).toLocaleDateString();
          const endDate = new Date(customDateRange.endDate).toLocaleDateString();
          return `${startDate} - ${endDate}`;
        }
        return 'Custom Range';
      case 'asOfDate':
        if (asOfDate) {
          const date = new Date(asOfDate).toLocaleDateString();
          return `As of ${date}`;
        }
        return 'As of Date';
      default:
        return 'Current Period';
    }
  };

  if (loading) {
    return (
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
              className={`transition-all duration-200 ${onSummaryClick ? 'cursor-pointer hover:shadow-lg hover:scale-[1.02] border-2 hover:border-lime-300' : 'cursor-help hover:shadow-md'}`}
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
                <div className={`text-xl sm:text-2xl font-bold ${getChangeColor(summary.totalAssetsUSD)}`}>
                  {formatCurrency(summary.totalAssetsUSD, 'USD')}
                </div>
                {mainCurrencies.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Multi-currency (USD equivalent)
                  </div>
                )}
                <div className="text-xs text-gray-500 mt-1">
                  {getPeriodDisplayText()}
                </div>
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
              <p>Total value of all positive balances (USD equivalent)</p>
              {onSummaryClick && (
                <p className="text-blue-600 font-medium">Click to view detailed summary</p>
              )}
              {Object.keys(summary.currencyBreakdown).length > 1 && (
                <div className="text-xs mt-2 pt-2 border-t">
                  <p className="font-medium mb-1">By Original Currency:</p>
                  {mainCurrencies.map(currency => {
                    const amount = summary.currencyBreakdown[currency].assets;
                    return (
                      <p key={currency}>
                        {currency}: {amount.toFixed(currency === 'ETH' || currency === 'BTC' ? 8 : 2)} {currency}
                      </p>
                    );
                  })}
                  {mainCurrencies.length < Object.keys(summary.currencyBreakdown).length && (
                    <p className="text-gray-400 mt-1">
                      +{Object.keys(summary.currencyBreakdown).length - mainCurrencies.length} more...
                    </p>
                  )}
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
                <div className={`text-xl sm:text-2xl font-bold ${summary.totalLiabilitiesUSD > 0 ? 'text-red-600' : 'text-gray-600'}`}>
                  {formatCurrency(summary.totalLiabilitiesUSD, 'USD')}
                </div>
                {mainCurrencies.length > 1 && (
                  <div className="text-xs text-gray-500 mt-1">
                    Multi-currency (USD equivalent)
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Total value of all negative balances (USD equivalent)</p>
              {Object.keys(summary.currencyBreakdown).length > 1 && (
                <div className="text-xs mt-2 pt-2 border-t">
                  <p className="font-medium mb-1">By Original Currency:</p>
                  {mainCurrencies.map(currency => {
                    const amount = summary.currencyBreakdown[currency].liabilities;
                    return (
                      <p key={currency}>
                        {currency}: {amount.toFixed(currency === 'ETH' || currency === 'BTC' ? 8 : 2)} {currency}
                      </p>
                    );
                  })}
                  {mainCurrencies.length < Object.keys(summary.currencyBreakdown).length && (
                    <p className="text-gray-400 mt-1">
                      +{Object.keys(summary.currencyBreakdown).length - mainCurrencies.length} more...
                    </p>
                  )}
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
                <div className={`text-xl sm:text-2xl font-bold ${getChangeColor(summary.netWorthUSD)}`}>
                  {formatCurrency(summary.netWorthUSD, 'USD')}
                </div>
                {summary.totalAssetsUSD > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {((summary.netWorthUSD / summary.totalAssetsUSD) * 100).toFixed(1)}% of assets
                  </div>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <p>Net worth (Assets - Liabilities in USD)</p>
              <p className="text-xs">
                Assets: {formatCurrency(summary.totalAssetsUSD, 'USD')} - 
                Liabilities: {formatCurrency(summary.totalLiabilitiesUSD, 'USD')}
              </p>
              {Object.keys(summary.currencyBreakdown).length > 1 && (
                <div className="text-xs mt-2 pt-2 border-t">
                  <p className="font-medium mb-1">By Original Currency:</p>
                  {mainCurrencies.map(currency => {
                    const amount = summary.currencyBreakdown[currency].netWorth;
                    return (
                      <p key={currency}>
                        {currency}: {amount.toFixed(currency === 'ETH' || currency === 'BTC' ? 8 : 2)} {currency}
                      </p>
                    );
                  })}
                  {mainCurrencies.length < Object.keys(summary.currencyBreakdown).length && (
                    <p className="text-gray-400 mt-1">
                      +{Object.keys(summary.currencyBreakdown).length - mainCurrencies.length} more...
                    </p>
                  )}
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

      {/* Interactive Currency Breakdown Pie Chart (if multiple currencies) */}
      {Object.keys(summary.currencyBreakdown).length > 1 && (
        <CurrencyBreakdownPieChart
          currencyBreakdown={summary.currencyBreakdown}
          baseCurrency={summary.baseCurrency}
          loading={loading}
          onCurrencyClick={(currency) => {
            console.log('Currency clicked:', currency);
            // Future: Add filtering or navigation functionality
          }}
        />
      )}
    </TooltipProvider>
  );
};