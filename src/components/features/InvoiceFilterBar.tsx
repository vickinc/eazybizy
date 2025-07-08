import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Filter,
  Calendar,
  Users,
  Folder,
  FolderOpen,
  FileText,
  CheckCircle,
  Send,
  Clock,
  Search
} from "lucide-react";

interface InvoiceFilterBarProps {
  viewFilter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived';
  groupedView: boolean;
  selectedPeriod: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom';
  customDateRange: { start: string; end: string };
  filterClient: string;
  filterCurrency: string;
  groupBy: 'none' | 'month' | 'client' | 'currency' | 'status';
  searchTerm: string;
  availableClients: Array<{ id: string; name: string }>;
  availableCurrencies: string[];
  setViewFilter: (filter: 'all' | 'draft' | 'sent' | 'paid' | 'overdue' | 'archived') => void;
  setGroupedView: (grouped: boolean) => void;
  setSelectedPeriod: (period: 'thisMonth' | 'lastMonth' | 'thisYear' | 'lastYear' | 'allTime' | 'custom') => void;
  setCustomDateRange: (range: { start: string; end: string }) => void;
  setFilterClient: (client: string) => void;
  setFilterCurrency: (currency: string) => void;
  setGroupBy: (groupBy: 'none' | 'month' | 'client' | 'currency' | 'status') => void;
  setSearchTerm: (term: string) => void;
}

export const InvoiceFilterBar: React.FC<InvoiceFilterBarProps> = ({
  viewFilter,
  groupedView,
  selectedPeriod,
  customDateRange,
  filterClient,
  filterCurrency,
  groupBy,
  searchTerm,
  availableClients,
  availableCurrencies,
  setViewFilter,
  setGroupedView,
  setSelectedPeriod,
  setCustomDateRange,
  setFilterClient,
  setFilterCurrency,
  setGroupBy,
  setSearchTerm
}) => {
  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Left Side: Status Filters */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-4">
              {/* Status Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Status:</span>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('all')}
                    className="rounded-none border-0 px-3 h-9"
                  >
                    All Invoices
                  </Button>
                  <Button
                    variant={viewFilter === 'draft' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('draft')}
                    className="rounded-none border-0 px-3 h-9 text-gray-600"
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    Draft
                  </Button>
                  <Button
                    variant={viewFilter === 'sent' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('sent')}
                    className="rounded-none border-0 px-3 h-9 text-blue-600"
                  >
                    <Send className="h-4 w-4 mr-1" />
                    Sent
                  </Button>
                  <Button
                    variant={viewFilter === 'paid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('paid')}
                    className="rounded-none border-0 px-3 h-9 text-green-600"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Paid
                  </Button>
                  <Button
                    variant={viewFilter === 'overdue' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('overdue')}
                    className="rounded-none border-0 px-3 h-9 text-red-600"
                  >
                    <Clock className="h-4 w-4 mr-1" />
                    Overdue
                  </Button>
                  <Button
                    variant={viewFilter === 'archived' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('archived')}
                    className="rounded-none border-0 px-3 h-9 text-gray-500"
                  >
                    Archived
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

            {/* Client Filter */}
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <Select value={filterClient} onValueChange={(value: any) => setFilterClient(value)}>
                <SelectTrigger className="w-auto sm:w-40 h-9">
                  <SelectValue placeholder="All Clients" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Clients</SelectItem>
                  {availableClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Currency Filter */}
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Currency:</span>
              <Select value={filterCurrency} onValueChange={(value: any) => setFilterCurrency(value)}>
                <SelectTrigger className="w-auto sm:w-32 h-9">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {availableCurrencies.map((currency) => (
                    <SelectItem key={currency} value={currency}>
                      {currency}
                    </SelectItem>
                  ))}
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
                    <SelectItem value="client">Group by Client</SelectItem>
                    <SelectItem value="currency">Group by Currency</SelectItem>
                    <SelectItem value="status">Group by Status</SelectItem>
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
                placeholder="Search by invoice number, client name, description..."
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