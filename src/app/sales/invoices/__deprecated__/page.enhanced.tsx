/**
 * Enhanced Invoices Page
 * 
 * Complete invoices management with error boundaries, loading states,
 * virtual scrolling, and progressive loading for optimal performance.
 */

'use client';

import React, { useState, useCallback, useMemo } from 'react';
import Plus from "lucide-react/dist/esm/icons/plus";
import Search from "lucide-react/dist/esm/icons/search";
import Filter from "lucide-react/dist/esm/icons/filter";
import Download from "lucide-react/dist/esm/icons/download";
import Upload from "lucide-react/dist/esm/icons/upload";
import FileText from "lucide-react/dist/esm/icons/file-text";
import { ErrorBoundary, ApiErrorBoundary } from '@/components/ui/error-boundary';
import { 
  LoadingSpinner, 
  PageLoading, 
  InvoiceListSkeleton,
  StatsCardSkeleton 
} from '@/components/ui/loading-states';
import { VirtualInvoiceList } from '@/components/ui/virtual-scroll';
import { AdvancedPagination, DataViewToggle, useSmartPagination } from '@/components/ui/pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useInvoicesManagement } from '@/hooks/useInvoicesManagement.new';
import { useCompanies } from '@/hooks/useCompanies';
import { toast } from 'sonner';
import { cn } from '@/utils/cn';

interface InvoicesPageEnhancedProps {
  initialCompanyId?: number;
}

const InvoicesPageEnhanced: React.FC<InvoicesPageEnhancedProps> = ({ initialCompanyId }) => {
  // State management
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>(initialCompanyId || 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Data fetching
  const { data: companies, isLoading: companiesLoading } = useCompanies();
  const {
    invoices,
    totalCount,
    isLoading,
    error,
    statistics,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    exportInvoices,
    filters,
    setFilters,
    pagination,
    setPagination
  } = useInvoicesManagement({
    companyId: selectedCompanyId,
    pageSize: 25,
    search: searchQuery,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    dateRange: dateRange !== 'all' ? dateRange : undefined
  });

  // Smart pagination
  const paginationState = useSmartPagination({
    totalItems: totalCount || 0,
    defaultPageSize: 25
  });

  // Memoized filtered invoices for performance
  const filteredInvoices = useMemo(() => {
    if (!invoices) return [];
    
    let filtered = [...invoices];
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(invoice => 
        invoice.invoiceNumber.toLowerCase().includes(query) ||
        invoice.clientName.toLowerCase().includes(query) ||
        invoice.clientEmail.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [invoices, searchQuery]);

  // Event handlers
  const handleCreateInvoice = useCallback(async (invoiceData: unknown) => {
    try {
      await createInvoice.mutateAsync(invoiceData);
      toast.success('Invoice created successfully');
      setIsCreateDialogOpen(false);
    } catch (error) {
      toast.error('Failed to create invoice');
    }
  }, [createInvoice]);

  const handleUpdateInvoice = useCallback(async (id: string, invoiceData: unknown) => {
    try {
      await updateInvoice.mutateAsync({ id, data: invoiceData });
      toast.success('Invoice updated successfully');
      setSelectedInvoice(null);
    } catch (error) {
      toast.error('Failed to update invoice');
    }
  }, [updateInvoice]);

  const handleDeleteInvoice = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    
    try {
      await deleteInvoice.mutateAsync(id);
      toast.success('Invoice deleted successfully');
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  }, [deleteInvoice]);

  const handleExportInvoices = useCallback(async () => {
    try {
      await exportInvoices.mutateAsync({ format: 'csv', filters });
      toast.success('Invoices exported successfully');
    } catch (error) {
      toast.error('Failed to export invoices');
    }
  }, [exportInvoices, filters]);

  const handleInvoiceClick = useCallback((invoice: unknown) => {
    setSelectedInvoice(invoice);
  }, []);

  // Loading states
  if (companiesLoading) {
    return <PageLoading message="Loading companies..." />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <FileText className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Invoices</h3>
            <p className="text-gray-600 mb-4">
              {error instanceof Error ? error.message : 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Invoices
                </h1>
                <p className="text-sm sm:text-base text-gray-600">
                  Manage your invoices and track payments
                </p>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <ApiErrorBoundary>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <StatsCardSkeleton key={i} />
                ))
              ) : (
                <>
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Invoices</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics?.totalInvoices?.toLocaleString() || 0}
                          </p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        +{statistics?.invoicesThisMonth || 0} this month
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Total Amount</p>
                          <p className="text-2xl font-bold text-gray-900">
                            ${statistics?.totalAmount?.toLocaleString() || 0}
                          </p>
                        </div>
                        <Download className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="mt-2 flex items-center text-sm text-green-600">
                        +${statistics?.amountThisMonth?.toLocaleString() || 0} this month
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Paid Invoices</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {statistics?.paidInvoices || 0}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-green-600">
                          {statistics?.paidPercentage || 0}%
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">Overdue</p>
                          <p className="text-2xl font-bold text-red-600">
                            {statistics?.overdueInvoices || 0}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          ${statistics?.overdueAmount?.toLocaleString() || 0}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </ApiErrorBoundary>

          {/* Controls */}
          <ApiErrorBoundary>
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 mb-6">
              <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                {/* Company Selection */}
                <Select
                  value={selectedCompanyId.toString()}
                  onValueChange={(value) => setSelectedCompanyId(parseInt(value))}
                >
                  <SelectTrigger className="w-full sm:w-64">
                    <SelectValue placeholder="Select company" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies?.map((company) => (
                      <SelectItem key={company.id} value={company.id.toString()}>
                        {company.tradingName || company.legalName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Search */}
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search invoices..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Filters */}
                <div className="flex space-x-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="DRAFT">Draft</SelectItem>
                      <SelectItem value="SENT">Sent</SelectItem>
                      <SelectItem value="PAID">Paid</SelectItem>
                      <SelectItem value="OVERDUE">Overdue</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                      <SelectItem value="quarter">This Quarter</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <DataViewToggle view={viewMode} onViewChange={setViewMode} />
                
                <Button
                  variant="outline"
                  onClick={handleExportInvoices}
                  disabled={exportInvoices.isPending}
                  className="flex items-center space-x-2"
                >
                  {exportInvoices.isPending ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                  <span>Export</span>
                </Button>

                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>New Invoice</span>
                </Button>
              </div>
            </div>
          </ApiErrorBoundary>

          {/* Invoice List */}
          <ApiErrorBoundary>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    Invoices ({totalCount?.toLocaleString() || 0})
                  </span>
                  {isLoading && <LoadingSpinner size="sm" />}
                </CardTitle>
                <CardDescription>
                  Manage and track all your invoices
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <InvoiceListSkeleton />
                ) : filteredInvoices.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No invoices found
                    </h3>
                    <p className="text-gray-600 mb-4">
                      {searchQuery || statusFilter !== 'all' || dateRange !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Get started by creating your first invoice'
                      }
                    </p>
                    <Button onClick={() => setIsCreateDialogOpen(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Invoice
                    </Button>
                  </div>
                ) : viewMode === 'list' ? (
                  <VirtualInvoiceList
                    invoices={filteredInvoices}
                    onInvoiceClick={handleInvoiceClick}
                    height={600}
                    loading={isLoading}
                  />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredInvoices.map((invoice) => (
                      <Card 
                        key={invoice.id} 
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => handleInvoiceClick(invoice)}
                      >
                        <CardContent className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h3 className="font-semibold">{invoice.invoiceNumber}</h3>
                              <p className="text-gray-600">{invoice.clientName}</p>
                            </div>
                            <Badge
                              variant={
                                invoice.status === 'PAID' ? 'default' :
                                invoice.status === 'SENT' ? 'secondary' :
                                invoice.status === 'OVERDUE' ? 'destructive' : 'outline'
                              }
                            >
                              {invoice.status}
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Amount:</span>
                              <span className="font-medium">
                                {invoice.currency} {invoice.totalAmount.toLocaleString()}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Due:</span>
                              <span className="text-sm">
                                {new Date(invoice.dueDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Pagination */}
                {filteredInvoices.length > 0 && (
                  <div className="mt-6">
                    <AdvancedPagination
                      currentPage={paginationState.currentPage}
                      totalPages={paginationState.totalPages}
                      pageSize={paginationState.pageSize}
                      totalItems={totalCount || 0}
                      onPageChange={paginationState.goToPage}
                      onPageSizeChange={paginationState.changePageSize}
                      disabled={isLoading}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </ApiErrorBoundary>

          {/* Create/Edit Invoice Dialog */}
          {/* Add your enhanced invoice dialog component here */}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default InvoicesPageEnhanced;