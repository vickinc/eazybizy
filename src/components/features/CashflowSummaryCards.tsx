import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  ArrowUpCircle,
  ArrowDownCircle,
  DollarSign,
  Calculator
} from "lucide-react";
import { CashflowSummary } from '@/services/business/cashflowBusinessService';

interface CashflowSummaryCardsProps {
  summary: CashflowSummary;
  formatCurrency: (amount: number, currency?: string) => string;
}

export const CashflowSummaryCards: React.FC<CashflowSummaryCardsProps> = ({
  summary,
  formatCurrency
}) => {
  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <ArrowUpCircle className="h-4 w-4 mr-2 text-green-600" />
                  Total Inflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(summary.total.inflow)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Auto: {formatCurrency(summary.automatic.inflow)} | Manual: {formatCurrency(summary.manual.inflow)}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total money flowing into accounts (automatic + manual)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <ArrowDownCircle className="h-4 w-4 mr-2 text-red-600" />
                  Total Outflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold text-red-600">
                  {formatCurrency(summary.total.outflow)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Auto: {formatCurrency(summary.automatic.outflow)} | Manual: {formatCurrency(summary.manual.outflow)}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total money flowing out of accounts (automatic + manual)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
                  Net Cashflow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-xl sm:text-2xl font-bold ${summary.total.net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.total.net)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Auto: {formatCurrency(summary.automatic.net)} | Manual: {formatCurrency(summary.manual.net)}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Net cashflow (Total Inflow - Total Outflow)</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center">
                  <Calculator className="h-4 w-4 mr-2" />
                  Accounts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xl sm:text-2xl font-bold">
                  {summary.totalAccounts}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Banks & Wallets tracked
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total number of bank accounts and wallets being tracked</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};