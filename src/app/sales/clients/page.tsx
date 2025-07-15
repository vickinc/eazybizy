"use client";

import React from "react";

// Disable static generation for this page
export const dynamic = 'force-dynamic';
import { Button } from "@/components/ui/button";
import UserCheck from "lucide-react/dist/esm/icons/user-check";
import Plus from "lucide-react/dist/esm/icons/plus";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useClientsManagementDB } from "@/hooks/useClientsManagementDB";
import { ClientStats } from "@/components/features/ClientStats";
import { ClientFilterBar } from "@/components/features/ClientFilterBar";
import { ClientList } from "@/components/features/ClientList";
import { AddEditClientDialog } from "@/components/features/AddEditClientDialog";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

export default function ClientsPage() {
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

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
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

      <ClientStats statistics={statistics} />

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
  );
}