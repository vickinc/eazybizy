"use client";

import React, { useState } from "react";
import FileText from "lucide-react/dist/esm/icons/file-text";
import Plus from "lucide-react/dist/esm/icons/plus";
import Banknote from "lucide-react/dist/esm/icons/banknote";
import Users from "lucide-react/dist/esm/icons/users";
import Package from "lucide-react/dist/esm/icons/package";
import Download from "lucide-react/dist/esm/icons/download";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import { Button } from "@/components/ui/button";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useInvoicesManagementDB as useInvoicesManagement } from "@/hooks/useInvoicesManagementDB";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import { AccountSelectionDialog } from "@/components/features/AccountSelectionDialog";
import InvoicesLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense, useCallback } from 'react';
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BankAccount, DigitalWallet } from '@/types/banksWallets.types';
import { InvoicesExportService } from "@/services/business/invoicesExportService";

// Lazy load heavy components to improve initial bundle size
const InvoiceStats = dynamic(
  () => import('@/components/features/InvoiceStats').then(mod => ({ default: mod.InvoiceStats })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
            <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
            <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
            <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    ),
    ssr: true
  }
);

const InvoiceFilterBar = dynamic(
  () => import('@/components/features/InvoiceFilterBar').then(mod => ({ default: mod.InvoiceFilterBar })),
  {
    loading: () => (
      <div className="mb-6 bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ),
    ssr: true
  }
);

const InvoiceList = dynamic(
  () => import('@/components/features/InvoiceList').then(mod => ({ default: mod.InvoiceList })),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: true
  }
);

const InvoiceGroupedListView = dynamic(
  () => import('@/components/features/InvoiceGroupedListView').then(mod => ({ default: mod.InvoiceGroupedListView })),
  {
    loading: () => (
      <div className="bg-white rounded-lg shadow border">
        <div className="p-4 border-b border-gray-200">
          <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="divide-y divide-gray-200">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 sm:p-6">
              <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
              <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    ),
    ssr: true
  }
);

const InvoicePreviewDialog = dynamic(
  () => import('@/components/features/InvoicePreviewDialog').then(mod => ({ default: mod.InvoicePreviewDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

const AddEditInvoiceDialog = dynamic(
  () => import('@/components/features/AddEditInvoiceDialog').then(mod => ({ default: mod.AddEditInvoiceDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

export default function InvoicesClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const router = useRouter();
  const queryClient = useQueryClient();
  
  // Account selection dialog state
  const [showAccountDialog, setShowAccountDialog] = useState(false);
  const [pendingInvoiceId, setPendingInvoiceId] = useState<string | null>(null);
  const [pendingBulkInvoices, setPendingBulkInvoices] = useState<string[]>([]);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isBulkOperation, setIsBulkOperation] = useState(false);
  
  // Status change loading states
  const [markingSentInvoiceId, setMarkingSentInvoiceId] = useState<string | null>(null);
  const [markingPaidInvoiceId, setMarkingPaidInvoiceId] = useState<string | null>(null);
  
  const {
    // Data
    filteredInvoices,
    groupedInvoices,
    statistics,
    paymentMethods,
    clients,
    
    // UI Data Lists
    availableCurrencies,
    availableClients,
    
    // Computed Filtered Data
    activeProducts,
    formPaymentMethods,
    
    // Page Header Data
    pageTitle,
    pageDescription,
    
    // Company Info
    canAddInvoice,
    
    // UI State
    isLoading,
    showAddForm,
    editingInvoice,
    previewingInvoice,
    expandedInvoices,
    viewMode,
    selectedInvoices,
    
    // Form State
    invoiceForm,
    
    // New Filter State
    viewFilter,
    selectedPeriod,
    customDateRange,
    groupedView,
    groupBy,
    expandedGroups,
    
    // Legacy Filters
    searchTerm,
    filterStatus,
    filterClient,
    filterCurrency,
    
    // Sorting
    sortField,
    sortDirection,
    
    // Actions
    setShowAddForm,
    setEditingInvoice,
    setPreviewingInvoice,
    
    // New Filter Actions
    setViewFilter,
    setSelectedPeriod,
    setCustomDateRange,
    setGroupedView,
    setGroupBy,
    toggleGroupExpansion,
    
    // Legacy Filter Actions
    setSearchTerm,
    setFilterClient,
    setFilterCurrency,
    
    // Sorting Actions
    handleSort,
    handleSortFieldChange,
    handleSortDirectionChange,
    
    // Form Handlers
    handleInvoiceFormChange,
    resetForm,
    
    // Form Management Actions
    handleCreateInvoiceClick,
    handleInvoiceSelectionToggle,
    handleSelectAllInvoices,
    handleDeselectAllInvoices,
    isAllInvoicesSelected,
    handleAddFormItem,
    handleRemoveFormItem,
    handleUpdateFormItemProduct,
    handleUpdateFormItemQuantity,
    handleInvoiceRowClick,
    handlePaymentMethodToggle,
    
    // Invoice Operations
    handleCreateInvoice,
    handleUpdateInvoice,
    handleDeleteInvoice,
    handleArchiveInvoice,
    handleRestoreInvoice,
    handleMarkAsPaid,
    handleMarkAsSent,
    handleDuplicateInvoice,
    updateOverdueInvoices,
    
    // Bulk Operations
    handleBulkArchive,
    handleBulkMarkPaid,
    handleBulkMarkSent,
    handleBulkDelete,
    
    // Expansion Operations
    toggleAllExpansion,
    
    // PDF Operations
    downloadInvoicePDF
  } = useInvoicesManagement(globalSelectedCompany, companies);

  // Wrapper functions with loading state management
  const handleMarkAsSentWithLoading = useCallback(async (invoiceId: string) => {
    setMarkingSentInvoiceId(invoiceId);
    try {
      await handleMarkAsSent(invoiceId);
    } finally {
      setMarkingSentInvoiceId(null);
    }
  }, [handleMarkAsSent]);

  // Fetch bank accounts for account selection
  const { data: bankAccountsData } = useQuery({
    queryKey: ['bank-accounts', globalSelectedCompany],
    queryFn: async () => {
      if (globalSelectedCompany === 'all') return { data: [] };
      const response = await fetch(`/api/bank-accounts?companyId=${globalSelectedCompany}`);
      if (!response.ok) throw new Error('Failed to fetch bank accounts');
      return response.json();
    },
    enabled: globalSelectedCompany !== 'all' && globalSelectedCompany !== null,
    staleTime: 5 * 60 * 1000,
  });

  // Fetch digital wallets for account selection
  const { data: digitalWalletsData } = useQuery({
    queryKey: ['digital-wallets', globalSelectedCompany],
    queryFn: async () => {
      if (globalSelectedCompany === 'all') return { data: [] };
      const response = await fetch(`/api/digital-wallets?companyId=${globalSelectedCompany}`);
      if (!response.ok) throw new Error('Failed to fetch digital wallets');
      return response.json();
    },
    enabled: globalSelectedCompany !== 'all' && globalSelectedCompany !== null,
    staleTime: 5 * 60 * 1000,
  });

  const bankAccounts = bankAccountsData?.data || [];
  const digitalWallets = digitalWalletsData?.data || [];

  // Check if no real payment methods are available
  const hasNoPaymentMethods = formPaymentMethods.length === 0 || 
    (formPaymentMethods.length === 1 && formPaymentMethods[0].type === 'placeholder');

  // Check if no clients are available
  const hasNoClients = clients.length === 0;

  // Check if no products are available
  const hasNoProducts = activeProducts.length === 0;

  const handleNavigateToBanksWallets = () => {
    router.push('/accounting/banks-wallets');
  };

  const handleNavigateToClients = () => {
    router.push('/sales/clients');
  };

  const handleNavigateToProducts = () => {
    router.push('/sales/products');
  };

  // Custom mark as paid handler that opens account selection dialog
  const handleMarkAsPaidWithAccountSelection = useCallback((invoiceId: string) => {
    // Check if invoice is already paid
    const invoice = filteredInvoices.find(inv => inv.id === invoiceId);
    if (invoice?.status === 'PAID') {
      toast.info('Invoice is already marked as paid');
      return;
    }

    setPendingInvoiceId(invoiceId);
    setShowAccountDialog(true);
  }, [filteredInvoices]);

  // Handle account selection and mark invoice as paid
  const handleAccountSelected = useCallback(async (accountId: string, accountType: 'bank' | 'wallet') => {
    if (isBulkOperation && pendingBulkInvoices.length > 0) {
      // Handle bulk operation
      setIsMarkingPaid(true);
      try {
        // Filter out already paid invoices
        const invoicesToProcess = filteredInvoices.filter(inv => 
          pendingBulkInvoices.includes(inv.id) && inv.status !== 'PAID'
        );

        if (invoicesToProcess.length === 0) {
          toast.info('No invoices to process (all selected invoices are already paid)');
          return;
        }

        // Process each invoice
        const results = await Promise.all(invoicesToProcess.map(async (invoice) => {
          try {
            const response = await fetch(`/api/invoices/${invoice.id}/mark-paid`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                paidDate: new Date().toISOString(),
                accountId,
                accountType
              })
            });

            if (!response.ok) {
              const error = await response.json();
              throw new Error(error.error || 'Failed to mark invoice as paid');
            }

            return await response.json();
          } catch (error) {
            console.error(`Failed to mark invoice ${invoice.invoiceNumber} as paid:`, error);
            throw error;
          }
        }));

        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['invoices'] });
        await queryClient.invalidateQueries({ queryKey: ['invoices-statistics'] });
        
        toast.success(`${invoicesToProcess.length} invoice(s) marked as paid successfully`);
      } catch (error) {
        toast.error(`Failed to mark invoices as paid: ${error.message}`);
      } finally {
        setIsMarkingPaid(false);
        setShowAccountDialog(false);
        setPendingBulkInvoices([]);
        setIsBulkOperation(false);
      }
    } else if (pendingInvoiceId) {
      // Handle individual operation
      setIsMarkingPaid(true);
      setMarkingPaidInvoiceId(pendingInvoiceId);
      try {
        const response = await fetch(`/api/invoices/${pendingInvoiceId}/mark-paid`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paidDate: new Date().toISOString(),
            accountId,
            accountType
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to mark invoice as paid');
        }

        const result = await response.json();
        
        // Invalidate queries to refresh data
        await queryClient.invalidateQueries({ queryKey: ['invoices'] });
        await queryClient.invalidateQueries({ queryKey: ['invoices-statistics'] });
        
        // Show success message
        if (result.bookkeepingEntry) {
          toast.success('Invoice marked as paid and revenue entry created');
        } else {
          toast.success('Invoice marked as paid');
        }
      } catch (error) {
        toast.error(`Failed to mark invoice as paid: ${error.message}`);
      } finally {
        setIsMarkingPaid(false);
        setMarkingPaidInvoiceId(null);
        setShowAccountDialog(false);
        setPendingInvoiceId(null);
      }
    }
  }, [pendingInvoiceId, pendingBulkInvoices, isBulkOperation, filteredInvoices, queryClient]);

  // Handle bulk mark as paid with account selection
  const handleBulkMarkPaidWithAccountSelection = useCallback(() => {
    const selectedIds = Array.from(selectedInvoices);
    if (selectedIds.length === 0) {
      toast.error('No invoices selected');
      return;
    }

    // Check if any invoices need to be processed
    const invoicesToProcess = filteredInvoices.filter(inv => 
      selectedIds.includes(inv.id) && inv.status !== 'PAID'
    );

    if (invoicesToProcess.length === 0) {
      toast.info('All selected invoices are already marked as paid');
      return;
    }

    // Set up bulk operation state
    setPendingBulkInvoices(selectedIds);
    setIsBulkOperation(true);
    setShowAccountDialog(true);
  }, [selectedInvoices, filteredInvoices]);

  // Handle dialog close
  const handleAccountDialogClose = useCallback(() => {
    setShowAccountDialog(false);
    setPendingInvoiceId(null);
    setPendingBulkInvoices([]);
    setIsBulkOperation(false);
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const exportData = filteredInvoices.map(invoice => {
      const relatedCompany = companies.find(c => c.id === invoice.fromCompanyId);
      // Extract payment method IDs from the invoice structure
      const paymentMethodIds = invoice.paymentMethodInvoices?.map(pm => pm.paymentMethodId) || [];
      const paymentMethodNames = invoice.paymentMethodInvoices?.map(pm => pm.paymentMethod?.name || 'Unknown') || [];
      
      return {
        ...invoice,
        paymentMethodIds,
        companyName: relatedCompany?.tradingName || '',
        paymentMethodNames
      };
    });
    const companyName = globalSelectedCompany === 'all' ? 'All Companies' : 
      companies.find(c => c.id === globalSelectedCompany)?.tradingName || 'Unknown Company';
    InvoicesExportService.exportToCSV(exportData, `invoices-${companyName.toLowerCase().replace(/\s+/g, '-')}`);
  }, [filteredInvoices, companies, globalSelectedCompany]);

  const handleExportPDF = useCallback(() => {
    const exportData = filteredInvoices.map(invoice => {
      const relatedCompany = companies.find(c => c.id === invoice.fromCompanyId);
      // Extract payment method IDs from the invoice structure
      const paymentMethodIds = invoice.paymentMethodInvoices?.map(pm => pm.paymentMethodId) || [];
      const paymentMethodNames = invoice.paymentMethodInvoices?.map(pm => pm.paymentMethod?.name || 'Unknown') || [];
      
      return {
        ...invoice,
        paymentMethodIds,
        companyName: relatedCompany?.tradingName || '',
        paymentMethodNames
      };
    });
    const companyName = globalSelectedCompany === 'all' ? 'All Companies' : 
      companies.find(c => c.id === globalSelectedCompany)?.tradingName || 'Unknown Company';
    InvoicesExportService.exportToPDF(
      exportData, 
      companyName,
      {
        searchTerm,
        statusFilter: filterStatus,
        clientFilter: filterClient,
        currencyFilter: filterCurrency
      },
      `invoices-${companyName.toLowerCase().replace(/\s+/g, '-')}`
    );
  }, [filteredInvoices, companies, globalSelectedCompany, searchTerm, filterStatus, filterClient, filterCurrency]);

  // Memoized retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Handle loading state with skeleton UI
  if (isLoading) {
    return <InvoicesLoading />;
  }

  return (
    <ErrorBoundary level="page">
      <ApiErrorBoundary onRetry={handleRetry}>
        <div className="min-h-screen bg-lime-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                    {pageTitle}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600">
                    {pageDescription}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Methods Warning */}
            {canAddInvoice && hasNoPaymentMethods && (
              <div className="mb-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Banknote className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-amber-800 font-semibold">Setup Payment Methods Required</h3>
                      <p className="text-amber-700 text-sm">Before creating invoices, add bank accounts or digital wallets to display payment options to your clients.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNavigateToBanksWallets}
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Go to Banks & Wallets
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Clients Warning */}
            {canAddInvoice && hasNoClients && (
              <div className="mb-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Users className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-amber-800 font-semibold">Add Clients Required</h3>
                      <p className="text-amber-700 text-sm">Before creating invoices, add clients to your directory to bill them for your services.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNavigateToClients}
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Go to Clients
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Products Warning */}
            {canAddInvoice && hasNoProducts && (
              <div className="mb-8">
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-100 p-2 rounded-full">
                      <Package className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-amber-800 font-semibold">Add Products Required</h3>
                      <p className="text-amber-700 text-sm">Before creating invoices, add products or services to your catalog to include them in your invoices.</p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleNavigateToProducts}
                      className="border-amber-300 text-amber-800 hover:bg-amber-100"
                    >
                      Go to Products
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Company Selection Section */}
            <div className="mb-8">
              {canAddInvoice ? (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <Button
                    className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-lg font-bold text-white"
                    onClick={handleCreateInvoiceClick}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                    Create Invoice
                  </Button>
                  
                  {/* Export Dropdown - aligned right */}
                  {filteredInvoices.length > 0 && (
                    <div className="relative group">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 border border-gray-200 overflow-hidden" style={{ backgroundColor: 'white' }}>
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-t-md transition-colors"
                          style={{ backgroundColor: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(236, 253, 245)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as CSV
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-b-md transition-colors"
                          style={{ backgroundColor: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(236, 253, 245)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between w-full">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex-1">
                    <div className="flex items-center gap-3">
                      <div className="bg-amber-100 p-2 rounded-full">
                        <FileText className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                        <p className="text-amber-700 text-sm">Please select a specific company from the filter to create invoices.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export buttons even when no company selected */}
                  {filteredInvoices.length > 0 && (
                    <div className="relative group ml-4">
                      <Button
                        variant="outline"
                        className="w-full sm:w-auto"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export
                      </Button>
                      <div className="absolute right-0 mt-1 w-48 rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 border border-gray-200 overflow-hidden" style={{ backgroundColor: 'white' }}>
                        <button
                          onClick={handleExportCSV}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-t-md transition-colors"
                          style={{ backgroundColor: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(236, 253, 245)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Export as CSV
                        </button>
                        <button
                          onClick={handleExportPDF}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 rounded-b-md transition-colors"
                          style={{ backgroundColor: 'white' }}
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgb(236, 253, 245)'}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Export as PDF
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Statistics Cards */}
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6 sm:mb-8">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            }>
              <InvoiceStats statistics={statistics} />
            </Suspense>

            {/* Filter Bar */}
            <Suspense fallback={
              <div className="mb-6 bg-white rounded-lg shadow border p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            }>
              <InvoiceFilterBar
                viewFilter={viewFilter}
                groupedView={groupedView}
                selectedPeriod={selectedPeriod}
                customDateRange={customDateRange}
                filterClient={filterClient}
                filterCurrency={filterCurrency}
                groupBy={groupBy}
                searchTerm={searchTerm}
                availableClients={availableClients}
                availableCurrencies={availableCurrencies}
                setViewFilter={setViewFilter}
                setGroupedView={setGroupedView}
                setSelectedPeriod={setSelectedPeriod}
                setCustomDateRange={setCustomDateRange}
                setFilterClient={setFilterClient}
                setFilterCurrency={setFilterCurrency}
                setGroupBy={setGroupBy}
                setSearchTerm={setSearchTerm}
              />
            </Suspense>

            {/* Invoice List - Grouped or Regular */}
            {groupedView ? (
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow border">
                  <div className="p-4 border-b border-gray-200">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="p-4 sm:p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              }>
                <InvoiceGroupedListView
                  groupedInvoices={groupedInvoices}
                  expandedGroups={expandedGroups}
                  expandedInvoices={expandedInvoices}
                  selectedInvoices={selectedInvoices}
                  viewMode={viewMode}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  searchTerm={searchTerm}
                  filterStatus={filterStatus}
                  filterClient={filterClient}
                  globalSelectedCompany={globalSelectedCompany}
                  onInvoiceRowClick={handleInvoiceRowClick}
                  onInvoiceSelectionToggle={handleInvoiceSelectionToggle}
                  onSelectAllInvoices={handleSelectAllInvoices}
                  onDeselectAllInvoices={handleDeselectAllInvoices}
                  isAllInvoicesSelected={isAllInvoicesSelected}
                  onPreviewInvoice={setPreviewingInvoice}
                  onEditInvoice={setEditingInvoice}
                  onDownloadPDF={downloadInvoicePDF}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onMarkAsSent={handleMarkAsSentWithLoading}
                  onMarkAsPaid={handleMarkAsPaidWithAccountSelection}
                  onArchiveInvoice={handleArchiveInvoice}
                  onRestoreInvoice={handleRestoreInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onBulkMarkSent={handleBulkMarkSent}
                  onBulkMarkPaid={handleBulkMarkPaidWithAccountSelection}
                  onBulkArchive={handleBulkArchive}
                  onBulkDelete={handleBulkDelete}
                  onSort={handleSort}
                  onSortFieldChange={handleSortFieldChange}
                  onSortDirectionChange={handleSortDirectionChange}
                  toggleGroupExpansion={toggleGroupExpansion}
                  markingSentInvoiceId={markingSentInvoiceId}
                  markingPaidInvoiceId={markingPaidInvoiceId}
                />
              </Suspense>
            ) : (
              <Suspense fallback={
                <div className="bg-white rounded-lg shadow border">
                  <div className="p-4 border-b border-gray-200">
                    <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="p-4 sm:p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              }>
                <InvoiceList
                  filteredInvoices={filteredInvoices}
                  expandedInvoices={expandedInvoices}
                  selectedInvoices={selectedInvoices}
                  viewMode={viewMode}
                  sortField={sortField}
                  sortDirection={sortDirection}
                  searchTerm={searchTerm}
                  filterStatus={filterStatus}
                  filterClient={filterClient}
                  globalSelectedCompany={globalSelectedCompany}
                  onInvoiceRowClick={handleInvoiceRowClick}
                  onInvoiceSelectionToggle={handleInvoiceSelectionToggle}
                  onSelectAllInvoices={handleSelectAllInvoices}
                  onDeselectAllInvoices={handleDeselectAllInvoices}
                  isAllInvoicesSelected={isAllInvoicesSelected}
                  onPreviewInvoice={setPreviewingInvoice}
                  onEditInvoice={setEditingInvoice}
                  onDownloadPDF={downloadInvoicePDF}
                  onDuplicateInvoice={handleDuplicateInvoice}
                  onMarkAsSent={handleMarkAsSentWithLoading}
                  onMarkAsPaid={handleMarkAsPaidWithAccountSelection}
                  onArchiveInvoice={handleArchiveInvoice}
                  onRestoreInvoice={handleRestoreInvoice}
                  onDeleteInvoice={handleDeleteInvoice}
                  onBulkMarkSent={handleBulkMarkSent}
                  onBulkMarkPaid={handleBulkMarkPaidWithAccountSelection}
                  onBulkArchive={handleBulkArchive}
                  onBulkDelete={handleBulkDelete}
                  onSort={handleSort}
                  onSortFieldChange={handleSortFieldChange}
                  onSortDirectionChange={handleSortDirectionChange}
                  markingSentInvoiceId={markingSentInvoiceId}
                  markingPaidInvoiceId={markingPaidInvoiceId}
                />
              </Suspense>
            )}

            {/* Dialogs */}
            <InvoicePreviewDialog
              invoice={previewingInvoice}
              companies={companies}
              paymentMethods={paymentMethods}
              onClose={() => setPreviewingInvoice(null)}
            />

            <AddEditInvoiceDialog
              isOpen={showAddForm}
              editingInvoice={editingInvoice}
              invoiceForm={invoiceForm}
              clients={clients}
              activeProducts={activeProducts}
              formPaymentMethods={formPaymentMethods}
              companies={companies}
              globalSelectedCompany={globalSelectedCompany}
              onClose={() => setShowAddForm(false)}
              onFormChange={handleInvoiceFormChange}
              onAddFormItem={handleAddFormItem}
              onRemoveFormItem={handleRemoveFormItem}
              onUpdateFormItemProduct={handleUpdateFormItemProduct}
              onUpdateFormItemQuantity={handleUpdateFormItemQuantity}
              onPaymentMethodToggle={handlePaymentMethodToggle}
              onCreateInvoice={handleCreateInvoice}
              onUpdateInvoice={handleUpdateInvoice}
              onResetForm={resetForm}
            />

            {/* Account Selection Dialog */}
            <AccountSelectionDialog
              isOpen={showAccountDialog}
              onClose={handleAccountDialogClose}
              onSelectAccount={handleAccountSelected}
              bankAccounts={bankAccounts}
              digitalWallets={digitalWallets}
              title={isBulkOperation ? "Select Payment Account for Bulk Operation" : "Select Payment Account"}
              description={isBulkOperation 
                ? `Choose which account received payments for ${pendingBulkInvoices.length} invoice(s)`
                : "Choose which account received this invoice payment"
              }
              isLoading={isMarkingPaid}
            />
          </div>
        </div>
      </ApiErrorBoundary>
    </ErrorBoundary>
  );
}