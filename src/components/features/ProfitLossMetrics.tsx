import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import BarChart3 from "lucide-react/dist/esm/icons/bar-chart-3";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Percent from "lucide-react/dist/esm/icons/percent";
import Target from "lucide-react/dist/esm/icons/target";
import { PLSummary } from '@/services/business/profitLossBusinessService';

interface ProfitLossMetricsProps {
  summary: PLSummary;
  formatCurrency: (amount: number) => string;
}

export const ProfitLossMetrics: React.FC<ProfitLossMetricsProps> = ({
  summary,
  formatCurrency
}) => {
  const metricsData = [
    {
      title: 'Total Revenue',
      value: summary.formattedTotalRevenue,
      rawValue: summary.totalRevenue,
      icon: TrendingUp,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      iconColor: 'text-green-500'
    },
    {
      title: 'Total Expenses',
      value: summary.formattedTotalExpenses,
      rawValue: summary.totalExpenses,
      icon: TrendingDown,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
      iconColor: 'text-red-500'
    },
    {
      title: 'Net Income',
      value: summary.formattedNetIncome,
      rawValue: summary.netIncome,
      icon: DollarSign,
      bgColor: summary.netIncome >= 0 ? 'bg-blue-50' : 'bg-red-50',
      textColor: summary.netIncome >= 0 ? 'text-blue-600' : 'text-red-600',
      iconColor: summary.netIncome >= 0 ? 'text-blue-500' : 'text-red-500'
    },
    {
      title: 'Gross Margin',
      value: `${summary.grossProfitMargin.toFixed(1)}%`,
      rawValue: summary.grossProfitMargin,
      icon: Target,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      iconColor: 'text-purple-500'
    },
    {
      title: 'Operating Margin',
      value: `${summary.operatingMargin.toFixed(1)}%`,
      rawValue: summary.operatingMargin,
      icon: BarChart3,
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      iconColor: 'text-indigo-500'
    },
    {
      title: 'Net Margin',
      value: `${summary.netProfitMargin.toFixed(1)}%`,
      rawValue: summary.netProfitMargin,
      icon: Percent,
      bgColor: 'bg-teal-50',
      textColor: 'text-teal-600',
      iconColor: 'text-teal-500'
    }
  ];

  const getMarginStatus = (margin: number) => {
    if (margin >= 20) return { text: 'Excellent', color: 'text-green-600' };
    if (margin >= 10) return { text: 'Good', color: 'text-blue-600' };
    if (margin >= 5) return { text: 'Fair', color: 'text-yellow-600' };
    if (margin >= 0) return { text: 'Poor', color: 'text-orange-600' };
    return { text: 'Loss', color: 'text-red-600' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Key Financial Metrics</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {metricsData.map((metric, index) => {
            const Icon = metric.icon;
            
            return (
              <div 
                key={metric.title}
                className={`p-4 rounded-lg ${metric.bgColor} border border-opacity-20`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${metric.iconColor}`} />
                  {metric.title.includes('Margin') && (
                    <span className={`text-xs font-medium ${getMarginStatus(metric.rawValue).color}`}>
                      {getMarginStatus(metric.rawValue).text}
                    </span>
                  )}
                </div>
                
                <div className={`text-2xl font-bold ${metric.textColor} mb-1`}>
                  {metric.value}
                </div>
                
                <div className="text-sm text-gray-600">
                  {metric.title}
                </div>
                
                {/* Additional context for certain metrics */}
                {metric.title === 'Net Income' && summary.totalRevenue > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {((summary.netIncome / summary.totalRevenue) * 100).toFixed(1)}% of revenue
                  </div>
                )}
                
                {metric.title === 'Total Expenses' && summary.totalRevenue > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    {((summary.totalExpenses / summary.totalRevenue) * 100).toFixed(1)}% of revenue
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Financial Health Summary */}
        {summary.hasData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Financial Health Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-600 mb-1">Profitability:</div>
                <div className={`font-medium ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.netIncome >= 0 ? 'Profitable' : 'Loss-making'}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600 mb-1">Gross Margin Health:</div>
                <div className={`font-medium ${getMarginStatus(summary.grossProfitMargin).color}`}>
                  {getMarginStatus(summary.grossProfitMargin).text}
                </div>
              </div>
              
              <div>
                <div className="text-gray-600 mb-1">Net Margin Health:</div>
                <div className={`font-medium ${getMarginStatus(summary.netProfitMargin).color}`}>
                  {getMarginStatus(summary.netProfitMargin).text}
                </div>
              </div>
            </div>
            
            {/* Key Insights */}
            <div className="mt-4 pt-4 border-t">
              <div className="text-gray-600 text-sm">
                <strong>Key Insights:</strong>
                <ul className="mt-2 space-y-1 ml-4">
                  {summary.grossProfitMargin > summary.netProfitMargin && summary.netProfitMargin < 10 && (
                    <li className="list-disc">Operating expenses are significantly impacting profitability</li>
                  )}
                  {summary.grossProfitMargin < 30 && summary.totalRevenue > 0 && (
                    <li className="list-disc">Consider reviewing cost of goods sold to improve gross margin</li>
                  )}
                  {summary.netIncome < 0 && (
                    <li className="list-disc text-red-600">Business is operating at a loss - review expenses and pricing</li>
                  )}
                  {summary.netProfitMargin > 15 && (
                    <li className="list-disc text-green-600">Strong profitability - business is performing well</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* No Data State */}
        {!summary.hasData && (
          <div className="text-center py-8 text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <div className="text-lg font-medium mb-2">No Financial Data</div>
            <div className="text-sm">
              Add income and expense entries to see key metrics
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};