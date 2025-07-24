"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getLocalDateString, formatDateForDisplay } from '@/utils';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useBookkeepingEntriesManagement } from '@/hooks/useBookkeepingEntriesManagement';
import { IncomeEntryCard } from '@/components/features/IncomeEntryCard';
import Plus from "lucide-react/dist/esm/icons/plus";
import ArrowUpCircle from "lucide-react/dist/esm/icons/arrow-up-circle";
import ArrowDownCircle from "lucide-react/dist/esm/icons/arrow-down-circle";
import Edit from "lucide-react/dist/esm/icons/edit";
import ChevronDown from "lucide-react/dist/esm/icons/chevron-down";
import ChevronUp from "lucide-react/dist/esm/icons/chevron-up";
import Maximize2 from "lucide-react/dist/esm/icons/maximize-2";
import Minimize2 from "lucide-react/dist/esm/icons/minimize-2";
import Search from "lucide-react/dist/esm/icons/search";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Calculator from "lucide-react/dist/esm/icons/calculator";
import Receipt from "lucide-react/dist/esm/icons/receipt";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Filter from "lucide-react/dist/esm/icons/filter";
import FolderOpen from "lucide-react/dist/esm/icons/folder-open";
import Folder from "lucide-react/dist/esm/icons/folder";
import DollarSign from "lucide-react/dist/esm/icons/dollar-sign";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Copy from "lucide-react/dist/esm/icons/copy";
import CheckSquare from "lucide-react/dist/esm/icons/check-square";
import Square from "lucide-react/dist/esm/icons/square";
import AlertTriangle from "lucide-react/dist/esm/icons/alert-triangle";
import Link from "lucide-react/dist/esm/icons/link";

// Categories (copy from bookkeeping/page.tsx)
const INCOME_CATEGORIES = [
  'Sales Revenue',
  'Service Revenue', 
  'Product Sales',
  'Consulting',
  'Licensing',
  'Interest Income',
  'Investment Returns',
  'Other Income'
];

const EXPENSE_CATEGORIES = [
  'COGS',
  'Cost of Service',
  'Payroll and benefits',
  'Rent and utilities',
  'Supplies and equipment',
  'Marketing and advertising',
  'Insurance',
  'Taxes',
  'Travel and entertainment',
  'Professional services',
  'Inventory costs',
  'Debt payments',
  'Subscriptions and software',
  'Maintenance and repairs',
  'Other'
];

export default function EntriesPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Use the comprehensive hook for all state and business logic
  const {
    // Core Data
    entries,
    invoices,
    products,
    
    // Core Data (processed and ready for UI)
    filteredEntries,
    groupedEntries,
    processedGroupedEntries,
    linkedExpensesMap,
    remainingAmountsMap,
    filteredInvoicesForDropdown,
    activeCompanies,
    entriesToDeleteDetails,
    availableIncomeEntriesForLinking,
    
    // UI State
    isLoaded,
    selectedPeriod,
    customDateRange,
    viewFilter,
    groupedView,
    expandedGroups,
    expandedEntries,
    isAllExpanded,
    selectedEntries,
    searchTerm,
    highlightedEntryId,
    
    // Dialog States
    showEntryDialog,
    showBulkAddDialog,
    showDeleteConfirmDialog,
    showDeleteSingleDialog,
    showInvoiceSelect,
    showLinkDialog,
    
    // Form States
    entryFormData,
    bulkEntries,
    bulkAddType,
    editingEntry,
    entryToDelete,
    expenseToLink,
    selectedIncomeForLink,
    invoiceSearchTerm,
    
    // Computed Properties
    totalIncome,
    totalExpenses,
    netProfit,
    pageTitle,
    pageDescription,
    validBulkEntriesCount,
    formCogsSummary,
    linkedIncomeMap,
    formSelectedLinkedIncome,
    
    // Actions
    handleCreateEntry,
    handleUpdateEntry,
    handleEditEntry,
    handleDeleteEntry,
    confirmDeleteEntry,
    handleBulkCreate,
    handleBulkDelete,
    
    // Form Actions
    updateEntryFormData,
    resetEntryForm,
    updateBulkEntries,
    addBulkEntry,
    removeBulkEntry,
    setBulkAddType,
    updateBulkEntry,
    addBulkEntryRow,
    removeBulkEntryRow,
    resetBulkForm,
    
    // Dialog Actions
    setShowEntryDialog,
    setShowBulkAddDialog,
    setShowDeleteConfirmDialog,
    setShowDeleteSingleDialog,
    setShowInvoiceSelect,
    setShowLinkDialog,
    handleShowAddIncomeDialog,
    handleShowAddExpenseDialog,
    handleViewRelatedIncomeEntry,
    handleCancelEdit,
    handleCancelBulkAdd,
    
    // Filter Actions
    setSelectedPeriod,
    setCustomDateRange,
    setViewFilter,
    setGroupedView,
    setSearchTerm,
    
    // UI Actions
    toggleEntryExpansion,
    toggleAllEntriesExpansion,
    toggleGroupExpansion,
    toggleEntrySelection,
    selectAllEntries,
    clearEntrySelection,
    toggleSelectAll,
    setExpandedEntries,
    setEditingEntry,
    confirmBulkDelete,
    
    // Invoice Actions
    handleInvoiceSelection,
    setInvoiceSearchTerm,
    handleInvoiceSearchChange,
    handleInvoiceSearchFocus,
    handleCustomReferenceSelection,
    handleInvoiceSelectionWithHide,
    handleClearSelectedInvoice,
    
    // Link Actions
    handleLinkToIncome,
    handleConfirmLink,
    handleCancelLink,
    setSelectedIncomeForLink,
    
    // Utility Functions
    formatCurrency,
    getCOGSCurrency
  } = useBookkeepingEntriesManagement(globalSelectedCompany, companies);

  // Declarative scroll effect for highlighted entries
  React.useEffect(() => {
    if (highlightedEntryId) {
      const element = document.getElementById(`entry-${highlightedEntryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightedEntryId]);

  // Helper functions for rendering (kept local as they're UI-specific)
  const formatLargeCurrency = (amount: number, currency: string = 'USD'): string => {
    return formatCurrency(amount, currency);
  };


  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-8">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Receipt className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {pageTitle}
            </h1>
            <p className="text-gray-600">
              {pageDescription}
            </p>
          </div>
        </div>
      </div>


      {/* Filters and Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* View Type Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Show:</span>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={viewFilter === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('all')}
                    className="rounded-none border-0"
                  >
                    All Entries
                  </Button>
                  <Button
                    variant={viewFilter === 'revenue' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('revenue')}
                    className="rounded-none border-0 text-green-600"
                  >
                    <ArrowUpCircle className="h-4 w-4 mr-1" />
                    Income Only
                  </Button>
                  <Button
                    variant={viewFilter === 'expense' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewFilter('expense')}
                    className="rounded-none border-0 text-red-600"
                  >
                    <ArrowDownCircle className="h-4 w-4 mr-1" />
                    Expenses Only
                  </Button>
                </div>
              </div>

              {/* View Style Toggle */}
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">View:</span>
                <div className="flex border rounded-lg overflow-hidden">
                  <Button
                    variant={!groupedView ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGroupedView(false)}
                    className="rounded-none border-0"
                  >
                    List View
                  </Button>
                  <Button
                    variant={groupedView ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setGroupedView(true)}
                    className="rounded-none border-0"
                  >
                    <FolderOpen className="h-4 w-4 mr-1" />
                    Grouped
                  </Button>
                </div>
              </div>
            </div>

            {/* Period and Date Range Selection */}
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium">Period:</span>
                <Select value={selectedPeriod} onValueChange={(value: unknown) => setSelectedPeriod(value)}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="thisMonth">This Month</SelectItem>
                    <SelectItem value="lastMonth">Last Month</SelectItem>
                    <SelectItem value="thisYear">This Year</SelectItem>
                    <SelectItem value="lastYear">Last Year</SelectItem>
                    <SelectItem value="allTime">All Time</SelectItem>
                    <SelectItem value="custom">Custom Range</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Date Range */}
              {selectedPeriod === 'custom' && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm">From:</span>
                  <Input
                    type="date"
                    value={customDateRange.start}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                    className="w-36"
                  />
                  <span className="text-sm">To:</span>
                  <Input
                    type="date"
                    value={customDateRange.end}
                    onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                    className="w-36"
                  />
                </div>
              )}
            </div>

            {/* Search Filter */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search by description, category, or amount..."
                    value={searchTerm || ''}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
            <Button 
              variant="outline"
              className="text-green-600 border-green-200 hover:bg-green-50 w-full sm:w-48"
              onClick={handleShowAddIncomeDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Income
            </Button>
            <Button 
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-48"
              onClick={handleShowAddExpenseDialog}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Expenses
            </Button>
          </div>
        </div>

        {/* Selection Actions and Controls */}
        {filteredEntries.length > 0 && (
          <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            {/* Left side - Select/Deselect All */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleSelectAll}
              className="flex items-center space-x-2 justify-center sm:justify-start"
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

            {/* Right side - Delete Selected and Expand All */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              {/* Delete Selected - only show when entries are selected */}
              {selectedEntries.size > 0 && (
                <>
                  <span className="text-sm text-gray-600 text-center sm:text-left">
                    {selectedEntries.size} selected
                  </span>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="text-red-600 border-red-200 hover:bg-red-50 w-full sm:w-auto"
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
                className="w-full sm:w-auto"
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
        )}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <CardTitle>Income & Expense Entries</CardTitle>
          <CardDescription>View and manage your financial transactions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredEntries.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No entries found for the selected period and filters.
              </div>
            ) : groupedView ? (
              // Grouped View
              processedGroupedEntries.map((group) => (
                <div key={group.key} className="border rounded-lg">
                  {/* Group Header */}
                  <div 
                    className="p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGroupExpansion(group.key)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="p-1 h-6 w-6 pointer-events-none"
                        >
                          {expandedGroups.has(group.key) ? 
                            <FolderOpen className="h-4 w-4" /> : 
                            <Folder className="h-4 w-4" />
                          }
                        </Button>
                        <h3 className="font-semibold text-lg">{group.name}</h3>
                        <Badge variant="outline" className="text-xs">
                          {group.entries.length} {group.entries.length === 1 ? 'entry' : 'entries'}
                        </Badge>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-sm text-gray-600">
                          Income: {formatLargeCurrency(group.totalIncome)}
                        </div>
                        <div className="text-sm text-gray-600">
                          Expenses: {formatLargeCurrency(group.totalExpenses)}
                        </div>
                        <ChevronDown className={`h-4 w-4 transition-transform ${
                          expandedGroups.has(group.key) ? 'rotate-180' : ''
                        }`} />
                      </div>
                    </div>
                  </div>
                  
                  {/* Group Content */}
                  {expandedGroups.has(group.key) && (
                    <div className="border-t space-y-2 p-2">
                      {group.entries.map((entry) => {
                        const isExpanded = expandedEntries.has(entry.id);
                        
                        // Use pre-calculated values from enhanced entry
                        const linkedExpenses = entry.totalLinkedExpenses;
                        const remainingAmount = entry.remainingAmount;
                        
                        // Use enhanced rendering for income entries in grouped view
                        if (entry.type === 'revenue') {
                          return (
                            <div key={entry.id} id={`entry-${entry.id}`}>
                              <IncomeEntryCard
                                entry={entry}
                                company={entry.company}
                                isExpanded={isExpanded}
                                linkedExpenses={linkedExpenses}
                                remainingAmount={remainingAmount}
                                highlightedEntryId={highlightedEntryId}
                                selectedEntries={selectedEntries}
                                formatCurrency={formatCurrency}
                                getCOGSCurrency={getCOGSCurrency}
                                toggleEntryExpansion={toggleEntryExpansion}
                                toggleEntrySelection={toggleEntrySelection}
                                handleEditEntry={handleEditEntry}
                                handleDeleteEntry={handleDeleteEntry}
                              />
                            </div>
                          );
                        }
                        
                        // Standard rendering for expense entries in grouped view
                        return (
                          <div key={entry.id} className="border rounded-lg hover:bg-gray-50 transition-all duration-200" id={`entry-${entry.id}`}>
                            {/* Compact entry view for grouped display */}
                            <div 
                              className="p-3 cursor-pointer"
                              onClick={() => toggleEntryExpansion(entry.id)}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  {/* Selection Checkbox */}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleEntrySelection(entry.id);
                                    }}
                                    className="p-1 h-6 w-6"
                                  >
                                    {selectedEntries.has(entry.id) ? (
                                      <CheckSquare className="h-4 w-4 text-blue-600" />
                                    ) : (
                                      <Square className="h-4 w-4 text-gray-400" />
                                    )}
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="p-1 h-6 w-6 pointer-events-none"
                                  >
                                    {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                                  </Button>
                                  <div className="p-1.5 rounded-full bg-red-100">
                                    <ArrowDownCircle className="h-3 w-3 text-red-600" />
                                  </div>
                                  {entry.linkedIncomeId && (
                                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                      Linked
                                    </Badge>
                                  )}
                                  {entry.company && (
                                    <Badge variant="outline" className="flex items-center gap-1 text-xs">
                                      <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                                        entry.company.logo.startsWith('data:') || entry.company.logo.includes('http') 
                                          ? '' 
                                          : 'bg-gradient-to-br from-blue-500 to-purple-600'
                                      }`}>
                                        {entry.company.logo.startsWith('data:') || entry.company.logo.includes('http') ? (
                                          <img 
                                            src={entry.company.logo} 
                                            alt={`${entry.company.tradingName} logo`} 
                                            className="w-full h-full object-cover rounded"
                                          />
                                        ) : (
                                          entry.company.logo
                                        )}
                                      </div>
                                      {entry.company.tradingName}
                                    </Badge>
                                  )}
                                  <div className="flex-1">
                                    <div className="font-medium text-sm truncate">
                                      {entry.type === 'expense' && entry.vendorInvoice ? entry.vendorInvoice : entry.description}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {entry.category} • {formatDateForDisplay(entry.date)}
                                      {entry.type === 'expense' && entry.vendorInvoice && (
                                        <> • {entry.description}</>
                                      )}
                                      {entry.type === 'revenue' && (
                                        <> • {entry.description}</>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4" onClick={(e) => e.stopPropagation()}>
                                  <div className="text-right">
                                    {entry.type === 'revenue' && linkedExpenses > 0 && entry.cogs ? (
                                      // Enhanced display for income with linked expenses and COGS
                                      <div className="space-y-1">
                                        <div className="text-xs text-gray-600">
                                          <span className="font-medium text-green-600">Income:</span> {formatLargeCurrency(entry.amount, entry.currency)}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          <span className="font-medium text-purple-600">COGS:</span> {formatLargeCurrency(entry.cogs, getCOGSCurrency(entry))}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          <span className="font-medium text-red-600">Expenses Paid:</span> {formatLargeCurrency(linkedExpenses, getCOGSCurrency(entry))}
                                        </div>
                                        <div className="text-xs font-medium text-black">
                                          A/P: {formatLargeCurrency(remainingAmount, getCOGSCurrency(entry))} remained to pay
                                        </div>
                                      </div>
                                    ) : entry.type === 'revenue' && linkedExpenses > 0 ? (
                                      // Display for income with linked expenses but no COGS
                                      <div className="space-y-1">
                                        <div className="text-xs text-gray-600">
                                          <span className="font-medium text-green-600">Income:</span> {formatLargeCurrency(entry.amount, entry.currency)}
                                        </div>
                                        <div className="text-xs text-gray-600">
                                          <span className="font-medium text-red-600">Expenses:</span> {formatLargeCurrency(linkedExpenses, entry.currency)}
                                        </div>
                                        <div className="text-xs font-medium text-blue-600">
                                          Net: {formatLargeCurrency(entry.amount - linkedExpenses, entry.currency)}
                                        </div>
                                      </div>
                                    ) : (
                                      // Standard display
                                      <div className={`font-bold text-sm ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                                        {entry.type === 'revenue' ? '+' : '-'}{formatLargeCurrency(entry.amount, entry.currency)}
                                      </div>
                                    )}
                                    {entry.type === 'revenue' && entry.cogs && remainingAmount > 0 && linkedExpenses === 0 && (
                                      <div className="text-xs font-medium text-black">
                                        COGS A/P: {formatLargeCurrency(remainingAmount, getCOGSCurrency(entry))}
                                      </div>
                                    )}
                                  </div>
                                  
                                  
                                  {/* Link to Income button for expense entries */}
                                  {entry.type === 'expense' && !entry.linkedIncomeId && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleLinkToIncome(entry)}
                                      className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                                      title="Link to income entry"
                                    >
                                      <Link className="h-3 w-3 mr-1" />
                                      Link to Income
                                    </Button>
                                  )}
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEditEntry(entry)}
                                    className="h-7 w-7 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                                    title="Edit entry"
                                  >
                                    <Edit className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                            {/* Note: Would need to include expanded content here if implementing full details */}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Regular List View
              filteredEntries.map((entry) => {
                const isExpanded = expandedEntries.has(entry.id);
                
                // Use pre-calculated values from enhanced entry
                const linkedExpenses = entry.totalLinkedExpenses;
                const remainingAmount = entry.remainingAmount;
                
                // Use enhanced rendering for income entries
                if (entry.type === 'revenue') {
                  return (
                    <div key={entry.id} id={`entry-${entry.id}`} className={highlightedEntryId === entry.id ? 'bg-blue-100 transition-all duration-500' : ''}>
                      <IncomeEntryCard
                        entry={entry}
                        company={entry.company}
                        isExpanded={isExpanded}
                        linkedExpenses={linkedExpenses}
                        remainingAmount={remainingAmount}
                        highlightedEntryId={highlightedEntryId}
                        selectedEntries={selectedEntries}
                        formatCurrency={formatCurrency}
                        getCOGSCurrency={getCOGSCurrency}
                        toggleEntryExpansion={toggleEntryExpansion}
                        toggleEntrySelection={toggleEntrySelection}
                        handleEditEntry={handleEditEntry}
                        handleDeleteEntry={handleDeleteEntry}
                      />
                    </div>
                  );
                }
                
                // Standard rendering for expense entries
                return (
                  <div key={entry.id} className={`border-l-4 border-l-red-500 border-r border-t border-b border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200 ${highlightedEntryId === entry.id ? 'bg-blue-100' : ''}`} id={`entry-${entry.id}`}>
                    {/* Compact Header - Always Visible */}
                    <div 
                      className="p-3 cursor-pointer"
                      onClick={() => toggleEntryExpansion(entry.id)}
                    >
                      {/* Date in top left corner */}
                      <div className="text-xs text-gray-500 mb-2">
                        {formatDateForDisplay(entry.date)}
                      </div>
                      
                      <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
                        <div className="flex items-center space-x-2 flex-wrap">
                          {/* Selection Checkbox */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleEntrySelection(entry.id);
                            }}
                            className="p-1 h-6 w-6"
                          >
                            {selectedEntries.has(entry.id) ? (
                              <CheckSquare className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Square className="h-4 w-4 text-gray-400" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 pointer-events-none"
                          >
                            {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                          </Button>
                          {entry.linkedIncomeId && (
                            <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                              Linked
                            </Badge>
                          )}
                          {entry.company && (
                            <Badge variant="outline" className="flex items-center gap-1 text-xs">
                              <div className={`w-3 h-3 rounded flex items-center justify-center text-xs font-bold text-white overflow-hidden ${
                                entry.company.logo.startsWith('data:') || entry.company.logo.includes('http') 
                                  ? '' 
                                  : 'bg-gradient-to-br from-blue-500 to-purple-600'
                              }`}>
                                {entry.company.logo.startsWith('data:') || entry.company.logo.includes('http') ? (
                                  <img 
                                    src={entry.company.logo} 
                                    alt={`${entry.company.tradingName} logo`} 
                                    className="w-full h-full object-cover rounded"
                                  />
                                ) : (
                                  entry.company.logo
                                )}
                              </div>
                              {entry.company.tradingName}
                            </Badge>
                          )}
                          <div className="flex-1">
                            <div className="font-medium text-sm truncate">
                              {entry.vendorInvoice ? entry.vendorInvoice : entry.description}
                              {entry.category && (
                                <span className="text-gray-500"> ({entry.category})</span>
                              )}
                            </div>
                            {entry.vendorInvoice && (
                              <div className="text-xs text-gray-500 truncate">
                                {entry.description}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                          <div className="text-right flex-1">
                            <div className="font-bold text-sm text-red-600">
                              -{formatLargeCurrency(entry.amount, entry.currency)}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {/* Link to Income button - only show for unlinked expenses */}
                            {entry.type === 'expense' && !entry.linkedIncomeId && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleLinkToIncome(entry)}
                                className="h-7 px-2 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 flex-shrink-0"
                                title="Link to income entry"
                              >
                                <Link className="h-3 w-3 mr-1" />
                                <span className="hidden sm:inline">Link to Income</span>
                                <span className="sm:hidden">Link</span>
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditEntry(entry)}
                              className="h-7 w-7 p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 flex-shrink-0"
                              title="Edit entry"
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteEntry(entry)}
                              className="h-7 w-7 p-1 text-red-500 hover:text-red-700 hover:bg-red-100 flex-shrink-0"
                              title="Delete entry"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="border-t bg-gray-50/50 p-4 space-y-4">
                        {/* Full Details */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {entry.type === 'expense' && entry.vendorInvoice && (
                            <div>
                              <Label className="text-xs font-semibold text-gray-600">Vendor Invoice</Label>
                              <p className="text-sm mt-1 font-medium">{entry.vendorInvoice}</p>
                            </div>
                          )}
                          <div>
                            <Label className="text-xs font-semibold text-gray-600">Description</Label>
                            <p className="text-sm mt-1">{entry.description}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-600">Reference</Label>
                            <p className="text-sm mt-1">{entry.reference || 'None'}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-600">Date</Label>
                            <p className="text-sm mt-1">{formatDateForDisplay(entry.date)}</p>
                          </div>
                          <div>
                            <Label className="text-xs font-semibold text-gray-600">Amount</Label>
                            <p className={`text-sm mt-1 font-semibold ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                              {entry.type === 'revenue' ? '+' : '-'}{formatLargeCurrency(entry.amount, entry.currency)}
                            </p>
                          </div>
                        </div>
                        {/* Linked Expenses Information for Income Entries */}
                        {entry.type === 'revenue' && linkedExpenses > 0 && (
                          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                            <Label className="text-xs font-semibold text-blue-700 mb-2 block">Linked Expenses Summary</Label>
                            {entry.cogs ? (
                              // Show COGS-based A/P calculation
                              <div className="grid grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-green-600 font-medium">Income:</span>
                                  <p className="font-semibold">{formatLargeCurrency(entry.amount, entry.currency)}</p>
                                </div>
                                <div>
                                  <span className="text-purple-600 font-medium">COGS:</span>
                                  <p className="font-semibold">{formatLargeCurrency(entry.cogs, getCOGSCurrency(entry))}</p>
                                </div>
                                <div>
                                  <span className="text-red-600 font-medium">Expenses Paid:</span>
                                  <p className="font-semibold">{formatLargeCurrency(linkedExpenses, getCOGSCurrency(entry))}</p>
                                </div>
                                <div>
                                  <span className="font-medium text-black">A/P Remaining:</span>
                                  <p className="font-semibold text-black">{formatLargeCurrency(remainingAmount, getCOGSCurrency(entry))}</p>
                                </div>
                              </div>
                            ) : (
                              // Show simple Income vs Expenses
                              <div className="grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-green-600 font-medium">Income:</span>
                                  <p className="font-semibold">{formatLargeCurrency(entry.amount, entry.currency)}</p>
                                </div>
                                <div>
                                  <span className="text-red-600 font-medium">Total Expenses:</span>
                                  <p className="font-semibold">{formatLargeCurrency(linkedExpenses, entry.currency)}</p>
                                </div>
                                <div>
                                  <span className="text-blue-600 font-medium">Net:</span>
                                  <p className="font-semibold">{formatLargeCurrency(entry.amount - linkedExpenses, entry.currency)}</p>
                                </div>
                              </div>
                            )}
                            
                            {/* List of linked expenses */}
                            {entry.linkedExpensesList.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-blue-200">
                                <Label className="text-xs font-semibold text-blue-700 mb-2 block">
                                  Related Expenses ({entry.linkedExpensesList.length})
                                </Label>
                                <div className="space-y-1">
                                  {entry.linkedExpensesList.map(expense => (
                                    <div key={expense.id} className="flex justify-between items-center text-xs bg-white p-2 rounded border">
                                      <span className="text-gray-700">
                                        {expense.vendorInvoice || expense.description}
                                      </span>
                                      <span className="font-medium text-red-600">
                                        -{formatLargeCurrency(expense.amount, expense.currency)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* COGS Information for Income Entries */}
                        {entry.type === 'revenue' && entry.cogs && linkedExpenses === 0 && (
                          <div className="bg-white p-3 rounded-lg border">
                            <Label className="text-xs font-semibold text-gray-600 mb-2 block">Cost of Goods Sold (COGS)</Label>
                            <div className="grid grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-purple-600 font-medium">Total COGS:</span>
                                <p className="font-semibold">{formatLargeCurrency(entry.cogs, getCOGSCurrency(entry))}</p>
                              </div>
                              <div>
                                <span className="text-red-600 font-medium">Expenses Paid:</span>
                                <p className="font-semibold">{formatLargeCurrency(linkedExpenses, getCOGSCurrency(entry))}</p>
                              </div>
                              <div>
                                <span className="font-medium text-black">A/P:</span>
                                <p className="font-semibold text-black">{formatLargeCurrency(remainingAmount, getCOGSCurrency(entry))}</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Linked Income Information for Expense Entries */}
                        {entry.type === 'expense' && entry.linkedIncomeId && entry.linkedIncome && (
                          <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <Label className="text-xs font-semibold text-green-700 mb-2 block">Linked to Income Entry</Label>
                            {(() => {
                              const linkedIncome = entry.linkedIncome;
                              return linkedIncome ? (
                                <div className="text-sm space-y-2">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <p><span className="font-medium">Income:</span> {linkedIncome.description}</p>
                                      <p><span className="font-medium">Income Amount:</span> {formatLargeCurrency(linkedIncome.amount, linkedIncome.currency)}</p>
                                      {linkedIncome.cogs && (
                                        <p><span className="font-medium">COGS:</span> {formatLargeCurrency(linkedIncome.cogs, getCOGSCurrency(linkedIncome))}</p>
                                      )}
                                    </div>
                                    <div>
                                      <p><span className="font-medium">Total Expenses:</span> {formatLargeCurrency(linkedIncome.totalLinkedExpenses, getCOGSCurrency(linkedIncome))}</p>
                                      {linkedIncome.cogs ? (
                                        <p><span className="font-medium text-black">Remaining A/P:</span> <span className="text-black">{formatLargeCurrency(linkedIncome.remainingAmount, getCOGSCurrency(linkedIncome))}</span></p>
                                      ) : (
                                        <p><span className="font-medium">Net Remaining:</span> {formatLargeCurrency(linkedIncome.amount - linkedIncome.totalLinkedExpenses, linkedIncome.currency)}</p>
                                      )}
                                    </div>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleViewRelatedIncomeEntry(linkedIncome.id)}
                                    className="text-green-600 border-green-200 hover:bg-green-50"
                                  >
                                    <ArrowUpCircle className="h-4 w-4 mr-2" />
                                    View Related Income Entry
                                  </Button>
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500">Linked income entry not found</p>
                              );
                            })()}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-end space-x-2 pt-2 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit Entry
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Entry Dialog */}
      <Dialog open={showEntryDialog} onOpenChange={setShowEntryDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingEntry ? 'Edit Entry' : 'Add New Entry'}</DialogTitle>
            <DialogDescription>
              {editingEntry ? 'Update the bookkeeping entry details.' : 'Create a new income or expense entry.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            {/* Company Selection - Move to Top */}
            <div>
              <Label>Company *</Label>
              <Select value={entryFormData.companyId} onValueChange={(value) => updateEntryFormData('companyId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select company" />
                </SelectTrigger>
                <SelectContent>
                  {companies.filter(c => c.status === 'Active').map(company => (
                    <SelectItem key={company.id} value={String(company.id)}>
                      {company.tradingName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Linked Income Information */}
            {entryFormData.linkedIncomeId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <Label className="text-xs font-semibold text-blue-700 mb-2 block">
                  Linked to Income Entry
                </Label>
                {(() => {
                  const linkedIncome = formSelectedLinkedIncome;
                  return linkedIncome ? (
                    <div className="text-sm space-y-1">
                      <p><span className="font-medium">Income:</span> {linkedIncome.description}</p>
                      <p><span className="font-medium">Income Amount:</span> {formatLargeCurrency(linkedIncome.amount, linkedIncome.currency)}</p>
                      {linkedIncome.cogs && (
                        <p><span className="font-medium">COGS:</span> {formatLargeCurrency(linkedIncome.cogs, getCOGSCurrency(linkedIncome))}</p>
                      )}
                      <p><span className="font-medium">Current Expenses Paid:</span> {formatLargeCurrency(linkedIncome.totalLinkedExpenses, getCOGSCurrency(linkedIncome))}</p>
                      {linkedIncome.cogs ? (
                        <p><span className="font-medium text-black">Remaining A/P:</span> <span className="text-black">{formatLargeCurrency(linkedIncome.remainingAmount, getCOGSCurrency(linkedIncome))}</span></p>
                      ) : (
                        <p><span className="font-medium">Net Remaining:</span> {formatLargeCurrency(linkedIncome.amount - linkedIncome.totalLinkedExpenses, linkedIncome.currency)}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Linked income entry not found</p>
                  );
                })()}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select value={entryFormData.type} onValueChange={(value: 'revenue' | 'expense') => updateEntryFormData('type', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Income</SelectItem>
                    <SelectItem value="expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={entryFormData.category} onValueChange={(value) => updateEntryFormData('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {(entryFormData.type === 'revenue' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                      <SelectItem key={category} value={category}>{category}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Reference field - required for income, optional for expenses */}
            {entryFormData.type === 'revenue' && (
              <div>
                <Label>Reference *</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={entryFormData.selectedInvoiceData ? entryFormData.reference : "Search invoices or type custom reference..."}
                      value={entryFormData.selectedInvoiceData ? entryFormData.reference : invoiceSearchTerm === 'hidden' ? entryFormData.reference : invoiceSearchTerm}
                      onChange={(e) => handleInvoiceSearchChange(e.target.value)}
                      onFocus={handleInvoiceSearchFocus}
                      className="pl-10 pr-10"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    {entryFormData.selectedInvoiceData && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={handleClearSelectedInvoice}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  
                  {/* Dropdown results */}
                  {!entryFormData.selectedInvoiceData && invoiceSearchTerm !== null && invoiceSearchTerm !== 'hidden' && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {/* Custom Reference Option */}
                      {invoiceSearchTerm && (
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b bg-blue-50"
                          onClick={() => handleCustomReferenceSelection(invoiceSearchTerm)}
                        >
                          <div className="font-medium text-blue-600">Use "{invoiceSearchTerm}" as custom reference</div>
                          <div className="text-xs text-gray-500">Click to use this text as your reference</div>
                        </div>
                      )}
                      
                      {/* Invoice Options */}
                      {invoices.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 italic">
                          No invoices available. Create invoices in Sales → Invoices.
                        </div>
                      ) : !entryFormData.companyId ? (
                        <div className="px-3 py-2 text-gray-500 italic">
                          Please select a company first to see related invoices.
                        </div>
                      ) : (
                        (() => {
                          const filteredInvoices = filteredInvoicesForDropdown;
                          
                          return filteredInvoices.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500 italic">
                              {invoiceSearchTerm ? 'No invoices match your search' : 'No paid or sent invoices found for selected company'}
                            </div>
                          ) : (
                            <>
                              {filteredInvoices.length > 0 && (
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b bg-gray-50">
                                  Available Invoices ({filteredInvoices.length})
                                </div>
                              )}
                              {filteredInvoices.map(invoice => (
                                <div
                                  key={invoice.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleInvoiceSelectionWithHide(`Invoice ${invoice.invoiceNumber}`)}
                                >
                                  <div className="font-medium">Invoice {invoice.invoiceNumber} - {invoice.clientName}</div>
                                  <div className="text-sm text-gray-600">{formatLargeCurrency(invoice.totalAmount, invoice.currency)} • {invoice.status}</div>
                                  {invoice.items.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Products: {invoice.items.map(item => item.productName).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Vendor Invoice field - only for expenses */}
            {entryFormData.type === 'expense' && (
              <div>
                <Label>Vendor Invoice *</Label>
                <Input
                  value={entryFormData.vendorInvoice}
                  onChange={(e) => updateEntryFormData('vendorInvoice', e.target.value)}
                  placeholder="Vendor invoice number"
                />
              </div>
            )}
            
            <div>
              <Label>Description {entryFormData.type === 'revenue' ? '(Optional)' : ''}</Label>
              <Input
                value={entryFormData.description}
                onChange={(e) => updateEntryFormData('description', e.target.value)}
                placeholder="Detailed description of the transaction"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={entryFormData.amount}
                  onChange={(e) => updateEntryFormData('amount', e.target.value)}
                  placeholder="0.00"
                />
              </div>

            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Input
                  type="date"
                  value={entryFormData.date}
                  onChange={(e) => updateEntryFormData('date', e.target.value)}
                />
              </div>
              <div>
                <Label>Currency {entryFormData.selectedInvoiceData && '(Auto-filled from invoice)'}</Label>
                <Select value={entryFormData.currency} onValueChange={(value) => updateEntryFormData('currency', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {/* Reference field - optional for expenses */}
            {entryFormData.type === 'expense' && (
              <div>
                <Label>Reference (Optional)</Label>
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder={entryFormData.selectedInvoiceData ? entryFormData.reference : "Search invoices or type custom reference..."}
                      value={entryFormData.selectedInvoiceData ? entryFormData.reference : invoiceSearchTerm === 'hidden' ? entryFormData.reference : invoiceSearchTerm}
                      onChange={(e) => handleInvoiceSearchChange(e.target.value)}
                      onFocus={handleInvoiceSearchFocus}
                      className="pl-10 pr-10"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    {entryFormData.selectedInvoiceData && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-8 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                        onClick={handleClearSelectedInvoice}
                      >
                        ×
                      </Button>
                    )}
                  </div>
                  
                  {/* Dropdown results */}
                  {!entryFormData.selectedInvoiceData && invoiceSearchTerm !== null && invoiceSearchTerm !== 'hidden' && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
                      {/* Custom Reference Option */}
                      {invoiceSearchTerm && (
                        <div
                          className="px-3 py-2 hover:bg-gray-100 cursor-pointer border-b bg-blue-50"
                          onClick={() => handleCustomReferenceSelection(invoiceSearchTerm)}
                        >
                          <div className="font-medium text-blue-600">Use "{invoiceSearchTerm}" as custom reference</div>
                          <div className="text-xs text-gray-500">Click to use this text as your reference</div>
                        </div>
                      )}
                      
                      {/* Invoice Options */}
                      {invoices.length === 0 ? (
                        <div className="px-3 py-2 text-gray-500 italic">
                          No invoices available. Create invoices in Sales → Invoices.
                        </div>
                      ) : !entryFormData.companyId ? (
                        <div className="px-3 py-2 text-gray-500 italic">
                          Please select a company first to see related invoices.
                        </div>
                      ) : (
                        (() => {
                          const filteredInvoices = filteredInvoicesForDropdown;
                          
                          return filteredInvoices.length === 0 ? (
                            <div className="px-3 py-2 text-gray-500 italic">
                              {invoiceSearchTerm ? 'No invoices match your search' : 'No paid or sent invoices found for selected company'}
                            </div>
                          ) : (
                            <>
                              {filteredInvoices.length > 0 && (
                                <div className="px-3 py-1 text-xs font-medium text-gray-500 border-b bg-gray-50">
                                  Available Invoices ({filteredInvoices.length})
                                </div>
                              )}
                              {filteredInvoices.map(invoice => (
                                <div
                                  key={invoice.id}
                                  className="px-3 py-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => handleInvoiceSelectionWithHide(`Invoice ${invoice.invoiceNumber}`)}
                                >
                                  <div className="font-medium">Invoice {invoice.invoiceNumber} - {invoice.clientName}</div>
                                  <div className="text-sm text-gray-600">{formatLargeCurrency(invoice.totalAmount, invoice.currency)} • {invoice.status}</div>
                                  {invoice.items.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1">
                                      Products: {invoice.items.map(item => item.productName).join(', ')}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Selected Invoice Information */}
            {entryFormData.selectedInvoiceData && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-3">Selected Invoice Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs font-semibold text-blue-700">Invoice Details</Label>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Number:</span> {entryFormData.selectedInvoiceData.invoiceNumber}</p>
                      <p><span className="font-medium">Client:</span> {entryFormData.selectedInvoiceData.clientName}</p>
                      <p><span className="font-medium">Amount:</span> {formatLargeCurrency(entryFormData.selectedInvoiceData.totalAmount, entryFormData.selectedInvoiceData.currency)}</p>
                      <p><span className="font-medium">Status:</span> <Badge variant="outline">{entryFormData.selectedInvoiceData.status}</Badge></p>
                    </div>
                  </div>
                  
                  {entryFormData.vendorData && (
                    <div>
                      <Label className="text-xs font-semibold text-blue-700">Vendor Information</Label>
                      <div className="space-y-1 text-sm">
                        <p><span className="font-medium">Company:</span> {entryFormData.vendorData.companyName}</p>
                        <p><span className="font-medium">Payment Terms:</span> {entryFormData.vendorData.paymentTerms} days</p>
                        <p><span className="font-medium">Currency:</span> {entryFormData.vendorData.currency}</p>
                        <p><span className="font-medium">Payment Method:</span> {entryFormData.vendorData.paymentMethod}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {entryFormData.productData && entryFormData.productData.length > 0 && (
                  <div className="mt-4">
                    <Label className="text-xs font-semibold text-blue-700">Related Products ({entryFormData.productData.length})</Label>
                    <div className="mt-2 space-y-1">
                      {entryFormData.productData.map((product, index) => (
                        <div key={product.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border">
                          <div>
                            <span className="font-medium">{product.name}</span>
                            {product.description && <span className="text-gray-500 ml-2">- {product.description}</span>}
                          </div>
                          <div className="text-right">
                            <div className="font-medium">Price: {product.currency} {product.price.toFixed(2)}</div>
                            <div className="text-xs text-purple-600 font-medium">
                              Cost: {product.costCurrency} {product.cost.toFixed(2)}
                              {product.costCurrency !== product.currency && (
                                <span className="ml-1 text-orange-600">• Different currency</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                      {formCogsSummary && formCogsSummary.amount > 0 && (
                        <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                          <span className="font-medium text-purple-700">
                            Total COGS: {formCogsSummary.currency} {formCogsSummary.amount.toFixed(2)}
                          </span>
                          <div className="text-xs text-purple-600 mt-1">
                            Calculated from product costs × quantities. Expenses should be tracked in {formCogsSummary.currency}.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* COGS fields for income entries */}
            {entryFormData.type === 'revenue' && (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <Label>COGS Amount (Optional)</Label>
                    {entryFormData.selectedInvoiceData && entryFormData.cogs && (
                      <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                        {formCogsSummary ? `Auto-calculated (${formCogsSummary.currency})` : 'Auto-calculated (USD)'}
                      </Badge>
                    )}
                  </div>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Cost of goods sold for this income"
                    value={entryFormData.cogs}
                    onChange={(e) => updateEntryFormData('cogs', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {formCogsSummary
                      ? `Auto-calculated from product costs: ${formCogsSummary.currency} ${formCogsSummary.amount.toFixed(2)}. Expenses should be tracked in ${formCogsSummary.currency}. You can edit this value if needed.`
                      : "Enter the total cost for delivering this income (product costs, materials, etc.)."}
                  </p>
                </div>
                <div>
                  <Label>COGS Paid (Optional)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="Amount of COGS already paid"
                    value={entryFormData.cogsPaid}
                    onChange={(e) => updateEntryFormData('cogsPaid', e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Legacy field - Track actual expense payments separately in the expense entries.
                  </p>
                </div>
              </>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={handleCancelEdit}>
              Cancel
            </Button>
            <Button onClick={editingEntry ? handleUpdateEntry : handleCreateEntry}>
              {editingEntry ? 'Update Entry' : 'Create Entry'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

            {/* Bulk Add Dialog - Compact Modal */}
      {showBulkAddDialog && (
        <div 
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCancelBulkAdd();
            }
          }}
        >
          <div className="bg-white w-full h-full max-w-[1200px] max-h-[700px] rounded-lg shadow-2xl drop-shadow-2xl flex flex-col overflow-hidden" style={{boxShadow: '0 -25px 50px -12px rgba(0, 0, 0, 0.25), 0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05)'}}>
            {/* Header */}
            <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Copy className="h-5 w-5 text-gray-700" />
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Bulk Add {bulkAddType === 'revenue' ? 'Income' : 'Expense'} Entries
                    </h2>
                    <p className="text-sm text-gray-600">
                      Add multiple {bulkAddType} entries at once. Fill in the required fields and use the + button to add more rows.
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelBulkAdd}
                  className="h-8 w-8 rounded-full hover:bg-gray-200"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Scrollable Entry Rows */}
              <div className="flex-1 overflow-y-auto px-3 py-2">
                <div className="space-y-2">
                  {bulkEntries.map((entry, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded p-2 shadow-sm hover:shadow-md transition-all duration-200">
                      <div className="grid gap-2 items-end" style={{gridTemplateColumns: bulkAddType === 'revenue' ? '2fr 3fr 1.5fr 1fr 1.5fr 1fr 2fr 1.5fr 100px' : '2fr 3fr 1.5fr 1fr 2fr 1.5fr 100px'}}>
                        {/* First field - Vendor Invoice for expenses, Reference for income */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            {bulkAddType === 'expense' ? 'Vendor Invoice*' : 'Reference*'} {index === 0 && <span className="text-gray-500">(Required)</span>}
                          </label>
                          <Input
                            placeholder={bulkAddType === 'expense' ? 'Invoice number' : 'Reference info'}
                            value={bulkAddType === 'expense' ? entry.vendorInvoice : entry.reference}
                            onChange={(e) => updateBulkEntry(index, bulkAddType === 'expense' ? 'vendorInvoice' : 'reference', e.target.value)}
                            className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {/* Second field - Description (now optional) */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description {index === 0 && <span className="text-gray-500">(Optional)</span>}
                          </label>
                          <Input
                            placeholder="Enter description"
                            value={entry.description}
                            onChange={(e) => updateBulkEntry(index, 'description', e.target.value)}
                            className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {/* Amount field */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Amount* {index === 0 && <span className="text-gray-500">(Required)</span>}
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={entry.amount}
                            onChange={(e) => updateBulkEntry(index, 'amount', e.target.value)}
                            className="h-9 text-sm text-right border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {/* Currency field */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Currency {index === 0 && <span className="text-gray-500">(Required)</span>}
                          </label>
                          <Select value={(entry as any).currency || 'USD'} onValueChange={(value) => updateBulkEntry(index, 'currency', value)}>
                            <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Currency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="USD">USD</SelectItem>
                              <SelectItem value="EUR">EUR</SelectItem>
                              <SelectItem value="GBP">GBP</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {/* COGS field - only for income entries */}
                        {bulkAddType === 'revenue' && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">COGS {index === 0 && <span className="text-gray-500">(Optional)</span>}</label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              value={(entry as any).cogs || ''}
                              onChange={(e) => updateBulkEntry(index, 'cogs', e.target.value)}
                              className="h-9 text-sm text-right border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                            />
                          </div>
                        )}
                        {/* COGS Currency field - only for income entries when COGS > 0.01 */}
                        {bulkAddType === 'revenue' && parseFloat((entry as any).cogs || '0') > 0.01 && (
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">COGS Currency</label>
                            <Select value={(entry as any).cogsCurrency || 'USD'} onValueChange={(value) => updateBulkEntry(index, 'cogsCurrency', value)}>
                              <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <SelectValue placeholder="Currency" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="USD">USD</SelectItem>
                                <SelectItem value="EUR">EUR</SelectItem>
                                <SelectItem value="GBP">GBP</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                        {/* Category field */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Category* {index === 0 && <span className="text-gray-500">(Required)</span>}
                          </label>
                          <Select value={entry.category} onValueChange={(value) => updateBulkEntry(index, 'category', value)}>
                            <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              {(bulkAddType === 'revenue' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(category => (
                                <SelectItem key={category} value={category}>{category}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        {/* Date field */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Date
                          </label>
                          <Input
                            type="date"
                            value={entry.date}
                            onChange={(e) => updateBulkEntry(index, 'date', e.target.value)}
                            className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {/* Actions */}
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Actions
                          </label>
                          <div className="flex space-x-1">
                            <Button
                              variant="outline"
                              onClick={addBulkEntryRow}
                              className="h-9 px-2 flex items-center justify-center border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300"
                              title="Add row"
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => removeBulkEntryRow(index)}
                              disabled={bulkEntries.length === 1}
                              className="h-9 px-2 text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              title="Remove row"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Bar - Updated validation count */}
              <div className="flex-shrink-0 px-4 py-2 bg-blue-50 border-t border-blue-200">
                <div className="text-sm text-blue-800">
                  <strong>* Required fields.</strong> {validBulkEntriesCount} of {bulkEntries.length} entries are complete and ready to create.
                </div>
              </div>
            </div>

            {/* Footer - Updated create button count */}
            <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
              <Button 
                variant="outline" 
                onClick={handleCancelBulkAdd}
                className="px-8 py-3 text-lg h-12"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleBulkCreate} 
                className={`px-8 py-3 text-lg h-12 ${bulkAddType === 'revenue' ? 'bg-green-100 hover:bg-green-200 text-green-700' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
              >
                <Copy className="h-5 w-5 mr-3" />
                Create {validBulkEntriesCount} Entries
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmDialog} onOpenChange={setShowDeleteConfirmDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Entries</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete {selectedEntries.size} selected entries? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <div className="text-sm font-medium">Entries to be deleted:</div>
            <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 p-3 rounded">
              {entriesToDeleteDetails.map(entry => (
                <div key={entry.id} className="text-sm flex items-center justify-between">
                  <span className="truncate">
                    {entry.display}
                  </span>
                  <span className={`font-medium ${entry.type === 'revenue' ? 'text-green-600' : 'text-red-600'}`}>
                    {formatLargeCurrency(entry.amount, entry.currency)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteConfirmDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete {selectedEntries.size} Entries
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirmation Dialog */}
      <Dialog open={showDeleteSingleDialog} onOpenChange={setShowDeleteSingleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Entry</span>
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this entry? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {entryToDelete && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Entry to be deleted:</div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="text-sm flex items-center justify-between">
                  <span className="truncate">
                    {entryToDelete.type === 'expense' && entryToDelete.vendorInvoice 
                      ? entryToDelete.vendorInvoice 
                      : entryToDelete.description}
                  </span>
                  <span className={`font-medium ml-2 ${
                    entryToDelete.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {entryToDelete.type === 'revenue' ? '+' : '-'}
                    {formatLargeCurrency(entryToDelete.amount, entryToDelete.currency)}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {entryToDelete.category} • {formatDateForDisplay(entryToDelete.date)}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteSingleDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={confirmDeleteEntry}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Expense to Income Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={handleCancelLink}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Link Transaction to Entry</DialogTitle>
            <DialogDescription>
              Select an entry to link this transaction to
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-hidden">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Income Entries</h3>
            
            {/* Scrollable list of income entries */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {availableIncomeEntriesForLinking.map((entry) => (
                <div
                  key={entry.id}
                  className={`border rounded-lg p-3 cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedIncomeForLink === entry.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                  onClick={() => setSelectedIncomeForLink(entry.id)}
                >
                  <div className="font-medium text-gray-900">
                    {entry.display}
                    {entry.companyName && ` - ${entry.companyName}`}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatLargeCurrency(entry.amount, entry.currency)} on {formatDateForDisplay(entry.date)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={handleCancelLink}>
              Cancel
            </Button>
            <Button 
              onClick={handleConfirmLink} 
              disabled={!selectedIncomeForLink}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Link Transaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 