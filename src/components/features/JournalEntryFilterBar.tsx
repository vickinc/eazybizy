import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import X from "lucide-react/dist/esm/icons/x";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import User from "lucide-react/dist/esm/icons/user";
import FileText from "lucide-react/dist/esm/icons/file-text";
import SortAsc from "lucide-react/dist/esm/icons/sort-asc";
import SortDesc from "lucide-react/dist/esm/icons/sort-desc";
import { JournalEntryFilters, JournalEntrySortConfig } from '@/hooks/useJournalEntriesManagement';
import { ChartOfAccount } from '@/types';

interface JournalEntryFilterBarProps {
  filters: JournalEntryFilters;
  sortConfig: JournalEntrySortConfig;
  showFilterPanel: boolean;
  onUpdateFilters: (filters: Partial<JournalEntryFilters>) => void;
  onUpdateSortConfig: (sort: Partial<JournalEntrySortConfig>) => void;
  onResetFilters: () => void;
  onToggleSort: (field: JournalEntrySortConfig['field']) => void;
  onApplyQuickFilter: (type: 'today' | 'thisWeek' | 'thisMonth' | 'unbalanced' | 'draft') => void;
  onToggleFilterPanel: (show: boolean) => void;
  chartOfAccounts: ChartOfAccount[];
  totalEntries: number;
  filteredCount: number;
}

export const JournalEntryFilterBar: React.FC<JournalEntryFilterBarProps> = ({
  filters,
  sortConfig,
  showFilterPanel,
  onUpdateFilters,
  onUpdateSortConfig,
  onResetFilters,
  onToggleSort,
  onApplyQuickFilter,
  onToggleFilterPanel,
  chartOfAccounts,
  totalEntries,
  filteredCount
}) => {
  const getActiveFiltersCount = () => {
    const count = 0;
    if (filters.searchTerm) count++;
    if (filters.status !== 'all') count++;
    if (filters.dateRange.start || filters.dateRange.end) count++;
    if (filters.amountRange.min !== null || filters.amountRange.max !== null) count++;
    if (filters.accountIds.length > 0) count++;
    if (filters.createdBy.length > 0) count++;
    if (filters.hasReversalEntries !== 'all') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  const SortButton: React.FC<{ field: JournalEntrySortConfig['field']; label: string }> = ({ field, label }) => (
    <Button
      variant={sortConfig.field === field ? "default" : "outline"}
      size="sm"
      onClick={() => onToggleSort(field)}
      className="flex items-center space-x-1"
    >
      <span>{label}</span>
      {sortConfig.field === field && (
        sortConfig.direction === 'asc' ? <SortAsc className="h-3 w-3" /> : <SortDesc className="h-3 w-3" />
      )}
    </Button>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
      {/* Search and Quick Filters Row */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-1 items-center space-x-4">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search entries, accounts, descriptions..."
              value={filters.searchTerm}
              onChange={(e) => onUpdateFilters({ searchTerm: e.target.value })}
              className="pl-10"
            />
            {filters.searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdateFilters({ searchTerm: '' })}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyQuickFilter('today')}
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyQuickFilter('thisWeek')}
            >
              This Week
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyQuickFilter('thisMonth')}
            >
              This Month
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onApplyQuickFilter('draft')}
            >
              Draft
            </Button>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={() => onToggleFilterPanel(!showFilterPanel)}
            className="flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFiltersCount}
              </Badge>
            )}
            <ChevronDown className={`h-3 w-3 transition-transform ${showFilterPanel ? 'rotate-180' : ''}`} />
          </Button>

          {activeFiltersCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              className="flex items-center space-x-1"
            >
              <RotateCcw className="h-3 w-3" />
              <span>Reset</span>
            </Button>
          )}
        </div>
      </div>

      {/* Sorting Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <div className="flex items-center space-x-1">
            <SortButton field="date" label="Date" />
            <SortButton field="entryNumber" label="Entry #" />
            <SortButton field="description" label="Description" />
            <SortButton field="totalDebits" label="Amount" />
            <SortButton field="status" label="Status" />
          </div>
        </div>

        <div className="text-sm text-gray-600">
          Showing {filteredCount.toLocaleString()} of {totalEntries.toLocaleString()} entries
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <Collapsible open={showFilterPanel} onOpenChange={onToggleFilterPanel}>
        <CollapsibleContent className="space-y-6">
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Status</span>
                </Label>
                <Select
                  value={filters.status}
                  onValueChange={(value: unknown) => onUpdateFilters({ status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="posted">Posted</SelectItem>
                    <SelectItem value="reversed">Reversed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Date Range</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={filters.dateRange.start}
                    onChange={(e) => onUpdateFilters({ 
                      dateRange: { ...filters.dateRange, start: e.target.value } 
                    })}
                    placeholder="Start date"
                  />
                  <Input
                    type="date"
                    value={filters.dateRange.end}
                    onChange={(e) => onUpdateFilters({ 
                      dateRange: { ...filters.dateRange, end: e.target.value } 
                    })}
                    placeholder="End date"
                  />
                </div>
              </div>

              {/* Amount Range */}
              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Amount Range</span>
                </Label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="number"
                    placeholder="Min amount"
                    value={filters.amountRange.min || ''}
                    onChange={(e) => onUpdateFilters({ 
                      amountRange: { 
                        ...filters.amountRange, 
                        min: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Max amount"
                    value={filters.amountRange.max || ''}
                    onChange={(e) => onUpdateFilters({ 
                      amountRange: { 
                        ...filters.amountRange, 
                        max: e.target.value ? parseFloat(e.target.value) : null 
                      } 
                    })}
                  />
                </div>
              </div>

              {/* Account Filter */}
              <div className="space-y-2">
                <Label>Accounts</Label>
                <Select
                  value={filters.accountIds.length === 1 ? filters.accountIds[0] : 'multiple'}
                  onValueChange={(value) => {
                    if (value === 'all') {
                      onUpdateFilters({ accountIds: [] });
                    } else {
                      onUpdateFilters({ accountIds: [value] });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      filters.accountIds.length === 0 ? "All accounts" :
                      filters.accountIds.length === 1 ? 
                        chartOfAccounts.find(acc => acc.id === filters.accountIds[0])?.name :
                        `${filters.accountIds.length} accounts selected`
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Accounts</SelectItem>
                    {chartOfAccounts.map((account) => (
                      <SelectItem key={account.id} value={account.id}>
                        {account.code} - {account.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Reversal Entries Filter */}
              <div className="space-y-2">
                <Label>Reversal Entries</Label>
                <Select
                  value={filters.hasReversalEntries}
                  onValueChange={(value: unknown) => onUpdateFilters({ hasReversalEntries: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Entries</SelectItem>
                    <SelectItem value="yes">Has Reversals</SelectItem>
                    <SelectItem value="no">No Reversals</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
          <span className="text-sm text-gray-600">Active filters:</span>
          
          {filters.searchTerm && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Search: "{filters.searchTerm}"</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onUpdateFilters({ searchTerm: '' })}
              />
            </Badge>
          )}
          
          {filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>Status: {filters.status}</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onUpdateFilters({ status: 'all' })}
              />
            </Badge>
          )}
          
          {(filters.dateRange.start || filters.dateRange.end) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Date: {filters.dateRange.start || '∞'} - {filters.dateRange.end || '∞'}
              </span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onUpdateFilters({ dateRange: { start: '', end: '' } })}
              />
            </Badge>
          )}
          
          {(filters.amountRange.min !== null || filters.amountRange.max !== null) && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>
                Amount: {filters.amountRange.min || '0'} - {filters.amountRange.max || '∞'}
              </span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onUpdateFilters({ amountRange: { min: null, max: null } })}
              />
            </Badge>
          )}
          
          {filters.accountIds.length > 0 && (
            <Badge variant="secondary" className="flex items-center space-x-1">
              <span>{filters.accountIds.length} account(s)</span>
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => onUpdateFilters({ accountIds: [] })}
              />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
};