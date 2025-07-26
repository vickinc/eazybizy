"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Package from "lucide-react/dist/esm/icons/package";
import Plus from "lucide-react/dist/esm/icons/plus";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useProductsManagementDB } from "@/hooks/useProductsManagementDB";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import ProductsLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense, useCallback } from 'react';
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { ProductsExportService } from "@/services/business/productsExportService";

// Lazy load heavy components to improve initial bundle size
const ProductStats = dynamic(
  () => import('@/components/features/ProductStats').then(mod => ({ default: mod.ProductStats })),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
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

const ProductFilterBar = dynamic(
  () => import('@/components/features/ProductFilterBar').then(mod => ({ default: mod.ProductFilterBar })),
  {
    loading: () => (
      <div className="space-y-4">
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

const ProductList = dynamic(
  () => import('@/components/features/ProductList').then(mod => ({ default: mod.ProductList })),
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

const AddProductDialog = dynamic(
  () => import('@/components/features/AddProductDialog').then(mod => ({ default: mod.AddProductDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

const EditProductDialog = dynamic(
  () => import('@/components/features/EditProductDialog').then(mod => ({ default: mod.EditProductDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

export default function ProductsClient() {
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

  // Memoized retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const exportData = filteredProducts.map(product => ({
      ...product,
      vendorName: getVendorName(product.vendorId),
      companyName: getCompanyName(product.companyId)
    }));
    const companyName = selectedCompanyName || 'All Companies';
    ProductsExportService.exportToCSV(exportData, `products-${companyName.toLowerCase().replace(/\s+/g, '-')}`);
  }, [filteredProducts, selectedCompanyName, getVendorName, getCompanyName]);

  const handleExportPDF = useCallback(() => {
    const exportData = filteredProducts.map(product => ({
      ...product,
      vendorName: getVendorName(product.vendorId),
      companyName: getCompanyName(product.companyId)
    }));
    const companyName = selectedCompanyName || 'All Companies';
    ProductsExportService.exportToPDF(
      exportData, 
      companyName,
      {
        searchTerm,
        statusFilter,
        currencyFilter,
        vendorFilter
      },
      `products-${companyName.toLowerCase().replace(/\s+/g, '-')}`
    );
  }, [filteredProducts, selectedCompanyName, searchTerm, statusFilter, currencyFilter, vendorFilter, getVendorName, getCompanyName]);

  // Handle loading state with skeleton UI
  if (showLoader) {
    return <ProductsLoading />;
  }

  // Handle error state
  if (isError) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-sm text-gray-600 mb-4">{error?.message || 'Failed to load products'}</p>
          <Button 
            onClick={handleRetry} 
            className="bg-black hover:bg-gray-800 text-white"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <ApiErrorBoundary onRetry={handleRetry}>
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <Button
                    className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
                    onClick={() => setShowAddForm(true)}
                    disabled={isMutating}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                    Add Product
                  </Button>
                  
                  {/* Export Dropdown - aligned right */}
                  {filteredProducts.length > 0 && (
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
                        <Package className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                        <p className="text-amber-700 text-sm">Please select a specific company from the filter to add products.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export buttons even when no company selected */}
                  {filteredProducts.length > 0 && (
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
            <div className="mb-8">
              <Suspense fallback={
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                      <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                      <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              }>
                <ProductStats 
                  statistics={statistics}
                  formatCurrency={formatCurrency}
                  isLoaded={isLoaded}
                />
              </Suspense>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <Suspense fallback={
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-4">
                    <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              }>
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
              </Suspense>
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
                
                <Suspense fallback={
                  <div className="divide-y divide-gray-200">
                    {[...Array(3)].map((_, index) => (
                      <div key={index} className="p-4 sm:p-6">
                        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse mb-2" />
                        <div className="h-3 w-full bg-gray-100 rounded animate-pulse mb-1" />
                        <div className="h-3 w-3/4 bg-gray-100 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                }>
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
                </Suspense>
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
      </ApiErrorBoundary>
    </ErrorBoundary>
  );
}