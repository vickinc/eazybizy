import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Download from "lucide-react/dist/esm/icons/download";

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

interface BookkeepingReportProps {
  financialSummary: FinancialSummary;
  formatCurrency: (amount: number) => string;
}

export const BookkeepingReport: React.FC<BookkeepingReportProps> = ({
  financialSummary,
  formatCurrency
}) => {
  const { 
    income, 
    cogs, 
    actualExpenses, 
    accountsPayable, 
    netProfit,
    actualCogsPaid,
    projectedNetProfit,
    profitMargin
  } = financialSummary;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Profit & Loss Report</h2>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Profit & Loss Statement
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center py-2">
              <span className="font-semibold text-green-700">Total Revenue</span>
              <span className="text-green-600 font-bold">{formatCurrency(income)}</span>
            </div>
            
            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-purple-700">Total COGS (Projected)</span>
                <span className="text-purple-600">{formatCurrency(cogs)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="ml-4 text-gray-600">• Actual COGS Paid</span>
                <span className="text-red-600">{formatCurrency(actualCogsPaid)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="ml-4 text-gray-600">• Future COGS to Pay</span>
                <span className="text-orange-600">{formatCurrency(accountsPayable)}</span>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-red-700">Total Actual Expenses</span>
                <span className="text-red-600">{formatCurrency(actualExpenses)}</span>
              </div>
            </div>

            <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center text-xl font-bold">
                <span>Net Profit (Revenue - Actual Expenses)</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {formatCurrency(netProfit)}
                </span>
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Profit Margin: {profitMargin}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center text-lg font-semibold">
                  <span className="text-orange-700">Projected Future Impact</span>
                  <span className="text-orange-600">-{formatCurrency(accountsPayable)}</span>
                </div>
                <div className="flex justify-between items-center text-lg font-bold mt-2">
                  <span>Projected Net Profit</span>
                  <span className={projectedNetProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(projectedNetProfit)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};