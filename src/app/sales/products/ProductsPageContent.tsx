"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Package from "lucide-react/dist/esm/icons/package";
import Plus from "lucide-react/dist/esm/icons/plus";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useProductsManagementDB } from "@/hooks/useProductsManagementDB";
import { ProductStats } from "@/components/features/ProductStats";
import { ProductFilterBar } from "@/components/features/ProductFilterBar";
import { ProductList } from "@/components/features/ProductList";
import { AddProductDialog } from "@/components/features/AddProductDialog";
import { EditProductDialog } from "@/components/features/EditProductDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export function ProductsPageContent() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  const {
    // Data
    filteredProducts,
    statistics,
    
    // UI Data Lists
    availableCurrencies,
    activeCompanies,
    
    // UI State
    isLoaded,
    showAddForm,
    editingProduct,
    expandedProducts,
    isAllExpanded,
    highlightedProductId,
    
    // Filters
    searchTerm,
    statusFilter,
    currencyFilter,
    vendorFilter,
    companyFilter,
    sortField,
    sortDirection,
    
    // Product Form State
    productFormData,
    newProduct,
    
    // Company Info
    selectedCompanyName,
    canAddProduct,
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    isMutating,
    
    // Product Actions
    handleAddProduct,
    handleUpdateProduct,
    handleEditProduct,
    handleDeleteProduct,
    handleDuplicateProduct,
    handleToggleStatus,
    resetProductForm,
    updateProductFormData,
    
    
    // Form Handlers
    handleProductFormChange,
    
    // Helper Functions
    getFilteredVendors,
    
    // UI Actions
    setSearchTerm,
    setStatusFilter,
    setCurrencyFilter,
    setVendorFilter,
    setCompanyFilter,
    setSortField,
    setSortDirection,
    
    setShowAddForm,
    setEditingProduct,
    
    toggleProductExpansion,
    toggleAllProductsExpansion,
    
    // Utility Functions
    formatCurrency,
    getCompanyName,
    getVendorName,
    getSelectedCompanyName
  } = useProductsManagementDB(globalSelectedCompany, companies);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading || !isLoaded);

  if (showLoader) {
    return <LoadingScreen />;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-sm text-gray-600 mb-4">{error?.message || 'Failed to load products'}</p>
          <Button 
            onClick={() => window.location.reload()} 
            className="bg-black hover:bg-gray-800 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Products & Services</h1>
                <p className="text-sm text-gray-600">
                  Manage your product catalog, pricing, and inventory
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add Product Section */}
        <div className="mb-8">
          {canAddProduct ? (
            <Button
              className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
              onClick={() => setShowAddForm(true)}
              disabled={isMutating}
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
              Add Product
            </Button>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Package className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                  <p className="text-amber-700 text-sm">Please select a specific company from the filter to add products.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Statistics Cards */}
        <div className="mb-8">
          <ProductStats 
            statistics={statistics}
            formatCurrency={formatCurrency}
            isLoaded={isLoaded}
          />
        </div>

        {/* Filters */}
        <div className="mb-6">
          <ProductFilterBar
            searchTerm={searchTerm}
            statusFilter={statusFilter}
            currencyFilter={currencyFilter}
            vendorFilter={vendorFilter}
            companyFilter={companyFilter}
            sortField={sortField}
            sortDirection={sortDirection}
            onSearchTermChange={setSearchTerm}
            onStatusFilterChange={setStatusFilter}
            onCurrencyFilterChange={setCurrencyFilter}
            onVendorFilterChange={setVendorFilter}
            onCompanyFilterChange={setCompanyFilter}
            onSortFieldChange={setSortField}
            onSortDirectionChange={setSortDirection}
            availableCurrencies={availableCurrencies}
            activeCompanies={activeCompanies}
          />
        </div>


        {/* Product List */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow border">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Products ({filteredProducts.length})
                  </h2>
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllProductsExpansion}
                  className="flex items-center space-x-2"
                >
                  {isAllExpanded ? (
                    <>
                      <Minimize2 className="h-4 w-4" />
                      <span>Collapse All</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="h-4 w-4" />
                      <span>Expand All</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            <ProductList
              products={filteredProducts}
              expandedProducts={expandedProducts}
              highlightedProductId={highlightedProductId}
              onToggleExpansion={toggleProductExpansion}
              onToggleStatus={handleToggleStatus}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onDuplicate={handleDuplicateProduct}
              formatCurrency={formatCurrency}
              getCompanyName={getCompanyName}
              getVendorName={getVendorName}
            />
          </div>
        </div>

        {/* Dialogs */}
        <AddProductDialog
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          newProduct={newProduct}
          selectedCompanyName={selectedCompanyName}
          availableCurrencies={availableCurrencies}
          availableVendors={getFilteredVendors()}
          onProductFormChange={handleProductFormChange}
          onCreateProduct={handleAddProduct}
          onResetForm={resetProductForm}
        />

        <EditProductDialog
          editingProduct={editingProduct ? {
            id: editingProduct.id,
            companyId: editingProduct.companyId,
            name: editingProduct.name,
            price: editingProduct.price,
            currency: editingProduct.currency,
            vendorId: editingProduct.vendorId,
            cost: editingProduct.cost,
            costCurrency: editingProduct.costCurrency,
            description: editingProduct.description
          } : null}
          onClose={() => setEditingProduct(null)}
          activeCompanies={activeCompanies}
          availableCurrencies={availableCurrencies}
          availableVendors={getFilteredVendors()}
          onEditProductFormChange={(field, value) => {
            if (editingProduct) {
              setEditingProduct({ ...editingProduct, [field]: value });
            }
          }}
          onUpdateProduct={handleUpdateProduct}
        />

      </div>
    </div>
  );
}