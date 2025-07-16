"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Plus from "lucide-react/dist/esm/icons/plus";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useClientsManagementDB } from "@/hooks/useClientsManagementDB";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";
import ClientsLoading from "./loading";
import dynamic from 'next/dynamic';
import { Suspense, useCallback } from 'react';
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

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
                <Button 
                  className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white" 
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
                  Add Client
                </Button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
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