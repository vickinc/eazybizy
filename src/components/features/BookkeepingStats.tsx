import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { 
  TrendingUp, 
  TrendingDown, 
  ArrowUpCircle,
  ArrowDownCircle,
  CircleDollarSign
} from "lucide-react";

interface FinancialSummary {
  income: number;
  cogs: number;
  actualExpenses: number;
  accountsPayable: number;
  netProfit: number;
  actualCogsPaid: number;
  projectedNetProfit: number;
  profitMargin: string;
}

interface BookkeepingStatsProps {
  financialSummary: FinancialSummary;
  formatCurrency: (amount: number | undefined | null) => string;
}

export const BookkeepingStats: React.FC<BookkeepingStatsProps> = ({
  financialSummary,
  formatCurrency
}) => {
  const { 
    income, 
    cogs, 
    actualExpenses, 
    accountsPayable, 
    netProfit
  } = financialSummary;

  return (
    <TooltipProvider>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center text-green-700">
                    <div className="p-1 sm:p-2 bg-green-100 rounded-lg mr-2 sm:mr-3">
                      <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Total Revenue</span>
                  </div>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-green-600 mb-1">{formatCurrency(income)}</div>
                <div className="text-xs text-green-600/70">Revenue generated</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total revenue for the selected period</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-purple-50 to-violet-50 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center text-purple-700">
                    <div className="p-1 sm:p-2 bg-purple-100 rounded-lg mr-2 sm:mr-3">
                      <ArrowUpCircle className="h-4 w-4 sm:h-5 sm:w-5 text-purple-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Total COGS</span>
                  </div>
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-purple-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-purple-600 mb-1">{formatCurrency(cogs)}</div>
                <div className="text-xs text-purple-600/70">Cost of goods sold</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total cost of goods sold for the selected period</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-red-50 to-rose-50 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center text-red-700">
                    <div className="p-1 sm:p-2 bg-red-100 rounded-lg mr-2 sm:mr-3">
                      <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Actual Expenses</span>
                  </div>
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-red-600 mb-1">{formatCurrency(actualExpenses)}</div>
                <div className="text-xs text-red-600/70">Expenses actually paid</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Total expenses actually paid for the selected period</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-orange-50 to-amber-50 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center text-orange-700">
                    <div className="p-1 sm:p-2 bg-orange-100 rounded-lg mr-2 sm:mr-3">
                      <ArrowDownCircle className="h-4 w-4 sm:h-5 sm:w-5 text-orange-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Accounts Payable</span>
                  </div>
                  <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-orange-500" />
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-lg sm:text-2xl lg:text-3xl font-bold text-orange-600 mb-1">{formatCurrency(accountsPayable)}</div>
                <div className="text-xs text-orange-600/70">COGS still to pay</div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Outstanding accounts payable from COGS not yet paid</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help hover:shadow-xl transition-all duration-300 border-0 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg">
              <CardHeader className="pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-semibold flex items-center justify-between">
                  <div className="flex items-center text-blue-700">
                    <div className="p-1 sm:p-2 bg-blue-100 rounded-lg mr-2 sm:mr-3">
                      <CircleDollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                    </div>
                    <span className="text-xs sm:text-sm">Net Profit</span>
                  </div>
                  {netProfit >= 0 ? 
                    <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" /> : 
                    <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4 text-red-500" />
                  }
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className={`text-lg sm:text-2xl lg:text-3xl font-bold mb-1 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(netProfit)}
                </div>
                <div className={`text-xs ${netProfit >= 0 ? 'text-green-600/70' : 'text-red-600/70'}`}>
                  {income > 0 ? `${((netProfit / income) * 100).toFixed(1)}% margin` : 'No revenue'}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent>
            <p>Net profit (Revenue - Actual Expenses) for the selected period</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};