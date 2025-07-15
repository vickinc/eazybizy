"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useJournalEntriesManagement } from '@/hooks/useJournalEntriesManagement';
import { JournalEntryDialog } from '@/components/features/JournalEntryDialog';
import { JournalEntriesListView } from '@/components/features/JournalEntriesListView';
import { JournalEntryReversalDialog } from '@/components/features/JournalEntryReversalDialog';
import { JournalEntryFilterBar } from '@/components/features/JournalEntryFilterBar';
import { JournalEntryBulkOperationsBar } from '@/components/features/JournalEntryBulkOperationsBar';
import { UserSelector } from '@/components/features/UserSelector';
import { formatDateForDisplay } from '@/utils';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useDelayedLoading } from '@/hooks/useDelayedLoading';
import Plus from "lucide-react/dist/esm/icons/plus";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import BookOpen from "lucide-react/dist/esm/icons/book-open";

export default function JournalEntriesPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Use the journal entries management hook
  const {
    // Core data
    journalEntries,
    filteredAndSortedEntries,
    chartOfAccounts,
    isLoaded,

    // Filtering and sorting
    filters,
    sortConfig,
    showFilterPanel,

    // UI state
    expandedEntries,
    selectedEntries,
    highlightedEntryId,
    showEntryDialog,
    showDeleteConfirmDialog,
    showDeleteSingleDialog,
    showReversalDialog,
    editingEntry,
    entryToDelete,
    entryToReverse,
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
    handleReverseEntry,
    confirmReversal,
    handleCancelReversal,
    handleViewReversalEntry,
    toggleEntryExpansion,
    toggleEntrySelection,
    toggleSelectAll,
    toggleAllEntriesExpansion,
    handleShowAddDialog,
    handleCancelEdit,
    setShowEntryDialog,
    setShowDeleteConfirmDialog,
    setShowDeleteSingleDialog,
    setShowReversalDialog,

    // Filter and sort functions
    updateFilters,
    updateSortConfig,
    resetFilters,
    toggleSort,
    applyQuickFilter,
    setShowFilterPanel,

    // Bulk operations
    handleBulkStatusChange,
    handleBulkDuplicate,
    handleBulkReverse,
    clearSelection,

    // Single entry operations
    handleDuplicateEntry,

    // Utility functions
    formatCurrency
  } = useJournalEntriesManagement(globalSelectedCompany || 'all', companies);

  const showLoader = useDelayedLoading(!isLoaded);

  if (showLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-bold tracking-tight">General Journal</h1>
          </div>
          <p className="text-muted-foreground">
            Manage journal entries with proper double-entry bookkeeping. All entries must have balanced debits and credits.
          </p>
        </div>
        
        {/* User Information */}
        <div className="w-80">
          <UserSelector />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <Button 
            onClick={handleShowAddDialog}
            className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Journal Entry
          </Button>
        </div>

        {/* Selection Actions and Controls */}
        {journalEntries.length > 0 && (
          <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
            {/* Select/Deselect All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="flex items-center space-x-2"
            >
              {selectedEntries.size === filteredAndSortedEntries.length ? (
                <CheckSquare className="h-4 w-4" />
              ) : (
                <Square className="h-4 w-4" />
              )}
              <span className="text-sm">
                {selectedEntries.size === filteredAndSortedEntries.length ? 'Deselect All' : 'Select All'}
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

      {/* Filter Bar */}
      <JournalEntryFilterBar
        filters={filters}
        sortConfig={sortConfig}
        showFilterPanel={showFilterPanel}
        onUpdateFilters={updateFilters}
        onUpdateSortConfig={updateSortConfig}
        onResetFilters={resetFilters}
        onToggleSort={toggleSort}
        onApplyQuickFilter={applyQuickFilter}
        onToggleFilterPanel={setShowFilterPanel}
        chartOfAccounts={chartOfAccounts}
        totalEntries={journalEntries.length}
        filteredCount={filteredAndSortedEntries.length}
      />

      {/* Bulk Operations Bar */}
      <JournalEntryBulkOperationsBar
        selectedEntries={selectedEntries}
        entries={filteredAndSortedEntries}
        onBulkDelete={handleBulkDelete}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkDuplicate={handleBulkDuplicate}
        onBulkReverse={handleBulkReverse}
        onClearSelection={clearSelection}
      />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Journal Entries</CardTitle>
          <CardDescription>
            Double-entry bookkeeping journal with balanced debits and credits
          </CardDescription>
        </CardHeader>
        <CardContent>
          <JournalEntriesListView
            entries={filteredAndSortedEntries}
            expandedEntries={expandedEntries}
            selectedEntries={selectedEntries}
            highlightedEntryId={highlightedEntryId}
            toggleEntryExpansion={toggleEntryExpansion}
            toggleEntrySelection={toggleEntrySelection}
            handleEditEntry={handleEditEntry}
            handleDeleteEntry={handleDeleteEntry}
            handleReverseEntry={handleReverseEntry}
            handleViewReversalEntry={handleViewReversalEntry}
            handleDuplicateEntry={handleDuplicateEntry}
            formatCurrency={formatCurrency}
          />
        </CardContent>
      </Card>

      {/* Journal Entry Dialog */}
      <JournalEntryDialog
        open={showEntryDialog}
        onOpenChange={setShowEntryDialog}
        entry={editingEntry}
        companies={companies}
        chartOfAccounts={chartOfAccounts}
        formatCurrency={formatCurrency}
        onSave={editingEntry ? handleUpdateEntry : handleCreateEntry}
        onCancel={handleCancelEdit}
      />

      {/* Delete Confirmation Dialog - Bulk */}
      <ConfirmationDialog
        open={showDeleteConfirmDialog}
        onOpenChange={setShowDeleteConfirmDialog}
        title="Delete Journal Entries"
        description={`Are you sure you want to permanently delete ${selectedEntries.size} selected journal entries? This action cannot be undone.`}
        confirmText={`Delete ${selectedEntries.size} Entries`}
        onConfirm={confirmBulkDelete}
      >
        <div className="space-y-2">
          <div className="text-sm font-medium">Journal entries to be deleted:</div>
          <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 p-3 rounded">
            {entriesToDeleteDetails.map(entry => (
              <div key={entry.id} className="text-sm flex items-center justify-between">
                <span className="truncate">
                  {entry.display}
                </span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(entry.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </ConfirmationDialog>

      {/* Delete Confirmation Dialog - Single */}
      <ConfirmationDialog
        open={showDeleteSingleDialog}
        onOpenChange={setShowDeleteSingleDialog}
        title="Delete Journal Entry"
        description="Are you sure you want to permanently delete this journal entry? This action cannot be undone."
        confirmText="Delete Entry"
        onConfirm={confirmSingleDelete}
      >
        {entryToDelete && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Journal entry to be deleted:</div>
            <div className="bg-gray-50 p-3 rounded">
              <div className="text-sm">
                <div className="font-medium">{entryToDelete.entryNumber}</div>
                <div className="text-gray-600">{entryToDelete.description}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {formatDateForDisplay(entryToDelete.date)} • Total: {formatCurrency(entryToDelete.totalDebits)}
                </div>
              </div>
            </div>
          </div>
        )}
      </ConfirmationDialog>

      {/* Reversal Dialog */}
      <JournalEntryReversalDialog
        open={showReversalDialog}
        onOpenChange={setShowReversalDialog}
        entry={entryToReverse}
        formatCurrency={formatCurrency}
        onConfirm={confirmReversal}
        onCancel={handleCancelReversal}
      />
      </div>
    </div>
  );
}