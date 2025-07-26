"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Truck from "lucide-react/dist/esm/icons/truck";
import Plus from "lucide-react/dist/esm/icons/plus";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Download from "lucide-react/dist/esm/icons/download";
import FileText from "lucide-react/dist/esm/icons/file-text";
import FileSpreadsheet from "lucide-react/dist/esm/icons/file-spreadsheet";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useVendorsManagementDB } from "@/hooks/useVendorsManagementDB";
import { productApiService } from "@/services/api/productApiService";
import { useQueryClient } from "@tanstack/react-query";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import VendorsLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense, useCallback, useState } from 'react';
import { useDelayedLoading } from "@/hooks/useDelayedLoading";
import { VendorsExportService } from "@/services/business/vendorsExportService";

// Lazy load heavy components to improve initial bundle size
const VendorStats = dynamic(
  () => import('@/components/features/VendorStats').then(mod => ({ default: mod.VendorStats })),
  {
    loading: () => (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 sm:mb-8">
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

const VendorFilterBar = dynamic(
  () => import('@/components/features/VendorFilterBar').then(mod => ({ default: mod.VendorFilterBar })),
  {
    loading: () => (
      <div className="mb-6 bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    ),
    ssr: true
  }
);

const VendorList = dynamic(
  () => import('@/components/features/VendorList').then(mod => ({ default: mod.VendorList })),
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

const AddEditVendorDialog = dynamic(
  () => import('@/components/features/AddEditVendorDialog').then(mod => ({ default: mod.AddEditVendorDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

const AddProductDialog = dynamic(
  () => import('@/components/features/AddProductDialog').then(mod => ({ default: mod.AddProductDialog })),
  {
    loading: () => null,
    ssr: false
  }
);

export default function VendorsClient() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const queryClient = useQueryClient();
  
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

  // Memoized retry handler to prevent unnecessary re-renders
  const handleRetry = useCallback(() => {
    window.location.reload();
  }, []);

  // Export handlers
  const handleExportCSV = useCallback(() => {
    const exportData = filteredVendors.map(vendor => {
      const relatedCompany = companies.find(c => c.id === vendor.companyId);
      return {
        ...vendor,
        relatedCompanyName: relatedCompany?.tradingName || ''
      };
    });
    const companyName = selectedCompanyName || 'All Companies';
    VendorsExportService.exportToCSV(exportData, `vendors-${companyName.toLowerCase().replace(/\s+/g, '-')}`);
  }, [filteredVendors, selectedCompanyName, companies]);

  const handleExportPDF = useCallback(() => {
    const exportData = filteredVendors.map(vendor => {
      const relatedCompany = companies.find(c => c.id === vendor.companyId);
      return {
        ...vendor,
        relatedCompanyName: relatedCompany?.tradingName || ''
      };
    });
    const companyName = selectedCompanyName || 'All Companies';
    VendorsExportService.exportToPDF(
      exportData, 
      companyName,
      {
        searchTerm,
        statusFilter
      },
      `vendors-${companyName.toLowerCase().replace(/\s+/g, '-')}`
    );
  }, [filteredVendors, selectedCompanyName, searchTerm, statusFilter, companies]);

  // Product dialog state management
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    price: '',
    currency: 'USD',
    vendorId: '',
    cost: '',
    costCurrency: 'USD',
    description: ''
  });

  // Handle opening the Add Product dialog
  const handleOpenAddProductDialog = useCallback(() => {
    // Reset product form and auto-set company if one is selected
    setNewProduct({
      name: '',
      price: '',
      currency: 'USD',
      vendorId: '',
      cost: '',
      costCurrency: 'USD',
      description: ''
    });
    setShowProductDialog(true);
  }, []);

  // Handle closing the Add Product dialog
  const handleCloseAddProductDialog = useCallback(() => {
    setShowProductDialog(false);
    // Reset form on close
    setNewProduct({
      name: '',
      price: '',
      currency: 'USD',
      vendorId: '',
      cost: '',
      costCurrency: 'USD',
      description: ''
    });
  }, []);

  // Handle product form changes
  const handleProductFormChange = useCallback((field: string, value: unknown) => {
    setNewProduct(prev => ({ ...prev, [field]: value }));
  }, []);

  // Handle creating a new product
  const handleCreateProduct = useCallback(async () => {
    try {
      // Validation
      if (!newProduct.name.trim()) {
        alert('Product name is required');
        return;
      }
      
      if (!newProduct.price || parseFloat(newProduct.price) <= 0) {
        alert('Valid price is required');
        return;
      }

      // Get the selected company ID
      const companyId = globalSelectedCompany !== 'all' ? globalSelectedCompany : null;
      if (!companyId) {
        alert('Please select a company to add products');
        return;
      }

      // Prepare product data for API
      const productData = {
        name: newProduct.name.trim(),
        description: newProduct.description.trim(),
        price: parseFloat(newProduct.price),
        currency: newProduct.currency,
        cost: newProduct.cost ? parseFloat(newProduct.cost) : 0,
        costCurrency: newProduct.costCurrency,
        vendorId: newProduct.vendorId || null,
        isActive: true,
        companyId: companyId
      };

      // Create product via API
      const createdProduct = await productApiService.createProduct(productData);
      
      // Invalidate products cache to refresh the product lists
      await queryClient.invalidateQueries({ 
        queryKey: ['products'] 
      });
      
      // Also invalidate the specific company's products if we're filtering by company
      if (globalSelectedCompany !== 'all') {
        await queryClient.invalidateQueries({ 
          queryKey: ['products', globalSelectedCompany] 
        });
      }
      
      // Close dialog and reset form after successful creation
      setShowProductDialog(false);
      setNewProduct({
        name: '',
        price: '',
        currency: 'USD',
        vendorId: '',
        cost: '',
        costCurrency: 'USD',
        description: ''
      });

      // Show success message (you might want to use a toast notification instead)
      console.log('Product created successfully:', createdProduct);
      
      // Product list will now be refreshed in both vendor dialog and products page
      
    } catch (error) {
      console.error('Error creating product:', error);
      alert('Failed to create product. Please try again.');
    }
  }, [newProduct, globalSelectedCompany, queryClient]);

  // Handle loading state with skeleton UI
  if (showLoader) {
    return <VendorsLoading />;
  }

  return (
    <ErrorBoundary level="page">
      <ApiErrorBoundary onRetry={handleRetry}>
        <div className="min-h-screen bg-lime-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
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
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <Button 
                    className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" 
                    onClick={() => setShowAddForm(true)}
                  >
                    <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                    Add Vendor
                  </Button>
                  
                  {/* Export Dropdown - aligned right */}
                  {filteredVendors.length > 0 && (
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
                        <Truck className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                        <p className="text-amber-700 text-sm">Please select a specific company from the filter to add vendors.</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Export buttons even when no company selected */}
                  {filteredVendors.length > 0 && (
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

            {/* Stats Cards */}
            <Suspense fallback={
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 sm:mb-8">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow border p-4 sm:p-6">
                    <div className="h-4 w-20 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-1" />
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse" />
                  </div>
                ))}
              </div>
            }>
              <VendorStats statistics={statistics} />
            </Suspense>

            {/* Filters and Search */}
            <Suspense fallback={
              <div className="mb-6 bg-white rounded-lg shadow border p-4">
                <div className="flex flex-wrap gap-4">
                  <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                  <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            }>
              <VendorFilterBar
                searchTerm={searchTerm}
                statusFilter={statusFilter}
                setSearchTerm={setSearchTerm}
                setStatusFilter={setStatusFilter}
              />
            </Suspense>

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
            </Suspense>

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
              onOpenAddProductDialog={handleOpenAddProductDialog}
              onCreateVendor={handleCreateVendor}
              onUpdateVendor={handleUpdateVendor}
              getFilteredProducts={getFilteredProducts}
              getSelectedProducts={getSelectedProducts}
            />

            {/* Add Product Dialog */}
            <AddProductDialog
              isOpen={showProductDialog}
              onClose={handleCloseAddProductDialog}
              newProduct={newProduct}
              selectedCompanyName={getSelectedCompanyName()}
              availableCurrencies={availableCurrencies}
              availableVendors={vendors.filter(v => v.isActive)} // Use active vendors from current data
              onProductFormChange={handleProductFormChange}
              onCreateProduct={handleCreateProduct}
              onResetForm={handleCloseAddProductDialog}
            />
          </div>
        </div>
      </ApiErrorBoundary>
    </ErrorBoundary>
  );
}