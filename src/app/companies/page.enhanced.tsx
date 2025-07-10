"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Building2, Grid, List, Filter, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompanyManagementCursor } from "@/hooks/useCompanyManagementCursor";
import { VirtualCompanyGrid } from "@/components/features/VirtualCompanyGrid";
import { CompanyDialog } from "@/components/features/CompanyDialog";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";

export default function CompaniesEnhanced() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showFilters, setShowFilters] = useState(false);

  const {
    // Data with loading states
    companies,
    isCompaniesLoading,
    isCompaniesError,
    companiesError,
    isFetchingNextPage,
    hasNextPage,
    
    // Statistics (cached)
    statistics,
    
    // UI State
    isDialogOpen,
    editingCompany,
    copiedFields,
    
    // Form State
    formData,
    logoPreview,
    
    // Filters
    filters,
    availableIndustries,
    
    // Form Actions
    handleInputChange,
    handleStatusChange,
    handleLogoUpload,
    removeLogo,
    
    // CRUD Operations
    handleSubmit,
    handleEdit,
    handleDelete,
    handleArchive,
    handleAddNew,
    
    // Utility Actions
    copyToClipboard,
    handleWebsiteClick,
    
    // Dialog Management
    closeDialog,
    
    // Pagination
    loadMore,
    
    // Filter Actions
    updateFilters,
  } = useCompanyManagementCursor();

  // Handle error state
  if (isCompaniesError) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <div className="p-6 text-center">
            <Building2 className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Companies</h3>
            <p className="text-gray-600 mb-4">
              {companiesError?.message || 'An unexpected error occurred'}
            </p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-lime-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Companies</h1>
                <p className="text-sm sm:text-base text-gray-600 mt-1 sm:mt-2">
                  Manage your business portfolio
                  {statistics && (
                    <span className="ml-2">
                      • {statistics.totalActive + statistics.totalPassive} total
                      • {statistics.totalActive} active
                      • {statistics.totalPassive} passive
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Search and Filters */}
            <div className="flex items-center space-x-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search companies..."
                  value={filters.searchTerm}
                  onChange={(e) => updateFilters({ searchTerm: e.target.value })}
                  className="pl-10"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-1"
              >
                <Filter className="h-4 w-4" />
                <span>Filters</span>
              </Button>
            </div>

            {/* View Mode and Add Company */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Dialog open={isDialogOpen} onOpenChange={(open) => !open && closeDialog()}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-black hover:bg-gray-800 text-white"
                    onClick={handleAddNew}
                  >
                    Add Company
                  </Button>
                </DialogTrigger>
              </Dialog>
            </div>
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <Card className="mb-6 p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <Select
                    value={filters.statusFilter}
                    onValueChange={(value) => updateFilters({ statusFilter: value as any })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Passive">Passive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry
                  </label>
                  <Select
                    value={filters.industryFilter}
                    onValueChange={(value) => updateFilters({ industryFilter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All industries" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All Industries</SelectItem>
                      {availableIndustries.map((industry) => (
                        <SelectItem key={industry} value={industry}>
                          {industry}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => updateFilters({ searchTerm: '', statusFilter: 'all', industryFilter: '' })}
                    className="w-full"
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Add Company Dialog */}
          <CompanyDialog
            isDialogOpen={isDialogOpen}
            editingCompany={editingCompany}
            formData={formData}
            logoPreview={logoPreview}
            handleInputChange={handleInputChange}
            handleStatusChange={handleStatusChange}
            handleLogoUpload={handleLogoUpload}
            removeLogo={removeLogo}
            handleSubmit={handleSubmit}
            handleAddNew={handleAddNew}
            closeDialog={closeDialog}
          />

          {/* Virtual Company Grid/List */}
          <ApiErrorBoundary>
            <VirtualCompanyGrid
              companies={companies}
              copiedFields={copiedFields}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleArchive={handleArchive}
              copyToClipboard={copyToClipboard}
              handleWebsiteClick={handleWebsiteClick}
              isLoading={isCompaniesLoading}
              hasNextPage={hasNextPage}
              loadMore={loadMore}
              isFetchingNextPage={isFetchingNextPage}
              viewMode={viewMode}
              height={600}
              className="mb-8"
            />
          </ApiErrorBoundary>

          {/* Performance Info (Debug) */}
          {process.env.NODE_ENV === 'development' && (
            <Card className="mt-8 p-4 bg-blue-50 border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Performance Info</h3>
              <div className="text-xs text-blue-700 space-y-1">
                <p>• Total companies loaded: {companies.length}</p>
                <p>• Using cursor pagination: {companies.length > 100 ? 'Yes' : 'No'}</p>
                <p>• Virtual scrolling active: {companies.length > 100 ? 'Yes' : 'No'}</p>
                <p>• View mode: {viewMode}</p>
                <p>• Has more data: {hasNextPage ? 'Yes' : 'No'}</p>
                <p>• Statistics cached: {statistics ? 'Yes' : 'No'}</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}