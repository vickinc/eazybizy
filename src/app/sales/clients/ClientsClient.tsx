"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Plus from "lucide-react/dist/esm/icons/plus";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useClientsManagementDB } from "@/hooks/useClientsManagementDB";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import ClientsLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense, useCallback } from 'react';
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { ClientsExportService } from "@/services/business/clientsExportService";
import { InvoiceApiService } from "@/services/api/invoiceApiService";

// Lazy load heavy components to improve initial bundle size
const ClientStats = dynamic(
  () => import('@/components/features/ClientStats').then(mod => ({ default: mod.ClientStats })),
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

const ClientFilterBar = dynamic(
  () => import('@/components/features/ClientFilterBar').then(mod => ({ default: mod.ClientFilterBar })),
  {
    loading: () => (
      <div className="mb-6 bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ),
    ssr: true
  }
);

const ClientList = dynamic(
  () => import('@/components/features/ClientList').then(mod => ({ default: mod.ClientList })),
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

const AddEditClientDialog = dynamic(
  () => import('@/components/features/AddEditClientDialog').then(mod => ({ default: mod.AddEditClientDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

export default function ClientsClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Data
    filteredClients,
    statistics,
    
    // UI Data Lists
    availableIndustries,
    availableStatuses,
    
    // Page Header Data
    pageTitle,
    pageDescription,
    
    // Company Info
    selectedCompanyName,
    canAddClient,
    
    // UI State
    isLoading,
    showAddForm,
    editingClient,
    expandedClients,
    isAllExpanded,
    viewMode,
    
    // Form State
    clientForm,
    
    // Filters
    searchTerm,
    filterStatus,
    filterIndustry,
    
    // Actions
    setShowAddForm,
    setEditingClient,
    setSearchTerm,
    setFilterStatus,
    setFilterIndustry,
    setViewMode,
    
    // Form Handlers
    handleClientFormChange,
    resetForm,
    
    // Client Operations
    handleCreateClient,
    handleUpdateClient,
    handleDeleteClient,
    handleDuplicateClient,
    handleArchiveClient,
    handleRestoreClient,
    
    // Expansion Operations
    toggleClientExpansion,
    toggleAllExpansion
  } = useClientsManagementDB(globalSelectedCompany, companies);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Memoized retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Helper function to calculate real financial data from invoices
  const calculateClientFinancials = useCallback(async (clientId: string) => {
    try {
      const invoiceService = new InvoiceApiService();
      const invoicesResponse = await invoiceService.getInvoices({
        clientFilter: clientId,
        companyFilter: globalSelectedCompany !== 'all' ? globalSelectedCompany : 'all'
      });
      
      const invoices = invoicesResponse.data;
      const totalInvoiced = invoices.reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      const totalPaid = invoices
        .filter(invoice => invoice.status.toLowerCase() === 'paid')
        .reduce((sum, invoice) => sum + invoice.totalAmount, 0);
      
      return {
        calculatedTotalInvoiced: totalInvoiced,
        calculatedTotalPaid: totalPaid,
        invoiceCount: invoices.length
      };
    } catch (error) {
      console.warn('Failed to calculate financials for client:', clientId, error);
      return {
        calculatedTotalInvoiced: 0,
        calculatedTotalPaid: 0,
        invoiceCount: 0
      };
    }
  }, [globalSelectedCompany]);

  // Export handlers with real financial calculation
  const handleExportCSV = useCallback(async () => {
    try {
      // Calculate real financial data for each client
      const exportDataPromises = filteredClients.map(async (client) => {
        const relatedCompany = companies.find(c => c.id === client.companyId);
        const financials = await calculateClientFinancials(client.id);
        
        return {
          ...client,
          companyName: relatedCompany?.tradingName || '',
          ...financials
        };
      });
      
      const exportData = await Promise.all(exportDataPromises);
      const companyName = selectedCompanyName || 'All Companies';
      ClientsExportService.exportToCSV(exportData, `clients-${companyName.toLowerCase().replace(/\s+/g, '-')}`);
    } catch (error) {
      console.error('Export failed:', error);
      // Fallback to stored values if calculation fails
      const exportData = filteredClients.map(client => {
        const relatedCompany = companies.find(c => c.id === client.companyId);
        return {
          ...client,
          companyName: relatedCompany?.tradingName || ''
        };
      });
      const companyName = selectedCompanyName || 'All Companies';
      ClientsExportService.exportToCSV(exportData, `clients-${companyName.toLowerCase().replace(/\s+/g, '-')}`);
    }
  }, [filteredClients, selectedCompanyName, companies, calculateClientFinancials]);

  const handleExportPDF = useCallback(async () => {
    try {
      // Calculate real financial data for each client
      const exportDataPromises = filteredClients.map(async (client) => {
        const relatedCompany = companies.find(c => c.id === client.companyId);
        const financials = await calculateClientFinancials(client.id);
        
        return {
          ...client,
          companyName: relatedCompany?.tradingName || '',
          ...financials
        };
      });
      
      const exportData = await Promise.all(exportDataPromises);
      const companyName = selectedCompanyName || 'All Companies';
      ClientsExportService.exportToPDF(
        exportData, 
        companyName,
        {
          searchTerm,
          statusFilter: filterStatus,
          industryFilter: filterIndustry
        },
        `clients-${companyName.toLowerCase().replace(/\s+/g, '-')}`
      );
    } catch (error) {
      console.error('Export failed:', error);
      // Fallback to stored values if calculation fails
      const exportData = filteredClients.map(client => {
        const relatedCompany = companies.find(c => c.id === client.companyId);
        return {
          ...client,
          companyName: relatedCompany?.tradingName || ''
        };
      });
      const companyName = selectedCompanyName || 'All Companies';
      ClientsExportService.exportToPDF(
        exportData, 
        companyName,
        {
          searchTerm,
          statusFilter: filterStatus,
          industryFilter: filterIndustry
        },
        `clients-${companyName.toLowerCase().replace(/\s+/g, '-')}`
      );
    }
  }, [filteredClients, selectedCompanyName, searchTerm, filterStatus, filterIndustry, companies, calculateClientFinancials]);

  // Handle loading state with skeleton UI
  if (showLoader) {
    return <ClientsLoading />;
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
                  <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
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

            {/* Add Client Section */}
            <div className="mb-8">
              {canAddClient ? (
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <Button 
                    className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" 
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                    Add Client
                  </Button>
                  
                  {/* Export Dropdown - aligned right */}
                  {filteredClients.length > 0 && (
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
                        <UserCheck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                        <p className="text-amber-700 text-sm">Please select a specific company from the filter to add clients.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export buttons even when no company selected */}
                  {filteredClients.length > 0 && (
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
              <ClientStats statistics={statistics} />
            </Suspense>

            {/* Filter Bar */}
            <Suspense fallback={
              <div className="mb-6 bg-white rounded-lg shadow border p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            }>
              <ClientFilterBar
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterIndustry={filterIndustry}
                availableIndustries={availableIndustries}
                availableStatuses={availableStatuses}
                onSearchTermChange={setSearchTerm}
                onFilterStatusChange={setFilterStatus}
                onFilterIndustryChange={setFilterIndustry}
              />
            </Suspense>

            {/* Client List */}
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
              <ClientList
                filteredClients={filteredClients}
                expandedClients={expandedClients}
                isAllExpanded={isAllExpanded}
                viewMode={viewMode}
                statistics={statistics}
                searchTerm={searchTerm}
                filterStatus={filterStatus}
                filterIndustry={filterIndustry}
                globalSelectedCompany={globalSelectedCompany}
                onToggleClientExpansion={toggleClientExpansion}
                onToggleAllExpansion={toggleAllExpansion}
                onSetViewMode={setViewMode}
                onSetEditingClient={setEditingClient}
                onArchiveClient={handleArchiveClient}
                onRestoreClient={handleRestoreClient}
                onDeleteClient={handleDeleteClient}
                onDuplicateClient={handleDuplicateClient}
              />
            </Suspense>

            {/* Add/Edit Client Dialog */}
            <AddEditClientDialog
              isOpen={showAddForm}
              editingClient={editingClient}
              clientForm={clientForm}
              availableIndustries={availableIndustries}
              availableStatuses={availableStatuses}
              onOpenChange={setShowAddForm}
              onClientFormChange={handleClientFormChange}
              onCreateClient={handleCreateClient}
              onUpdateClient={handleUpdateClient}
              onResetForm={resetForm}
            />
          </div>
        </div>
      </ApiErrorBoundary>
    </ErrorBoundary>
  );
}