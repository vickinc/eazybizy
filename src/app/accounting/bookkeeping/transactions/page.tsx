"use client";

import React from "react";
import { ArrowRightLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useTransactionsManagement } from '@/hooks/useTransactionsManagement';
import { TransactionsFilterBar } from '@/components/features/TransactionsFilterBar';
import { TransactionsListView } from '@/components/features/TransactionsListView';
import { BulkAddTransactionDialog } from '@/components/features/BulkAddTransactionDialog';
import { LinkEntryDialog } from '@/components/features/LinkEntryDialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import { LoadingScreen } from "@/components/ui/LoadingScreen";

export default function TransactionsPage() {
  const { selectedCompany: globalSelectedCompany, companies: allCompanies } = useCompanyFilter();
  
  // Use the complete original localStorage-based hook with ALL functionality
  const {
    // Core Data
    transactions,
    bankAccounts,
    digitalWallets,
    entries,
    
    // Computed Data
    filteredTransactions,
    groupedTransactions,
    linkableEntries,
    linkableEntriesByType,
    pageTitle,
    pageDescription,
    transactionsSummary,
    
    // UI State
    isLoaded,
    selectedPeriod,
    filterBy,
    viewFilter,
    searchTerm,
    customDateRange,
    groupBy,
    groupedView,
    
    // Expansion & Selection State
    expandedGroups,
    expandedTransactions,
    selectedTransactions,
    isAllExpanded,
    
    // Dialog State
    showBulkAddDialog,
    showLinkEntryDialog,
    showDeleteConfirmDialog,
    linkingTransactionId,
    
    // Bulk Add State
    bulkTransactions,
    bulkSelectedAccountId,
    bulkAddType,
    
    // Actions - Filters
    setSelectedPeriod,
    setFilterBy,
    setViewFilter,
    setSearchTerm,
    setCustomDateRange,
    setGroupBy,
    setGroupedView,
    
    // Actions - UI State
    toggleGroupExpansion,
    toggleTransactionExpansion,
    toggleTransactionSelection,
    toggleAllExpansion,
    toggleSelectAll,
    
    // Actions - Dialogs
    setShowBulkAddDialog,
    setShowLinkEntryDialog,
    setShowDeleteConfirmDialog,
    setLinkingTransactionId,
    setBulkAddType,
    
    // Actions - Bulk Operations
    setBulkTransactions,
    setBulkSelectedAccountId,
    addBulkTransactionRow,
    removeBulkTransactionRow,
    updateBulkTransaction,
    handleBulkCreate,
    
    // Actions - CRUD Operations
    handleDeleteTransaction,
    handleBulkDelete,
    confirmBulkDelete,
    handleLinkTransaction,
    handleUnlinkTransaction,
    handleLinkEntry,
    
    // Utility Functions
    formatCurrency,
    getAccountById,
    getEntryById,
    getCompanyById,
  } = useTransactionsManagement(globalSelectedCompany, allCompanies);

  // Loading state
  if (!isLoaded) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <ArrowRightLeft className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
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

        {/* Advanced Filter Bar */}
        <TransactionsFilterBar
          selectedPeriod={selectedPeriod}
          setSelectedPeriod={setSelectedPeriod}
          filterBy={filterBy}
          setFilterBy={setFilterBy}
          viewFilter={viewFilter}
          setViewFilter={setViewFilter}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          groupedView={groupedView}
          setGroupedView={setGroupedView}
        />

        {/* Transaction Action Buttons */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              onClick={() => {
                setBulkAddType('incoming');
                setShowBulkAddDialog(true);
              }}
              className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
              Add Incoming
            </Button>
            <Button 
              onClick={() => {
                setBulkAddType('outgoing');
                setShowBulkAddDialog(true);
              }}
              className="bg-black hover:bg-gray-800 py-3 px-4 sm:py-4 sm:px-8 text-base sm:text-lg font-bold text-white"
            >
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 font-bold" />
              Add Outgoing
            </Button>
          </div>
          {selectedTransactions && selectedTransactions.size > 0 && (
            <Button 
              variant="destructive"
              onClick={() => setShowDeleteConfirmDialog(true)}
            >
              Delete Selected ({selectedTransactions.size})
            </Button>
          )}
        </div>

        {/* Transactions List View */}
        {filteredTransactions && filteredTransactions.length > 0 ? (
          <TransactionsListView
            groupedView={groupedView}
            groupedTransactions={groupedTransactions}
            expandedGroups={expandedGroups}
            expandedTransactions={expandedTransactions}
            selectedTransactions={selectedTransactions}
            toggleGroupExpansion={toggleGroupExpansion}
            toggleTransactionExpansion={toggleTransactionExpansion}
            toggleTransactionSelection={toggleTransactionSelection}
            formatCurrency={formatCurrency}
            onLinkTransaction={(transactionId) => {
              setLinkingTransactionId(transactionId);
              setShowLinkEntryDialog(true);
            }}
            onUnlinkTransaction={handleUnlinkTransaction}
          />
        ) : (
          /* Simple Transaction List Fallback */
          <Card>
            <CardHeader>
              <CardTitle>Transactions ({filteredTransactions?.length || 0})</CardTitle>
              <CardDescription>
                View and manage your financial transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredTransactions?.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">No transactions found</p>
                  <p>Start by adding your first transaction</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredTransactions?.map((transaction) => {
                    const account = getAccountById(transaction.accountId, transaction.accountType);
                    const isIncoming = transaction.type === 'incoming';
                    
                    return (
                      <div key={transaction.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${isIncoming ? 'bg-green-500' : 'bg-red-500'}`} />
                              <div>
                                <p className="font-medium text-gray-900">
                                  {isIncoming ? transaction.paidBy : transaction.paidTo}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {transaction.reference || 'No reference'}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100">
                                {account?.accountName || 'Unknown Account'}
                              </span>
                              <span className="ml-2">
                                {new Date(transaction.date).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <p className={`text-lg font-semibold ${isIncoming ? 'text-green-600' : 'text-red-600'}`}>
                              {isIncoming ? '+' : '-'}{formatCurrency(transaction.amount, transaction.currency)}
                            </p>
                            {transaction.description && (
                              <p className="text-sm text-gray-600 mt-1">
                                {transaction.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Bulk Add Transaction Dialog */}
        <BulkAddTransactionDialog
          open={showBulkAddDialog}
          onClose={() => setShowBulkAddDialog(false)}
          bulkAddType={bulkAddType}
          bulkTransactions={bulkTransactions}
          bulkSelectedAccountId={bulkSelectedAccountId}
          bankAccounts={bankAccounts}
          digitalWallets={digitalWallets}
          linkableEntries={linkableEntries}
          companies={allCompanies}
          selectedCompany={globalSelectedCompany}
          formatCurrency={formatCurrency}
          setBulkSelectedAccountId={setBulkSelectedAccountId}
          addBulkTransactionRow={addBulkTransactionRow}
          removeBulkTransactionRow={removeBulkTransactionRow}
          updateBulkTransaction={updateBulkTransaction}
          handleBulkCreate={handleBulkCreate}
        />

        {/* Link Entry Dialog */}
        <LinkEntryDialog
          open={showLinkEntryDialog}
          onClose={() => setShowLinkEntryDialog(false)}
          linkableEntriesByType={linkableEntriesByType}
          formatCurrency={formatCurrency}
          onLinkEntry={(entryId) => {
            if (linkingTransactionId) {
              handleLinkEntry(linkingTransactionId, entryId);
              setShowLinkEntryDialog(false);
              setLinkingTransactionId('');
            }
          }}
        />

        {/* Confirmation Dialog */}
        <ConfirmationDialog
          isOpen={showDeleteConfirmDialog}
          title="Delete Transactions"
          message={selectedTransactions.size > 1 
            ? `Are you sure you want to delete ${selectedTransactions.size} selected transactions?`
            : "Are you sure you want to delete this transaction?"}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={() => {
            if (selectedTransactions.size > 0) {
              confirmBulkDelete();
            }
            setShowDeleteConfirmDialog(false);
          }}
          onCancel={() => setShowDeleteConfirmDialog(false)}
        />
      </div>
    </div>
  );
}