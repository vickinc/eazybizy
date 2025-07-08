"use client";

import React from "react";
import { FileText, Plus, Banknote, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useInvoicesManagementDB as useInvoicesManagement } from "@/hooks/useInvoicesManagementDB";
import { InvoiceStats } from "@/components/features/InvoiceStats";
import { InvoiceFilterBar } from "@/components/features/InvoiceFilterBar";
import { InvoiceList } from "@/components/features/InvoiceList";
import { InvoiceGroupedListView } from "@/components/features/InvoiceGroupedListView";
import { InvoicePreviewDialog } from "@/components/features/InvoicePreviewDialog";
import { AddEditInvoiceDialog } from "@/components/features/AddEditInvoiceDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useRouter } from "next/navigation";

export default function InvoicesPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const router = useRouter();
  
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

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
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
          <Button
            className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-lg font-bold text-white"
            onClick={handleCreateInvoiceClick}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
            Create Invoice
          </Button>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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
        )}
      </div>

      <InvoiceStats statistics={statistics} />

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


      {groupedView ? (
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
          onMarkAsSent={handleMarkAsSent}
          onMarkAsPaid={handleMarkAsPaid}
          onArchiveInvoice={handleArchiveInvoice}
          onRestoreInvoice={handleRestoreInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onBulkMarkSent={handleBulkMarkSent}
          onBulkMarkPaid={handleBulkMarkPaid}
          onBulkArchive={handleBulkArchive}
          onBulkDelete={handleBulkDelete}
          onSort={handleSort}
          onSortFieldChange={handleSortFieldChange}
          onSortDirectionChange={handleSortDirectionChange}
          toggleGroupExpansion={toggleGroupExpansion}
        />
      ) : (
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
          onMarkAsSent={handleMarkAsSent}
          onMarkAsPaid={handleMarkAsPaid}
          onArchiveInvoice={handleArchiveInvoice}
          onRestoreInvoice={handleRestoreInvoice}
          onDeleteInvoice={handleDeleteInvoice}
          onBulkMarkSent={handleBulkMarkSent}
          onBulkMarkPaid={handleBulkMarkPaid}
          onBulkArchive={handleBulkArchive}
          onBulkDelete={handleBulkDelete}
          onSort={handleSort}
          onSortFieldChange={handleSortFieldChange}
          onSortDirectionChange={handleSortDirectionChange}
        />
      )}

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
      </div>
    </div>
  );
}