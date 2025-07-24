import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ArrowUpCircle from "lucide-react/dist/esm/icons/arrow-up-circle";
import ArrowDownCircle from "lucide-react/dist/esm/icons/arrow-down-circle";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Filter from "lucide-react/dist/esm/icons/filter";
import Search from "lucide-react/dist/esm/icons/search";

interface EntriesFilterBarProps {
  // Filter state
  viewFilter: 'all' | 'income' | 'expense';
  groupedView: boolean;
  selectedPeriod: string;
  customDateRange: { start: string; end: string };
  searchTerm: string | null;
  
  // Filter setters
  setViewFilter: (filter: 'all' | 'income' | 'expense') => void;
  setGroupedView: (grouped: boolean) => void;
  setSelectedPeriod: (period: string) => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setSearchTerm: (term: string) => void;
}

export const EntriesFilterBar: React.FC<EntriesFilterBarProps> = ({
  viewFilter,
  groupedView,
  selectedPeriod,
  customDateRange,
  searchTerm,
  setViewFilter,
  setGroupedView,
  setSelectedPeriod,
  setCustomDateRange,
  setSearchTerm
}) => {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* View Type Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Show:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={viewFilter === 'all' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('all')}
                  className="rounded-none border-0"
                >
                  All Entries
                </Button>
                <Button
                  variant={viewFilter === 'revenue' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('revenue')}
                  className="rounded-none border-0 text-green-600"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-1" />
                  Revenue Only
                </Button>
                <Button
                  variant={viewFilter === 'expense' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewFilter('expense')}
                  className="rounded-none border-0 text-red-600"
                >
                  <ArrowDownCircle className="h-4 w-4 mr-1" />
                  Expenses Only
                </Button>
              </div>
            </div>

            {/* View Style Toggle */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">View:</span>
              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  variant={!groupedView ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupedView(false)}
                  className="rounded-none border-0"
                >
                  List View
                </Button>
                <Button
                  variant={groupedView ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setGroupedView(true)}
                  className="rounded-none border-0"
                >
                  <FolderOpen className="h-4 w-4 mr-1" />
                  Grouped
                </Button>
              </div>
            </div>
          </div>

          {/* Period and Date Range Selection */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Period:</span>
              <Select value={selectedPeriod} onValueChange={(value: unknown) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-40">
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

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">From:</span>
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                  className="w-36"
                />
                <span className="text-sm">To:</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                  className="w-36"
                />
              </div>
            )}
          </div>

          {/* Search Filter */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by description, category, or amount..."
                  value={searchTerm || ''}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};