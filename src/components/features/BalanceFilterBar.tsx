import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Search, Filter, RotateCcw } from "lucide-react";
import { 
  FilterPeriod, 
  AccountTypeFilter, 
  BalanceViewFilter, 
  BalanceGroupBy,
  BalanceFilterState 
} from '@/types/balance.types';

interface BalanceFilterBarProps {
  filters: BalanceFilterState;
  onUpdateFilters: (filters: Partial<BalanceFilterState>) => void;
  onResetFilters: () => void;
  loading?: boolean;
}

export const BalanceFilterBar: React.FC<BalanceFilterBarProps> = ({
  filters,
  onUpdateFilters,
  onResetFilters,
  loading = false
}) => {
  const handlePeriodChange = (period: FilterPeriod) => {
    onUpdateFilters({ selectedPeriod: period });
  };

  const handleAccountTypeChange = (accountType: AccountTypeFilter) => {
    onUpdateFilters({ accountTypeFilter: accountType });
  };

  const handleViewFilterChange = (viewFilter: BalanceViewFilter) => {
    onUpdateFilters({ viewFilter });
  };

  const handleGroupByChange = (groupBy: BalanceGroupBy) => {
    onUpdateFilters({ groupBy });
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onUpdateFilters({ searchTerm: event.target.value });
  };

  const handleZeroBalancesToggle = (checked: boolean) => {
    onUpdateFilters({ showZeroBalances: checked });
  };

  const handleCustomDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onUpdateFilters({
      customDateRange: {
        ...filters.customDateRange,
        [field]: value
      }
    });
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Period Filter */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="period-select">Period</Label>
              <Select 
                value={filters.selectedPeriod} 
                onValueChange={handlePeriodChange}
                disabled={loading}
              >
                <SelectTrigger id="period-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                  <SelectItem value="thisYear">This Year</SelectItem>
                  <SelectItem value="lastYear">Last Year</SelectItem>
                  <SelectItem value="allTime">All Time</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-type-select">Account Type</Label>
              <Select 
                value={filters.accountTypeFilter} 
                onValueChange={handleAccountTypeChange}
                disabled={loading}
              >
                <SelectTrigger id="account-type-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="banks">Bank Accounts</SelectItem>
                  <SelectItem value="wallets">Digital Wallets</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="view-filter-select">View</Label>
              <Select 
                value={filters.viewFilter} 
                onValueChange={handleViewFilterChange}
                disabled={loading}
              >
                <SelectTrigger id="view-filter-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Balances</SelectItem>
                  <SelectItem value="assets">Assets Only</SelectItem>
                  <SelectItem value="liabilities">Liabilities Only</SelectItem>
                  <SelectItem value="equity">Equity Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="group-by-select">Group By</Label>
              <Select 
                value={filters.groupBy} 
                onValueChange={handleGroupByChange}
                disabled={loading}
              >
                <SelectTrigger id="group-by-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Grouping</SelectItem>
                  <SelectItem value="account">Account Type</SelectItem>
                  <SelectItem value="currency">Currency</SelectItem>
                  <SelectItem value="type">Type & Currency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range */}
          {filters.selectedPeriod === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="start-date"
                    type="date"
                    value={filters.customDateRange.startDate}
                    onChange={(e) => handleCustomDateChange('startDate', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    id="end-date"
                    type="date"
                    value={filters.customDateRange.endDate}
                    onChange={(e) => handleCustomDateChange('endDate', e.target.value)}
                    className="pl-10"
                    disabled={loading}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Search and Options */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search accounts, companies, currencies..."
                  className="pl-10"
                  value={filters.searchTerm}
                  onChange={handleSearchChange}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="show-zero-balances"
                  checked={filters.showZeroBalances}
                  onCheckedChange={handleZeroBalancesToggle}
                  disabled={loading}
                />
                <Label htmlFor="show-zero-balances" className="text-sm">
                  Show Zero Balances
                </Label>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={onResetFilters}
                disabled={loading}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>

          {/* Active Filters Summary */}
          {(filters.selectedPeriod !== 'thisMonth' || 
            filters.accountTypeFilter !== 'all' || 
            filters.viewFilter !== 'all' || 
            filters.groupBy !== 'account' || 
            filters.searchTerm || 
            !filters.showZeroBalances) && (
            <div className="flex flex-wrap gap-2 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Filter className="h-4 w-4" />
                <span>Active filters:</span>
              </div>
              
              {filters.selectedPeriod !== 'thisMonth' && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                  Period: {filters.selectedPeriod === 'custom' ? 'Custom Range' : filters.selectedPeriod}
                </span>
              )}
              
              {filters.accountTypeFilter !== 'all' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                  Type: {filters.accountTypeFilter}
                </span>
              )}
              
              {filters.viewFilter !== 'all' && (
                <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs">
                  View: {filters.viewFilter}
                </span>
              )}
              
              {filters.groupBy !== 'account' && (
                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs">
                  Group: {filters.groupBy}
                </span>
              )}
              
              {filters.searchTerm && (
                <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">
                  Search: "{filters.searchTerm}"
                </span>
              )}
              
              {!filters.showZeroBalances && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                  Hide Zero Balances
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};