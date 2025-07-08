import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Building2, 
  CreditCard, 
  TrendingUp, 
  TrendingDown,
  BarChart3
} from "lucide-react";
import { ChartOfAccountsStats } from "@/types/chartOfAccounts.types";
import { cn } from "@/utils/cn";

interface CategoryStatsProps {
  stats: ChartOfAccountsStats;
  className?: string;
}

export const CategoryStats: React.FC<CategoryStatsProps> = ({ 
  stats, 
  className 
}) => {
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Assets':
        return Building2;
      case 'Liability':
        return CreditCard;
      case 'Revenue':
        return TrendingUp;
      case 'Expense':
        return TrendingDown;
      default:
        return BarChart3;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Assets':
        return 'text-blue-600 bg-blue-100';
      case 'Liability':
        return 'text-red-600 bg-red-100';
      case 'Revenue':
        return 'text-green-600 bg-green-100';
      case 'Expense':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", className)}>
      {/* Total Accounts */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Accounts</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            Active chart of accounts
          </p>
        </CardContent>
      </Card>

      {/* Account Types */}
      {Object.entries(stats.byType).map(([type, count]) => {
        const Icon = getTypeIcon(type);
        const colorClass = getTypeColor(type);
        
        return (
          <Card key={type}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{type}</CardTitle>
              <div className={cn("p-1 rounded", colorClass)}>
                <Icon className="h-4 w-4" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
              <p className="text-xs text-muted-foreground">
                {((count / stats.total) * 100).toFixed(1)}% of total
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};