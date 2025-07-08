"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useInvoicesManagement } from "@/hooks/useInvoicesManagement";
import { InvoiceStats } from "@/components/features/InvoiceStats";
import { InvoiceFilterBar } from "@/components/features/InvoiceFilterBar";
import { InvoiceActions } from "@/components/features/InvoiceActions";
import { InvoiceList } from "@/components/features/InvoiceList";
import { InvoicePreviewDialog } from "@/components/features/InvoicePreviewDialog";
import { AddEditInvoiceDialog } from "@/components/features/AddEditInvoiceDialog";

export default function InvoicesPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Data
    filteredInvoices,
    statistics,
    paymentMethods,
    clients,
    
    // UI Data Lists
    availableStatuses,
    availableCurrencies,
    availableClients,
    
    // Computed Filtered Data
    activeProducts,
    formPaymentMethods,
    
    // Page Header Data
    pageTitle,
    pageDescription,
    
    // UI State
    isLoaded,
    showAddForm,
    editingInvoice,
    previewingInvoice,
    expandedInvoices,
    isAllExpanded,
    viewMode,
    selectedInvoices,
    
    // Form State
    invoiceForm,
    
    // Filters
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
    setSearchTerm,
    setFilterStatus,
    setFilterClient,
    setFilterCurrency,
    setViewMode,
    
    // Sorting Actions
    handleSort,
    
    // Form Handlers
    handleInvoiceFormChange,
    resetForm,
    
    // Form Management Actions
    handleCreateInvoiceClick,
    handleInvoiceSelectionToggle,
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

  if (!isLoaded) {
    return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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

      <InvoiceStats statistics={statistics} />

      <InvoiceFilterBar
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        filterClient={filterClient}
        setFilterClient={setFilterClient}
        filterCurrency={filterCurrency}
        setFilterCurrency={setFilterCurrency}
        availableStatuses={availableStatuses}
        availableClients={availableClients}
        availableCurrencies={availableCurrencies}
      />

      <InvoiceActions
        onCreateInvoice={handleCreateInvoiceClick}
        filteredInvoicesCount={filteredInvoices.length}
        isAllExpanded={isAllExpanded}
        onToggleAllExpansion={toggleAllExpansion}
        onUpdateOverdue={updateOverdueInvoices}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        statistics={statistics}
      />

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
      />

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