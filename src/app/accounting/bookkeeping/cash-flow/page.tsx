"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Plus from "lucide-react/dist/esm/icons/plus";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useCashflowManagement } from '@/hooks/useCashflowManagement';
import { CashflowFilterBar } from '@/components/features/CashflowFilterBar';
import { CashflowSummaryCards } from '@/components/features/CashflowSummaryCards';
import { CashflowAccountsList } from '@/components/features/CashflowAccountsList';
import { ManualEntryDialog } from '@/components/features/ManualEntryDialog';
import { LoadingScreen } from '@/components/ui/LoadingScreen';


export default function CashflowPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Use the comprehensive hook for all state and business logic
  const {
    // Computed Data
    enhancedGroupedCashflow,
    enhancedBankAccounts,
    enhancedDigitalWallets,
    cashflowSummary,
    pageTitle,
    pageDescription,
    
    // UI State
    isLoaded,
    selectedPeriod,
    customDateRange,
    groupBy,
    filterBy,
    viewFilter,
    groupedView,
    searchTerm,
    expandedGroups,
    isAllExpanded,
    showManualEntryDialog,
    newManualEntry,
    
    // Event Handlers
    setSelectedPeriod,
    setCustomDateRange,
    setGroupBy,
    setFilterBy,
    setViewFilter,
    setGroupedView,
    setSearchTerm,
    updateNewManualEntry,
    
    toggleGroupExpansion,
    toggleAllExpansion,
    
    handleShowManualEntryDialog,
    handleCloseManualEntryDialog,
    handleCreateManualEntry,
    
    // Utility Functions (minimal - only what main page needs)
    formatCurrency
  } = useCashflowManagement(globalSelectedCompany || 'all', companies);

  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
              {pageTitle}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 line-clamp-2">
              {pageDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <CashflowSummaryCards
        summary={cashflowSummary}
        formatCurrency={formatCurrency}
      />

      {/* Filters and Search */}
      <CashflowFilterBar
        viewFilter={viewFilter}
        groupedView={groupedView}
        selectedPeriod={selectedPeriod}
        customDateRange={customDateRange}
        filterBy={filterBy}
        groupBy={groupBy}
        searchTerm={searchTerm}
        setViewFilter={setViewFilter}
        setGroupedView={setGroupedView}
        setSelectedPeriod={setSelectedPeriod}
        setCustomDateRange={setCustomDateRange}
        setFilterBy={setFilterBy}
        setGroupBy={setGroupBy}
        setSearchTerm={setSearchTerm}
      />

      {/* Action Buttons */}
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex space-x-4">
            <Button
              className="bg-black hover:bg-gray-800 text-white"
              onClick={handleShowManualEntryDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manual Cashflow
            </Button>
          </div>
          
          {/* Expand All Button */}
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
        </div>
      </div>

      {/* Cashflow Display */}
      <CashflowAccountsList
        enhancedGroupedCashflow={enhancedGroupedCashflow}
        groupedView={groupedView}
        expandedGroups={expandedGroups}
        toggleGroupExpansion={toggleGroupExpansion}
      />

      {/* Manual Entry Dialog */}
      <ManualEntryDialog
        open={showManualEntryDialog}
        onClose={handleCloseManualEntryDialog}
        newManualEntry={newManualEntry}
        enhancedBankAccounts={enhancedBankAccounts}
        enhancedDigitalWallets={enhancedDigitalWallets}
        selectedCompany={globalSelectedCompany}
        updateNewManualEntry={updateNewManualEntry}
        handleCreateManualEntry={handleCreateManualEntry}
      />
      </div>
    </div>
  );
} 