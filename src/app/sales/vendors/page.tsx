"use client";

import React from "react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import { Plus, Minimize2, Maximize2, Truck } from "lucide-react";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useVendorsManagementDB } from "@/hooks/useVendorsManagementDB";
import { VendorStats } from "@/components/features/VendorStats";
import { VendorFilterBar } from "@/components/features/VendorFilterBar";
import { VendorList } from "@/components/features/VendorList";
import { AddEditVendorDialog } from "@/components/features/AddEditVendorDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";


export default function VendorsPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Data
    vendors,
    filteredVendors,
    statistics,
    
    // UI Data Lists
    availableCurrencies,
    availableCountries,
    availablePaymentTermsOptions,
    availablePaymentMethods,
    
    // UI State
    isLoading,
    showAddForm,
    editingVendor,
    expandedVendors,
    isAllExpanded,
    viewMode,
    
    // Company Info
    selectedCompanyName,
    canAddVendor,
    
    // Form State
    vendorForm,
    customPaymentTerms,
    productSearchTerm,
    
    // Filters
    searchTerm,
    statusFilter,
    
    // Actions
    setShowAddForm,
    setEditingVendor,
    setSearchTerm,
    setStatusFilter,
    setViewMode,
    setProductSearchTerm,
    
    // Form Handlers
    handleVendorFormChange,
    handleCustomPaymentTermsChange,
    resetForm,
    
    // Vendor Operations
    handleCreateVendor,
    handleUpdateVendor,
    handleDeleteVendor,
    handleDuplicateVendor,
    handleToggleStatus,
    
    // Product Operations
    handleProductToggle,
    getFilteredProducts,
    getSelectedProducts,
    
    // Expansion Operations
    toggleVendorExpansion,
    toggleAllExpansion,
    
    // Helper Functions
    navigateToProducts,
    getSelectedCompanyName
  } = useVendorsManagementDB(globalSelectedCompany, companies);

  // Dynamic page title based on company filter
  const pageTitle = globalSelectedCompany === 'all' 
    ? 'Vendors' 
    : `${companies.find(c => c.id === globalSelectedCompany)?.tradingName || 'Company'} - Vendors`;

  // Calculate actual vendor counts from data
  const activeVendorsCount = vendors.filter(v => v.isActive).length;
  const archivedVendorsCount = vendors.filter(v => !v.isActive).length;

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-gray-100 rounded-lg">
            <Truck className="h-6 w-6 sm:h-8 sm:w-8 text-gray-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">{pageTitle}</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage vendor information for expense tracking</p>
          </div>
        </div>
      </div>

      {/* Add Vendor Section */}
      <div className="mb-8">
        {canAddVendor ? (
          <Button 
            className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" 
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
            Add Vendor
          </Button>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="bg-amber-100 p-2 rounded-full">
                <Truck className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                <p className="text-amber-700 text-sm">Please select a specific company from the filter to add vendors.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <VendorStats statistics={statistics} />

      {/* Filters and Search */}
      <VendorFilterBar
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        setSearchTerm={setSearchTerm}
        setStatusFilter={setStatusFilter}
      />

      {/* Vendor Action Buttons and View Mode Tabs */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div></div>
        
        <div className="flex items-center flex-wrap gap-2">
          {filteredVendors.length > 0 && (
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleAllExpansion}
            >
              {isAllExpanded ? (
                <>
                  <Minimize2 className="h-4 w-4 mr-2" />
                  Collapse All
                </>
              ) : (
                <>
                  <Maximize2 className="h-4 w-4 mr-2" />
                  Expand All
                </>
              )}
            </Button>
          )}
          
          <div className="flex bg-gray-100 rounded-lg p-1 w-fit">
            <Button
              variant={viewMode === 'active' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('active')}
              className={viewMode === 'active' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
            >
              Active Vendors
            </Button>
            <Button
              variant={viewMode === 'archived' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('archived')}
              className={viewMode === 'archived' ? 'bg-black text-white hover:bg-black' : 'hover:bg-gray-200'}
            >
              Archived ({archivedVendorsCount})
            </Button>
          </div>
        </div>
      </div>

      {/* Vendors List */}
      <VendorList
        filteredVendors={filteredVendors}
        expandedVendors={expandedVendors}
        viewMode={viewMode}
        searchTerm={searchTerm}
        statusFilter={statusFilter}
        globalSelectedCompany={globalSelectedCompany}
        onToggleVendorExpansion={toggleVendorExpansion}
        onEdit={setEditingVendor}
        onToggleStatus={handleToggleStatus}
        onDelete={handleDeleteVendor}
        onDuplicate={handleDuplicateVendor}
      />

      {/* Add/Edit Vendor Dialog */}
      <AddEditVendorDialog
        open={showAddForm}
        editingVendor={editingVendor}
        vendorForm={vendorForm}
        customPaymentTerms={customPaymentTerms}
        productSearchTerm={productSearchTerm}
        selectedCompanyName={selectedCompanyName}
        availableCountries={availableCountries}
        availablePaymentTermsOptions={availablePaymentTermsOptions}
        availableCurrencies={availableCurrencies}
        availablePaymentMethods={availablePaymentMethods}
        onClose={resetForm}
        onVendorFormChange={handleVendorFormChange}
        onCustomPaymentTermsChange={handleCustomPaymentTermsChange}
        onProductSearchTermChange={setProductSearchTerm}
        onProductToggle={handleProductToggle}
        onNavigateToProducts={navigateToProducts}
        onCreateVendor={handleCreateVendor}
        onUpdateVendor={handleUpdateVendor}
        getFilteredProducts={getFilteredProducts}
        getSelectedProducts={getSelectedProducts}
      />

      </div>
    </div>
  );
}