'use client';

import React, { useState, useMemo, useCallback, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { useCompanyFilter } from '@/contexts/CompanyFilterContext';
import { useEntriesManagement } from '@/hooks/useEntriesManagement';
import { EntryFilters, EntryPaginationOptions } from '@/services/api/entryApiService';
import { formatDateForDisplay } from '@/utils';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Upload from 'lucide-react/dist/esm/icons/upload';
import Maximize2 from 'lucide-react/dist/esm/icons/maximize-2';
import Minimize2 from 'lucide-react/dist/esm/icons/minimize-2';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import ToggleLeft from 'lucide-react/dist/esm/icons/toggle-left';
import ToggleRight from 'lucide-react/dist/esm/icons/toggle-right';
import CheckSquare from 'lucide-react/dist/esm/icons/check-square';
import Square from 'lucide-react/dist/esm/icons/square';
import Receipt from 'lucide-react/dist/esm/icons/receipt';

// Types for bulk add functionality
interface BulkEntryFormData {
  description: string;
  amount: string;
  currency: string;
  category: string;
  vendorInvoice: string;
  date: string;
  reference: string;
  cogs: string;
  cogsCurrency: string;
}

// Lazy load heavy components
const EntriesFilterBar = dynamic(
  () => import('@/components/features/EntriesFilterBar').then(mod => ({ default: mod.EntriesFilterBar })),
  { ssr: false }
);

const EntriesListView = dynamic(
  () => import('@/components/features/EntriesListView').then(mod => ({ default: mod.EntriesListView })),
  { ssr: false }
);

const AddEditEntryDialog = dynamic(
  () => import('@/components/features/AddEditEntryDialog').then(mod => ({ default: mod.AddEditEntryDialog })),
  { ssr: false }
);

const BulkAddDialog = dynamic(
  () => import('@/components/features/BulkAddDialog').then(mod => ({ default: mod.BulkAddDialog })),
  { ssr: false }
);

const ConfirmationDialog = lazy(() => 
  import('@/components/ui/ConfirmationDialog').then(mod => ({ default: mod.ConfirmationDialog }))
);

interface EntriesClientProps {
  initialFilters?: EntryFilters;
  initialPagination?: EntryPaginationOptions;
  highlightId?: string;
}

export default function EntriesClient({
  initialFilters,
  initialPagination,
  highlightId,
}: EntriesClientProps) {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  
  // Get selected company name for display
  const selectedCompanyName = companies?.find(c => c.id === parseInt(globalSelectedCompany || '0'))?.tradingName;
  
  // Use the entries management hook
  const {
    entries,
    groupedEntries,
    financialSummary,
    isLoading,
    isFetching,
    filters,
    handleFilterChange,
    selectedEntries,
    toggleEntrySelection,
    toggleSelectAll,
    showEntryDialog,
    setShowEntryDialog,
    editingEntry,
    showDeleteDialog,
    setShowDeleteDialog,
    entryToDelete,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,
    handleCreateEntry,
    handleEditEntry,
    handleDeleteEntry,
    handleBulkDelete,
    handleSubmitEntry,
    confirmDelete,
    confirmBulkDelete,
    formatCurrency,
    getCOGSCurrency,
    highlightedEntryId: hookHighlightedId,
    // Link functions
    handleLinkToIncome,
    handleViewRelatedIncomeEntry,
    showLinkDialog,
    setShowLinkDialog,
    expenseToLink,
    selectedIncomeForLink,
    setSelectedIncomeForLink,
    handleConfirmLink,
    handleCancelLink,
    // Mutations
    bulkCreateMutation,
  } = useEntriesManagement({
    companyId: initialFilters?.companyId || globalSelectedCompany || 'all',
    initialFilters,
    initialPagination,
  });

  // Local UI state
  const [groupedView, setGroupedView] = useState(false);
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [showBulkAddDialog, setShowBulkAddDialog] = useState(false);
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const [userSelectedPeriod, setUserSelectedPeriod] = useState<string | null>(null);

  // Bulk add state
  const [bulkAddType, setBulkAddType] = useState<'income' | 'expense'>('expense');
  const [bulkEntries, setBulkEntries] = useState<BulkEntryFormData[]>([
    {
      description: '',
      amount: '',
      currency: 'USD',
      category: '',
      vendorInvoice: '',
      date: new Date().toISOString().split('T')[0],
      reference: '',
      cogs: '',
      cogsCurrency: 'USD',
    }
  ]);

  // Entry form state - using useMemo to prevent infinite loops
  const initialEntryFormData = useMemo(() => ({
    type: 'revenue' as 'revenue' | 'expense',
    category: '',
    subcategory: '',
    amount: '',
    currency: 'USD',
    description: '',
    date: new Date().toISOString().split('T')[0],
    companyId: '',
    reference: '',
    accountId: '',
    accountType: 'bank' as 'bank' | 'wallet',
    cogs: '',
    cogsPaid: '',
    selectedInvoiceData: null,
    vendorData: null,
    productData: null,
    linkedIncomeId: '',
    vendorInvoice: ''
  }), []);
  
  const [entryFormData, setEntryFormData] = useState(initialEntryFormData);

  // Entry form update function
  const updateEntryFormData = useCallback((field: string, value: unknown) => {
    setEntryFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // Clean form data before submission (remove circular references)
  const cleanFormDataForSubmission = useCallback(() => {
    const {
      selectedInvoiceData,
      vendorData,
      productData,
      ...cleanData
    } = entryFormData;
    
    // Convert to proper format for API
    return {
      type: cleanData.type,
      category: cleanData.category,
      subcategory: cleanData.subcategory,
      amount: parseFloat(cleanData.amount) || 0,
      currency: cleanData.currency,
      description: cleanData.description,
      date: cleanData.date,
      companyId: cleanData.companyId ? parseInt(cleanData.companyId) : null,
      reference: cleanData.reference || null,
      accountId: cleanData.accountId || null,
      accountType: cleanData.accountType,
      cogs: parseFloat(cleanData.cogs) || 0,
      cogsPaid: parseFloat(cleanData.cogsPaid) || 0,
      linkedIncomeId: cleanData.linkedIncomeId || null,
      vendorInvoice: cleanData.vendorInvoice || null,
      // Add relevant data from complex objects if needed
      invoiceId: selectedInvoiceData?.id || null,
    };
  }, [entryFormData]);

  // Wrapped handlers for create/update
  const handleCreateEntryWrapper = useCallback(() => {
    const cleanData = cleanFormDataForSubmission();
    handleSubmitEntry(cleanData);
  }, [cleanFormDataForSubmission, handleSubmitEntry]);

  const handleUpdateEntryWrapper = useCallback(() => {
    const cleanData = cleanFormDataForSubmission();
    handleSubmitEntry(cleanData);
  }, [cleanFormDataForSubmission, handleSubmitEntry]);

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (showEntryDialog) {
      if (editingEntry) {
        // When editing, populate with existing entry data
        setEntryFormData({
          type: editingEntry.type as 'revenue' | 'expense',
          category: editingEntry.category || '',
          subcategory: editingEntry.subcategory || '',
          amount: editingEntry.amount?.toString() || '',
          currency: editingEntry.currency || 'USD',
          description: editingEntry.description || '',
          date: editingEntry.date || new Date().toISOString().split('T')[0],
          companyId: editingEntry.companyId?.toString() || '',
          reference: editingEntry.reference || '',
          accountId: editingEntry.accountId?.toString() || '',
          accountType: (editingEntry as any).accountType || 'bank',
          cogs: (editingEntry as any).cogs?.toString() || '',
          cogsPaid: (editingEntry as any).cogsPaid?.toString() || '',
          selectedInvoiceData: null,
          vendorData: null,
          productData: null,
          linkedIncomeId: (editingEntry as any).linkedIncomeId || '',
          vendorInvoice: (editingEntry as any).vendorInvoice || ''
        });
      } else {
        // When creating new, reset to initial data
        setEntryFormData({
          ...initialEntryFormData,
          companyId: globalSelectedCompany !== 'all' ? String(globalSelectedCompany) : '',
        });
      }
    }
  }, [showEntryDialog, editingEntry, globalSelectedCompany, initialEntryFormData]);

  // Use highlighted ID from props or hook
  const highlightedEntryId = highlightId || hookHighlightedId;

  // Check if we can add entries (company must be selected)
  const canAddEntry = globalSelectedCompany !== 'all' && globalSelectedCompany !== null;

  // Helper function to determine current selected period based on date filters
  const getDetectedPeriod = useCallback(() => {
    if (!filters.dateFrom && !filters.dateTo) {
      return 'allTime';
    }

    const now = new Date();
    const currentDate = filters.dateFrom;
    const endDate = filters.dateTo;

    if (!currentDate || !endDate) {
      return 'custom';
    }

    // Check if dates match "This Month"
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    if (currentDate === thisMonthStart && endDate === thisMonthEnd) {
      return 'thisMonth';
    }

    // Check if dates match "Last Month"
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    if (currentDate === lastMonthStart && endDate === lastMonthEnd) {
      return 'lastMonth';
    }

    // Check if dates match "This Year"
    const thisYearStart = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
    const thisYearEnd = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
    if (currentDate === thisYearStart && endDate === thisYearEnd) {
      return 'thisYear';
    }

    // Check if dates match "Last Year"
    const lastYearStart = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
    const lastYearEnd = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
    if (currentDate === lastYearStart && endDate === lastYearEnd) {
      return 'lastYear';
    }

    // If none match, it's a custom range
    return 'custom';
  }, [filters.dateFrom, filters.dateTo]);

  // Get the effective selected period (user selection takes precedence over detection)
  const getEffectiveSelectedPeriod = useCallback(() => {
    if (userSelectedPeriod) {
      return userSelectedPeriod;
    }
    return getDetectedPeriod();
  }, [userSelectedPeriod, getDetectedPeriod]);

  // Toggle functions
  const toggleEntryExpansion = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  const toggleGroupExpansion = useCallback((groupKey: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupKey)) {
        newSet.delete(groupKey);
      } else {
        newSet.add(groupKey);
      }
      return newSet;
    });
  }, []);

  const toggleAllEntriesExpansion = useCallback(() => {
    if (isAllExpanded) {
      setExpandedEntries(new Set());
      setExpandedGroups(new Set());
    } else {
      setExpandedEntries(new Set(entries.map(e => e.id)));
      setExpandedGroups(new Set(groupedEntries.map(g => `${g.type}_${g.category}`)));
    }
    setIsAllExpanded(!isAllExpanded);
  }, [isAllExpanded, entries, groupedEntries]);

  // Bulk add handlers
  const updateBulkEntry = useCallback((index: number, field: string, value: string) => {
    setBulkEntries(prev => 
      prev.map((entry, i) => 
        i === index ? { ...entry, [field]: value } : entry
      )
    );
  }, []);

  const addBulkEntryRow = useCallback(() => {
    setBulkEntries(prev => [
      ...prev,
      {
        description: '',
        amount: '',
        currency: 'USD',
        category: '',
        vendorInvoice: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        cogs: '',
        cogsCurrency: 'USD',
      }
    ]);
  }, []);

  const removeBulkEntryRow = useCallback((index: number) => {
    setBulkEntries(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleCancelBulkAdd = useCallback(() => {
    setShowBulkAddDialog(false);
    // Reset bulk entries
    setBulkEntries([
      {
        description: '',
        amount: '',
        currency: 'USD',
        category: '',
        vendorInvoice: '',
        date: new Date().toISOString().split('T')[0],
        reference: '',
        cogs: '',
        cogsCurrency: 'USD',
      }
    ]);
  }, []);

  const handleBulkCreate = useCallback(async () => {
    try {
      // Check if company is selected
      if (!canAddEntry) {
        console.warn('Cannot create entries without a selected company');
        return;
      }

      const validEntries = bulkEntries.filter(entry => 
        entry.description && entry.amount && entry.category
      );

      if (validEntries.length === 0) {
        return;
      }

      const createData = validEntries.map(entry => ({
        companyId: globalSelectedCompany || '1', // Send as string to match API expectation
        type: bulkAddType,
        category: entry.category,
        description: entry.description,
        amount: entry.amount, // Send as string to match API expectation
        currency: entry.currency,
        date: entry.date,
        reference: entry.reference || undefined,
        vendorInvoice: entry.vendorInvoice || undefined,
        cogs: entry.cogs || undefined, // Send as string to match API expectation
      }));

      await bulkCreateMutation.mutateAsync(createData);
      handleCancelBulkAdd();
    } catch (error) {
      console.error('Bulk create error:', error);
    }
  }, [bulkEntries, bulkAddType, globalSelectedCompany, bulkCreateMutation, handleCancelBulkAdd, canAddEntry]);

  // Calculate valid bulk entries count
  const validBulkEntriesCount = useMemo(() => {
    return bulkEntries.filter(entry => 
      entry.description && entry.amount && entry.category
    ).length;
  }, [bulkEntries]);

  // Calculate entries to delete details
  const entriesToDeleteDetails = useMemo(() => {
    return Array.from(selectedEntries).map(id => {
      const entry = entries.find(e => e.id === id);
      if (!entry) return null;
      return {
        id: entry.id,
        display: `${entry.description} - ${formatDateForDisplay(entry.date)}`,
        type: entry.type,
        amount: entry.amount,
        currency: entry.currency,
      };
    }).filter(Boolean);
  }, [selectedEntries, entries, formatDateForDisplay, formatCurrency]);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Receipt className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Revenue & Expense Entries</h1>
              <p className="text-muted-foreground">
                Manage revenue and expense entries with category-based tracking and linking capabilities.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6">
          {canAddEntry ? (
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Button 
                onClick={handleCreateEntry}
                className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                disabled={isFetching}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Entry
              </Button>
              <Button 
                onClick={() => {
                  setBulkAddType('expense');
                  setShowBulkAddDialog(true);
                }}
                variant="outline"
                className="w-full sm:w-auto"
                disabled={isFetching}
              >
                <Upload className="h-4 w-4 mr-2" />
                Bulk Add
              </Button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-amber-100 p-2 rounded-full">
                  <Receipt className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-amber-800 font-semibold">Select a Company</h3>
                  <p className="text-amber-700 text-sm">Please select a specific company from the filter to add entries.</p>
                </div>
              </div>
            </div>
          )}
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
                  {formatCurrency(financialSummary.expenses)}
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
        <Suspense fallback={<div className="h-32 bg-gray-100 animate-pulse rounded-lg" />}>
          <EntriesFilterBar
            viewFilter={filters.type || 'all'}
            groupedView={groupedView}
            selectedPeriod={getEffectiveSelectedPeriod()}
            customDateRange={{ start: filters.dateFrom || '', end: filters.dateTo || '' }}
            searchTerm={filters.search || ''}
            setViewFilter={(filter) => handleFilterChange({ type: filter === 'all' ? undefined : filter })}
            setGroupedView={setGroupedView}
            setSelectedPeriod={(period) => {
              // Set the user-selected period
              setUserSelectedPeriod(period);

              const now = new Date();
              let dateFrom: string | undefined;
              let dateTo: string | undefined;

              switch (period) {
                case 'allTime':
                  dateFrom = undefined;
                  dateTo = undefined;
                  handleFilterChange({ dateFrom, dateTo });
                  break;
                case 'thisMonth':
                  dateFrom = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                  dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
                  handleFilterChange({ dateFrom, dateTo });
                  break;
                case 'lastMonth':
                  dateFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                  dateTo = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
                  handleFilterChange({ dateFrom, dateTo });
                  break;
                case 'thisYear':
                  dateFrom = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                  dateTo = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
                  handleFilterChange({ dateFrom, dateTo });
                  break;
                case 'lastYear':
                  dateFrom = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                  dateTo = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
                  handleFilterChange({ dateFrom, dateTo });
                  break;
                case 'custom':
                  // For custom period, just set the user selection - date inputs will appear
                  // The actual date changes will be handled by setCustomDateRange
                  break;
                default:
                  break;
              }
            }}
            setCustomDateRange={(range) => handleFilterChange({ dateFrom: range.start, dateTo: range.end })}
            setSearchTerm={(term) => handleFilterChange({ search: term })}
          />
        </Suspense>


        {/* View Controls and Selection Actions */}
        {entries.length > 0 && (
          <div className="flex flex-col space-y-4 sm:flex-row sm:justify-between sm:items-center sm:space-y-0">
            <div></div> {/* Empty div for spacing */}
            <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:space-x-2 sm:space-y-0">
              {/* View Toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGroupedView(!groupedView)}
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
                {selectedEntries.size === entries.length ? (
                  <CheckSquare className="h-4 w-4" />
                ) : (
                  <Square className="h-4 w-4" />
                )}
                <span className="text-sm">
                  {selectedEntries.size === entries.length ? 'Deselect All' : 'Select All'}
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
          </div>
        )}

        {/* Main Content */}
        <Card>
          <CardHeader>
            <CardTitle>Bookkeeping Entries</CardTitle>
            <CardDescription>
              Revenue and expense entries with category tracking and COGS management
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={<div className="h-96 bg-gray-100 animate-pulse rounded-lg" />}>
              <EntriesListView
                filteredEntries={entries}
                processedGroupedEntries={groupedView ? groupedEntries : []}
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
            </Suspense>
          </CardContent>
        </Card>

        {/* Dialogs - Lazy loaded */}
        <Suspense>
          {showEntryDialog && (
            <AddEditEntryDialog
              dialogProps={{
                open: showEntryDialog,
                onOpenChange: setShowEntryDialog
              }}
              formProps={{
                entryFormData,
                editingEntry,
                updateEntryFormData,
              }}
              dataProps={{
                companies: companies || [],
                invoices: [],
                filteredInvoicesForDropdown: [],
                formSelectedLinkedIncome: null,
                formCogsSummary: null,
              }}
              invoiceSearchProps={{
                invoiceSearchTerm: '',
                handleInvoiceSearchChange: () => {},
                handleInvoiceSearchFocus: () => {},
                handleCustomReferenceSelection: () => {},
                handleInvoiceSelectionWithHide: () => {},
                handleClearSelectedInvoice: () => {},
              }}
              actionProps={{
                handleCancelEdit: () => {
                  setShowEntryDialog(false);
                },
                handleCreateEntry: handleCreateEntryWrapper,
                handleUpdateEntry: handleUpdateEntryWrapper,
              }}
              utilityProps={{
                formatLargeCurrency: formatCurrency,
                getCOGSCurrency,
              }}
              selectedCompanyName={selectedCompanyName}
            />
          )}

          {showBulkAddDialog && (
            <BulkAddDialog
              open={showBulkAddDialog}
              onClose={handleCancelBulkAdd}
              bulkAddType={bulkAddType}
              bulkEntries={bulkEntries}
              validBulkEntriesCount={validBulkEntriesCount}
              updateBulkEntry={updateBulkEntry}
              addBulkEntryRow={addBulkEntryRow}
              removeBulkEntryRow={removeBulkEntryRow}
              handleCancelBulkAdd={handleCancelBulkAdd}
              handleBulkCreate={handleBulkCreate}
            />
          )}

          {/* Delete Confirmation Dialog - Bulk */}
          {showBulkDeleteDialog && (
            <ConfirmationDialog
              open={showBulkDeleteDialog}
              onOpenChange={setShowBulkDeleteDialog}
              title="Delete Entries"
              description={`Are you sure you want to permanently delete ${selectedEntries.size} selected entries? This action cannot be undone.`}
              confirmText={`Delete ${selectedEntries.size} Entries`}
              onConfirm={confirmBulkDelete}
            >
              <div className="space-y-2">
                <div className="text-sm font-medium">Entries to be deleted:</div>
                <div className="max-h-48 overflow-y-auto space-y-1 bg-gray-50 p-3 rounded">
                  {entriesToDeleteDetails.map(entry => entry && (
                    <div key={entry.id} className="text-sm flex items-center justify-between">
                      <span className="truncate">
                        {entry.display}
                      </span>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          entry.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {entry.type === 'revenue' ? 'revenue' : entry.type}
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
          )}

          {/* Delete Confirmation Dialog - Single */}
          {showDeleteDialog && entryToDelete && (
            <ConfirmationDialog
              open={showDeleteDialog}
              onOpenChange={setShowDeleteDialog}
              title="Delete Entry"
              description="Are you sure you want to permanently delete this entry? This action cannot be undone."
              confirmText="Delete Entry"
              onConfirm={confirmDelete}
            >
              <div className="space-y-2">
                <div className="text-sm font-medium">Entry to be deleted:</div>
                <div className="bg-gray-50 p-3 rounded">
                  <div className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{entryToDelete.description}</span>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        entryToDelete.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {entryToDelete.type === 'revenue' ? 'revenue' : entryToDelete.type}
                      </span>
                    </div>
                    <div className="text-gray-600">{entryToDelete.category}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDateForDisplay(entryToDelete.date)} • {formatCurrency(entryToDelete.amount, entryToDelete.currency)}
                    </div>
                  </div>
                </div>
              </div>
            </ConfirmationDialog>
          )}

          {/* Link to Revenue Dialog */}
          {showLinkDialog && expenseToLink && (
            <Dialog open={showLinkDialog} onOpenChange={handleCancelLink}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Link Expense to Revenue Entry</DialogTitle>
                  <DialogDescription>
                    Select a revenue entry to link this expense to. This will track the expense against the revenue.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  {/* Expense Entry Info */}
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">Expense Entry</h4>
                    <div className="text-sm text-red-800">
                      <p><strong>Description:</strong> {expenseToLink.description || 'No description'}</p>
                      <p><strong>Amount:</strong> -{formatCurrency(expenseToLink.amount, expenseToLink.currency)}</p>
                      <p><strong>Category:</strong> {expenseToLink.category}</p>
                    </div>
                  </div>

                  {/* Revenue Entry Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Revenue Entry to Link To:
                    </label>
                    <Select value={selectedIncomeForLink} onValueChange={setSelectedIncomeForLink}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a revenue entry..." />
                      </SelectTrigger>
                      <SelectContent>
                        {entries.filter(entry => 
                          entry.type === 'revenue' && 
                          entry.companyId === expenseToLink.companyId &&
                          entry.id !== expenseToLink.id
                        ).map((revenueEntry) => (
                          <SelectItem key={revenueEntry.id} value={revenueEntry.id}>
                            <div className="flex justify-between items-center w-full">
                              <span className="truncate">
                                {revenueEntry.reference || revenueEntry.description || 'No description'}
                                {revenueEntry.category && ` (${revenueEntry.category})`}
                              </span>
                              <span className="ml-2 text-green-600 font-medium">
                                +{formatCurrency(revenueEntry.amount, revenueEntry.currency)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dialog Actions */}
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button variant="outline" onClick={handleCancelLink}>
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleConfirmLink}
                      disabled={!selectedIncomeForLink}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Link Entries
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </Suspense>
      </div>
    </div>
  );
}