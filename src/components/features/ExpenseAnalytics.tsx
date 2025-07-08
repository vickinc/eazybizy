import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ExpenseBreakdownItem {
  category: string;
  amount: number;
  percentage: number;
}

interface ExpenseAnalyticsProps {
  expenseBreakdown: ExpenseBreakdownItem[];
  formatCurrency: (amount: number) => string;
}

export const ExpenseAnalytics: React.FC<ExpenseAnalyticsProps> = ({
  expenseBreakdown,
  formatCurrency
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Expense Analytics</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Expense Breakdown by Category</CardTitle>
          <CardDescription>
            Visual breakdown of expenses for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenseBreakdown.map((item) => {
              return (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{item.category}</span>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(item.amount)}</div>
                      <div className="text-xs text-gray-500">{item.percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${item.percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};