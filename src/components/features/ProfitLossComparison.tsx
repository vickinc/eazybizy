import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Target from "lucide-react/dist/esm/icons/target";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import TrendingDown from "lucide-react/dist/esm/icons/trending-down";
import ArrowUp from "lucide-react/dist/esm/icons/arrow-up";
import ArrowDown from "lucide-react/dist/esm/icons/arrow-down";
import { PLComparison } from '@/services/business/profitLossBusinessService';
import { ComparisonPeriodType } from '@/hooks/useProfitLossManagement';

interface ProfitLossComparisonProps {
  comparison: PLComparison;
  currentPeriodName: string;
  comparisonPeriodName: string;
  formatCurrency: (amount: number) => string;
}

export const ProfitLossComparison: React.FC<ProfitLossComparisonProps> = ({
  comparison,
  currentPeriodName,
  comparisonPeriodName,
  formatCurrency
}) => {
  const comparisonItems = [
    {
      label: 'Revenue',
      current: comparison.revenue.current,
      previous: comparison.revenue.comparison,
      change: comparison.revenue.change,
      changeFormatted: comparison.revenue.changeFormatted,
      icon: TrendingUp,
      isPositiveGood: true
    },
    {
      label: 'Expense',
      current: comparison.expenses.current,
      previous: comparison.expenses.comparison,
      change: comparison.expenses.change,
      changeFormatted: comparison.expenses.changeFormatted,
      icon: TrendingDown,
      isPositiveGood: false // For expenses, lower is better
    },
    {
      label: 'Net Income',
      current: comparison.netIncome.current,
      previous: comparison.netIncome.comparison,
      change: comparison.netIncome.change,
      changeFormatted: comparison.netIncome.changeFormatted,
      icon: Target,
      isPositiveGood: true
    }
  ];

  const getChangeColor = (change: number, isPositiveGood: boolean) => {
    const isPositive = change > 0;
    if (isPositiveGood) {
      return isPositive ? 'text-green-600' : 'text-red-600';
    } else {
      return isPositive ? 'text-red-600' : 'text-green-600';
    }
  };

  const getChangeIcon = (change: number, isPositiveGood: boolean) => {
    const isPositive = change > 0;
    if (isPositiveGood) {
      return isPositive ? ArrowUp : ArrowDown;
    } else {
      return isPositive ? ArrowUp : ArrowDown;
    }
  };

  const getChangeDescription = (change: number, isPositiveGood: boolean, label: string) => {
    const isPositive = change > 0;
    const magnitude = Math.abs(change);
    
    if (label === 'Expense') {
      if (isPositive) {
        if (magnitude > 20) return 'Significant increase - review spending';
        if (magnitude > 10) return 'Notable increase - monitor costs';
        return 'Slight increase';
      } else {
        if (magnitude > 20) return 'Major cost reduction achieved';
        if (magnitude > 10) return 'Good cost management';
        return 'Slight decrease';
      }
    }
    
    if (label === 'Revenue') {
      if (isPositive) {
        if (magnitude > 20) return 'Excellent revenue growth';
        if (magnitude > 10) return 'Strong revenue growth';
        return 'Modest growth';
      } else {
        if (magnitude > 20) return 'Significant revenue decline';
        if (magnitude > 10) return 'Revenue decline - needs attention';
        return 'Slight decline';
      }
    }
    
    if (label === 'Net Income') {
      if (isPositive) {
        if (magnitude > 50) return 'Outstanding profit improvement';
        if (magnitude > 20) return 'Strong profit growth';
        return 'Improving profitability';
      } else {
        if (magnitude > 50) return 'Concerning profit decline';
        if (magnitude > 20) return 'Profit decline - review operations';
        return 'Slight profit decrease';
      }
    }
    
    return '';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Target className="h-5 w-5" />
          <span>Period Comparison</span>
        </CardTitle>
        <CardDescription>
          Comparing {currentPeriodName} vs {comparisonPeriodName}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {comparisonItems.map((item) => {
            const Icon = item.icon;
            const ChangeIcon = getChangeIcon(item.change, item.isPositiveGood);
            const changeColor = getChangeColor(item.change, item.isPositiveGood);
            const description = getChangeDescription(item.change, item.isPositiveGood, item.label);
            
            return (
              <div key={item.label} className="space-y-3">
                {/* Header */}
                <div className="flex items-center space-x-2">
                  <Icon className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-gray-900">{item.label}</span>
                </div>
                
                {/* Values and Change */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Current Period */}
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <div className="text-sm text-blue-600 font-medium">{currentPeriodName}</div>
                    <div className="text-lg font-bold text-blue-800">
                      {formatCurrency(item.current)}
                    </div>
                  </div>
                  
                  {/* Previous Period */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">{comparisonPeriodName}</div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatCurrency(item.previous)}
                    </div>
                  </div>
                  
                  {/* Change */}
                  <div className="bg-white border p-3 rounded-lg">
                    <div className="text-sm text-gray-600 font-medium">Change</div>
                    <div className={`text-lg font-bold flex items-center space-x-1 ${changeColor}`}>
                      <ChangeIcon className="h-4 w-4" />
                      <span>{item.changeFormatted}</span>
                    </div>
                  </div>
                </div>
                
                {/* Description */}
                {description && (
                  <div className={`text-sm ${changeColor} bg-gray-50 p-2 rounded`}>
                    {description}
                  </div>
                )}
                
                {/* Absolute Change */}
                <div className="text-xs text-gray-500">
                  Absolute change: {formatCurrency(item.current - item.previous)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Overall Performance Summary */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg border">
          <h4 className="font-medium text-gray-900 mb-3">Performance Summary</h4>
          <div className="space-y-2 text-sm">
            {comparison.revenue.change > 0 && comparison.netIncome.change > 0 && (
              <div className="flex items-center space-x-2 text-green-700">
                <ArrowUp className="h-4 w-4" />
                <span>Revenue and profitability both improved - excellent performance</span>
              </div>
            )}
            
            {comparison.revenue.change > 0 && comparison.netIncome.change < 0 && (
              <div className="flex items-center space-x-2 text-yellow-700">
                <span className="font-medium">⚠️</span>
                <span>Revenue grew but profit declined - review cost management</span>
              </div>
            )}
            
            {comparison.revenue.change < 0 && comparison.netIncome.change > 0 && (
              <div className="flex items-center space-x-2 text-blue-700">
                <span className="font-medium">📊</span>
                <span>Revenue declined but profit improved - good cost control</span>
              </div>
            )}
            
            {comparison.revenue.change < 0 && comparison.netIncome.change < 0 && (
              <div className="flex items-center space-x-2 text-red-700">
                <ArrowDown className="h-4 w-4" />
                <span>Both revenue and profit declined - requires strategic review</span>
              </div>
            )}
            
            {Math.abs(comparison.expenses.change) > 15 && (
              <div className={`flex items-center space-x-2 ${comparison.expenses.change > 0 ? 'text-red-700' : 'text-green-700'}`}>
                <span className="font-medium">💰</span>
                <span>
                  Significant expense {comparison.expenses.change > 0 ? 'increase' : 'reduction'} of {Math.abs(comparison.expenses.change).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white border rounded-lg p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Revenue Change</div>
            <div className={`text-xl font-bold ${getChangeColor(comparison.revenue.change, true)}`}>
              {comparison.revenue.changeFormatted}
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Expense Change</div>
            <div className={`text-xl font-bold ${getChangeColor(comparison.expenses.change, false)}`}>
              {comparison.expenses.changeFormatted}
            </div>
          </div>
          
          <div className="bg-white border rounded-lg p-3">
            <div className="text-xs text-gray-600 uppercase tracking-wide">Profit Change</div>
            <div className={`text-xl font-bold ${getChangeColor(comparison.netIncome.change, true)}`}>
              {comparison.netIncome.changeFormatted}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};