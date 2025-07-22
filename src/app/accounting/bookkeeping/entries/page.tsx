"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useBookkeepingEntriesManagement } from '@/hooks/useBookkeepingEntriesManagement';
import { EntriesFilterBar } from '@/components/features/EntriesFilterBar';
import { EntriesListView } from '@/components/features/EntriesListView';
import { AddEditEntryDialog } from '@/components/features/AddEditEntryDialog';
import { BulkAddDialog } from '@/components/features/BulkAddDialog';
import { formatDateForDisplay } from '@/utils';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import Plus from "lucide-react/dist/esm/icons/plus";
import Upload from "lucide-react/dist/esm/icons/upload";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import ToggleLeft from "lucide-react/dist/esm/icons/toggle-left";
import ToggleRight from "lucide-react/dist/esm/icons/toggle-right";
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import Receipt from "lucide-react/dist/esm/icons/receipt";

export default function EntriesPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Use the bookkeeping entries management hook
  const {
    // Core data
    filteredEntries,
    processedGroupedEntries,
    accounts,
    invoices,
    products,
    vendors,
    activeCompanies,
    financialSummary,
    expenseBreakdown,
    isLoaded,

    // Filters and view state
    filters,
    selectedEntries,
    expandedEntries,
    expandedGroups,
    groupedView,
    highlightedEntryId,
    showEntryDialog,
    showBulkAddDialog,
    showDeleteConfirmDialog,
    showDeleteSingleDialog,
    editingEntry,
    entryToDelete,
    isAllExpanded,
    entriesToDeleteDetails,

    // Event handlers
    handleCreateEntry,
    handleEditEntry,
    handleUpdateEntry,
    handleDeleteEntry,
    confirmSingleDelete,
    handleBulkDelete,
    confirmBulkDelete,
    toggleEntryExpansion,
    toggleEntrySelection,
    toggleSelectAll,
    toggleAllEntriesExpansion,
    toggleGroupExpansion,
    toggleGroupedView,
    handleShowAddDialog,
    handleShowBulkDialog,
    handleCancelEdit,
    setShowEntryDialog,
    setShowBulkAddDialog,
    setShowDeleteConfirmDialog,
    setShowDeleteSingleDialog,
    handleFilterChange,
    handleLinkToIncome,
    handleViewRelatedIncomeEntry,

    // Additional hook properties needed for dialogs
    entryFormData,
    updateEntryFormData,
    bulkEntries,
    bulkAddType,
    validBulkEntriesCount,
    updateBulkEntry,
    addBulkEntryRow,
    removeBulkEntryRow,
    handleBulkCreate,
    filteredInvoicesForDropdown,
    formSelectedLinkedIncome,
    formCogsSummary,
    invoiceSearchTerm,
    handleInvoiceSearchChange,
    handleInvoiceSearchFocus,
    handleCustomReferenceSelection,
    handleInvoiceSelectionWithHide,
    handleClearSelectedInvoice,

    // Utility functions
    formatCurrency,
    getCOGSCurrency
  } = useBookkeepingEntriesManagement(globalSelectedCompany || 'all', companies);

  const showLoader = useDelayedLoading(!isLoaded);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <Receipt className="h-8 w-8 text-green-600" />
          <h1 className="text-3xl font-bold tracking-tight">Revenue & Expense Entries</h1>
        </div>
        <p className="text-muted-foreground">
          Manage revenue and expense entries with category-based tracking and linking capabilities.
        </p>
      </div>

      {/* Financial Summary */}
      {financialSummary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-600">Total Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(financialSummary.revenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-600">Total Expenses</div>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(financialSummary.actualExpenses)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-600">Net Profit</div>
              <div className={`text-2xl font-bold ${financialSummary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(financialSummary.netProfit)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-sm font-medium text-gray-600">Accounts Payable</div>
              <div className="text-2xl font-bold text-blue-600">
                {formatCurrency(financialSummary.accountsPayable)}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <EntriesFilterBar
        viewFilter={filters.viewFilter}
        groupedView={groupedView}
        selectedPeriod={filters.period}
        customDateRange={filters.customDateRange}
        searchTerm={filters.searchTerm}
        setViewFilter={(filter) => handleFilterChange({ viewFilter: filter })}
        setGroupedView={toggleGroupedView}
        setSelectedPeriod={(period) => handleFilterChange({ selectedPeriod: period })}
        setCustomDateRange={(range) => handleFilterChange({ customDateRange: range })}
        setSearchTerm={(term) => handleFilterChange({ searchTerm: term })}
      />

      {/* Action Buttons */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button 
            onClick={handleShowAddDialog}
            className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Entry
          </Button>
          <Button 
            onClick={() => setShowBulkAddDialog(true)}
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            Bulk Add
          </Button>
        </div>

        {/* View Controls and Selection Actions */}
        {filteredEntries.length > 0 && (
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            {/* View Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleGroupedView}
              className="flex items-center space-x-2"
            >
              {groupedView ? (
                <ToggleRight className="h-4 w-4 text-green-600" />
              ) : (
                <ToggleLeft className="h-4 w-4" />
              )}
              <span className="text-sm">
                {groupedView ? 'Grouped' : 'List'} View
              </span>
            </Button>

            {/* Select/Deselect All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="flex items-center space-x-2"
            >
              {selectedEntries.size === filteredEntries.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="text-sm">
                {selectedEntries.size === filteredEntries.length ? 'Deselect All' : 'Select All'}
              </span>
            </Button>

            {/* Delete Selected */}
            {selectedEntries.size > 0 && (
              <>
                <span className="text-sm text-gray-600">
                  {selectedEntries.size} selected
                </span>
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete Selected
                </Button>
              </>
            )}
            
            {/* Expand All Button */}
            <Button 
              variant="outline"
              size="sm"
              onClick={toggleAllEntriesExpansion}
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
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Bookkeeping Entries</CardTitle>
          <CardDescription>
            Revenue and expense entries with category tracking and COGS management
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EntriesListView
            filteredEntries={filteredEntries}
            processedGroupedEntries={processedGroupedEntries}
            groupedView={groupedView}
            expandedGroups={expandedGroups}
            expandedEntries={expandedEntries}
            selectedEntries={selectedEntries}
            highlightedEntryId={highlightedEntryId}
            toggleGroupExpansion={toggleGroupExpansion}
            toggleEntryExpansion={toggleEntryExpansion}
            toggleEntrySelection={toggleEntrySelection}
            handleEditEntry={handleEditEntry}
            handleDeleteEntry={handleDeleteEntry}
            handleLinkToIncome={handleLinkToIncome}
            handleViewRelatedIncomeEntry={handleViewRelatedIncomeEntry}
            formatCurrency={formatCurrency}
            getCOGSCurrency={getCOGSCurrency}
          />
        </CardContent>
      </Card>

      {/* Entry Dialog - Using the complex AddEditEntryDialog */}
      <AddEditEntryDialog
        dialogProps={{
          open: showEntryDialog,
          onOpenChange: setShowEntryDialog
        }}
        formProps={{
          entryFormData,
          editingEntry,
          updateEntryFormData
        }}
        dataProps={{
          companies: activeCompanies,
          invoices,
          filteredInvoicesForDropdown,
          formSelectedLinkedIncome,
          formCogsSummary
        }}
        invoiceSearchProps={{
          invoiceSearchTerm,
          handleInvoiceSearchChange,
          handleInvoiceSearchFocus,
          handleCustomReferenceSelection,
          handleInvoiceSelectionWithHide,
          handleClearSelectedInvoice
        }}
        actionProps={{
          handleCancelEdit,
          handleCreateEntry,
          handleUpdateEntry
        }}
        utilityProps={{
          formatLargeCurrency: formatCurrency,
          getCOGSCurrency
        }}
      />

      {/* Bulk Entry Dialog */}
      <BulkAddDialog
        open={showBulkAddDialog}
        onClose={() => setShowBulkAddDialog(false)}
        bulkAddType={bulkAddType}
        bulkEntries={bulkEntries}
        validBulkEntriesCount={validBulkEntriesCount}
        updateBulkEntry={updateBulkEntry}
        addBulkEntryRow={addBulkEntryRow}
        removeBulkEntryRow={removeBulkEntryRow}
        handleCancelBulkAdd={() => setShowBulkAddDialog(false)}
        handleBulkCreate={handleBulkCreate}
      />

      {/* Delete Confirmation Dialog - Bulk */}
      <ConfirmationDialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
        title="Delete Entries"
        description={`Are you sure you want to permanently delete ${selectedEntries.size} selected entries? This action cannot be undone.`}
        confirmText={`Delete ${selectedEntries.size} Entries`}
        onConfirm={confirmBulkDelete}
      >
        <div className="space-y-2">
          <div className="text-sm font-medium">Entries to be deleted:</div>
          <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 p-3 rounded">
            {entriesToDeleteDetails.map(entry => (
              <div key={entry.id} className="text-sm flex items-center justify-between">
                <span className="truncate">
                  {entry.display}
                </span>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {entry.type === 'income' ? 'revenue' : entry.type}
                  </span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(entry.amount, entry.currency)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ConfirmationDialog>

      {/* Delete Confirmation Dialog - Single */}
      <ConfirmationDialog
        open={showDeleteSingleDialog}
        onOpenChange={setShowDeleteSingleDialog}
        title="Delete Entry"
        description="Are you sure you want to permanently delete this entry? This action cannot be undone."
        confirmText="Delete Entry"
        onConfirm={confirmSingleDelete}
      >
        {entryToDelete && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Entry to be deleted:</div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{entryToDelete.description}</span>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    entryToDelete.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {entryToDelete.type === 'income' ? 'revenue' : entryToDelete.type}
                  </span>
                </div>
                <div className="text-gray-600">{entryToDelete.category}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDateForDisplay(entryToDelete.date)} • {formatCurrency(entryToDelete.amount, entryToDelete.currency)}
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmationDialog>
      </div>
    </div>
  );
}