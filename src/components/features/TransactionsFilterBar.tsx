import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter,
  Calendar,
  Building,
  Folder,
  FolderOpen,
  ArrowUpCircle,
  ArrowDownCircle,
  Search
} from "lucide-react";

interface TransactionsFilterBarProps {
  viewFilter: 'all' | 'incoming' | 'outgoing';
  groupedView: boolean;
  selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
  customDateRange: { start: string; end: string };
  filterBy: 'all' | 'banks' | 'wallets';
  groupBy: 'none' | 'month' | 'account' | 'currency';
  searchTerm: string;
  setViewFilter: (filter: 'all' | 'incoming' | 'outgoing') => void;
  setGroupedView: (grouped: boolean) => void;
  setSelectedPeriod: (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom') => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setFilterBy: (filter: 'all' | 'banks' | 'wallets') => void;
  setGroupBy: (groupBy: 'none' | 'month' | 'account' | 'currency') => void;
  setSearchTerm: (term: string) => void;
}

export const TransactionsFilterBar: React.FC<TransactionsFilterBarProps> = ({
  viewFilter,
  groupedView,
  selectedPeriod,
  customDateRange,
  filterBy,
  groupBy,
  searchTerm,
  setViewFilter,
  setGroupedView,
  setSelectedPeriod,
  setCustomDateRange,
  setFilterBy,
  setGroupBy,
  setSearchTerm
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Side: Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              {/* View Type Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Show:</span>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('all')}
                    className="rounded-none border-0 px-3 h-9"
                  >
                    All Transactions
                  </Button>
                  <Button
                    variant={viewFilter === 'incoming' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('incoming')}
                    className="rounded-none border-0 px-3 h-9 text-green-600"
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                    Incoming
                  </Button>
                  <Button
                    variant={viewFilter === 'outgoing' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('outgoing')}
                    className="rounded-none border-0 px-3 h-9 text-red-600"
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-1" />
                    Outgoing
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
                    className="rounded-none border-0 px-3 h-9"
                  >
                    List View
                  </Button>
                  <Button
                    variant={groupedView ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGroupedView(true)}
                    className="rounded-none border-0 px-3 h-9"
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Grouped
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-center gap-4 pt-2">
            {/* Period and Date Range Selection */}
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-auto sm:w-40 h-9">
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

            {/* Account Type Filter */}
            <div className="flex items-center space-x-2">
              <Building className="h-4 w-4 text-gray-500" />
              <Select value={filterBy} onValueChange={(value: any) => setFilterBy(value)}>
                <SelectTrigger className="w-auto sm:w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Accounts</SelectItem>
                  <SelectItem value="banks">Banks Only</SelectItem>
                  <SelectItem value="wallets">Wallets Only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By Selection - only show when grouped view is enabled */}
            {groupedView && (
              <div className="flex items-center space-x-2">
                <Folder className="h-4 w-4 text-gray-500" />
                <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
                  <SelectTrigger className="w-auto sm:w-40 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="month">Group by Month</SelectItem>
                    <SelectItem value="account">Group by Account</SelectItem>
                    <SelectItem value="currency">Group by Currency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <div className="flex items-center space-x-2">
                <span className="text-sm">From:</span>
                <Input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-36 h-9"
                />
                <span className="text-sm">To:</span>
                <Input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-36 h-9"
                />
              </div>
            )}
          </div>
          
          {/* Search Filter */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by description, reference, paid by/to, category..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};