import { useState, useEffect, useCallback, useMemo } from 'react';
import { JournalEntry, JournalEntryFormData } from '@/types/bookkeeping.types';
import { ChartOfAccount } from '@/types/chartOfAccounts.types';
import { Company } from '@/types/company.types';
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService';
import { ChartOfAccountsBusinessService } from '@/services/business/chartOfAccountsBusinessService';
import { ChartOfAccountsStorageService, JournalEntryStorageService } from '@/services/storage';

// Enhanced filtering interfaces
export interface JournalEntryFilters {
  searchTerm: string;
  status: 'all' | 'draft' | 'posted' | 'reversed';
  dateRange: {
    start: string;
    end: string;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
  accountIds: string[];
  createdBy: string[];
  hasReversalEntries: 'all' | 'yes' | 'no';
}

export interface JournalEntrySortConfig {
  field: 'date' | 'entryNumber' | 'description' | 'totalDebits' | 'status' | 'createdAt';
  direction: 'asc' | 'desc';
}

const initialFilters: JournalEntryFilters = {
  searchTerm: '',
  status: 'all',
  dateRange: {
    start: '',
    end: ''
  },
  amountRange: {
    min: null,
    max: null
  },
  accountIds: [],
  createdBy: [],
  hasReversalEntries: 'all'
};

const initialSort: JournalEntrySortConfig = {
  field: 'date',
  direction: 'desc'
};

export const useJournalEntriesManagement = (selectedCompany: number | 'all', companies: Company[]) => {
  // Core data
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [chartOfAccounts, setChartOfAccounts] = useState<ChartOfAccount[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // UI state
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set());
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [highlightedEntryId, setHighlightedEntryId] = useState<string>();
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [showDeleteConfirmDialog, setShowDeleteConfirmDialog] = useState(false);
  const [showDeleteSingleDialog, setShowDeleteSingleDialog] = useState(false);
  const [showReversalDialog, setShowReversalDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<JournalEntry | undefined>();
  const [entryToDelete, setEntryToDelete] = useState<JournalEntry | undefined>();
  const [entryToReverse, setEntryToReverse] = useState<JournalEntry | undefined>();
  
  // Filtering and sorting state
  const [filters, setFilters] = useState<JournalEntryFilters>(initialFilters);
  const [sortConfig, setSortConfig] = useState<JournalEntrySortConfig>(initialSort);
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load journal entries
        const companyId = selectedCompany === 'all' ? undefined : selectedCompany;
        const entries = BookkeepingBusinessService.getJournalEntries(companyId);
        setJournalEntries(entries);

        // Load chart of accounts from API or localStorage fallback
        // First try to get from ChartOfAccountsStorageService (temporary fallback)
        const allAccounts = ChartOfAccountsStorageService.getAccounts();
        const accounts = ChartOfAccountsBusinessService.getAccountsForJournalEntry(allAccounts);
        setChartOfAccounts(accounts);

        setIsLoaded(true);
      } catch (error) {
        console.error('Error loading journal entries:', error);
        setIsLoaded(true);
      }
    };

    loadData();
  }, [selectedCompany]);

  // Enhanced filtering and sorting logic
  const filteredAndSortedEntries = useMemo(() => {
    let filtered = [...journalEntries];

    // Apply search filter
    if (filters.searchTerm.trim()) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(entry => 
        entry.entryNumber.toLowerCase().includes(searchLower) ||
        entry.description.toLowerCase().includes(searchLower) ||
        (entry.reference && entry.reference.toLowerCase().includes(searchLower)) ||
        entry.lines.some(line => {
          const account = chartOfAccounts.find(acc => acc.id === line.accountId);
          return account && (
            account.name.toLowerCase().includes(searchLower) ||
            account.code.toLowerCase().includes(searchLower)
          );
        })
      );
    }

    // Apply status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(entry => entry.status === filters.status);
    }

    // Apply date range filter
    if (filters.dateRange.start) {
      filtered = filtered.filter(entry => entry.date >= filters.dateRange.start);
    }
    if (filters.dateRange.end) {
      filtered = filtered.filter(entry => entry.date <= filters.dateRange.end);
    }

    // Apply amount range filter
    if (filters.amountRange.min !== null) {
      filtered = filtered.filter(entry => entry.totalDebits >= filters.amountRange.min!);
    }
    if (filters.amountRange.max !== null) {
      filtered = filtered.filter(entry => entry.totalDebits <= filters.amountRange.max!);
    }

    // Apply account filter
    if (filters.accountIds.length > 0) {
      filtered = filtered.filter(entry => 
        entry.lines.some(line => filters.accountIds.includes(line.accountId))
      );
    }

    // Apply created by filter
    if (filters.createdBy.length > 0) {
      filtered = filtered.filter(entry => 
        entry.createdBy && filters.createdBy.includes(entry.createdBy)
      );
    }

    // Apply reversal entries filter
    if (filters.hasReversalEntries !== 'all') {
      const hasReversals = filters.hasReversalEntries === 'yes';
      filtered = filtered.filter(entry => {
        const hasReversalEntry = entry.reversalEntryId || 
          journalEntries.some(je => je.reversalEntryId === entry.id);
        return hasReversals ? hasReversalEntry : !hasReversalEntry;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortConfig.field) {
        case 'date':
          comparison = a.date.localeCompare(b.date);
          break;
        case 'entryNumber':
          comparison = a.entryNumber.localeCompare(b.entryNumber);
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description);
          break;
        case 'totalDebits':
          comparison = a.totalDebits - b.totalDebits;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        case 'createdAt':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        default:
          comparison = 0;
      }
      
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [journalEntries, filters, sortConfig, chartOfAccounts]);

  // Filter management functions
  const updateFilters = useCallback((newFilters: Partial<JournalEntryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  const updateSortConfig = useCallback((newSort: Partial<JournalEntrySortConfig>) => {
    setSortConfig(prev => ({ ...prev, ...newSort }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, []);

  const toggleSort = useCallback((field: JournalEntrySortConfig['field']) => {
    setSortConfig(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  }, []);

  // Quick filter shortcuts
  const applyQuickFilter = useCallback((type: 'today' | 'thisWeek' | 'thisMonth' | 'unbalanced' | 'draft') => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    switch (type) {
      case 'today':
        updateFilters({
          dateRange: {
            start: today.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          }
        });
        break;
      case 'thisWeek':
        updateFilters({
          dateRange: {
            start: startOfWeek.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          }
        });
        break;
      case 'thisMonth':
        updateFilters({
          dateRange: {
            start: startOfMonth.toISOString().split('T')[0],
            end: today.toISOString().split('T')[0]
          }
        });
        break;
      case 'unbalanced':
        // This would require checking if totalDebits === totalCredits
        // For now, we'll implement this as a placeholder
        break;
      case 'draft':
        updateFilters({ status: 'draft' });
        break;
    }
  }, [updateFilters]);

  // Entry management
  const handleCreateEntry = useCallback((formData: JournalEntryFormData) => {
    try {
      const newEntry = BookkeepingBusinessService.createJournalEntry(formData);
      setJournalEntries(prev => [newEntry, ...prev]);
      setShowEntryDialog(false);
      setEditingEntry(undefined);
      setHighlightedEntryId(newEntry.id);
      
      // Auto-expand the new entry
      setExpandedEntries(prev => new Set([...prev, newEntry.id]));
    } catch (error) {
      console.error('Error creating journal entry:', error);
      alert('Failed to create journal entry: ' + (error as Error).message);
    }
  }, []);

  const handleEditEntry = useCallback((entry: JournalEntry) => {
    setEditingEntry(entry);
    setShowEntryDialog(true);
  }, []);

  const handleUpdateEntry = useCallback((formData: JournalEntryFormData) => {
    if (!editingEntry) return;

    try {
      // Note: You'll need to implement updateJournalEntry in BookkeepingBusinessService
      // For now, we'll create a new entry and remove the old one
      const updatedEntry = BookkeepingBusinessService.createJournalEntry(formData);
      
      setJournalEntries(prev => 
        prev.map(entry => entry.id === editingEntry.id ? { ...updatedEntry, id: editingEntry.id } : entry)
      );
      
      setShowEntryDialog(false);
      setEditingEntry(undefined);
      setHighlightedEntryId(updatedEntry.id);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      alert('Failed to update journal entry: ' + (error as Error).message);
    }
  }, [editingEntry]);

  const handleDeleteEntry = useCallback((entry: JournalEntry) => {
    setEntryToDelete(entry);
    setShowDeleteSingleDialog(true);
  }, []);

  const confirmSingleDelete = useCallback(() => {
    if (!entryToDelete) return;

    // Note: You'll need to implement deleteJournalEntry in BookkeepingBusinessService
    setJournalEntries(prev => prev.filter(entry => entry.id !== entryToDelete.id));
    
    setShowDeleteSingleDialog(false);
    setEntryToDelete(undefined);
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      newSet.delete(entryToDelete.id);
      return newSet;
    });
  }, [entryToDelete]);

  const handleBulkDelete = useCallback(() => {
    if (selectedEntries.size === 0) return;
    setShowDeleteConfirmDialog(true);
  }, [selectedEntries]);

  const confirmBulkDelete = useCallback(() => {
    setJournalEntries(prev => prev.filter(entry => !selectedEntries.has(entry.id)));
    setSelectedEntries(new Set());
    setShowDeleteConfirmDialog(false);
  }, [selectedEntries]);

  // Bulk operations
  const handleBulkStatusChange = useCallback((status: 'draft' | 'posted') => {
    setJournalEntries(prev => 
      prev.map(entry => 
        selectedEntries.has(entry.id) 
          ? { ...entry, status }
          : entry
      )
    );
    setSelectedEntries(new Set());
  }, [selectedEntries]);

  const handleBulkDuplicate = useCallback(() => {
    const entriesToDuplicate = journalEntries.filter(entry => selectedEntries.has(entry.id));
    const duplicatedEntries: JournalEntry[] = [];

    entriesToDuplicate.forEach(entry => {
      try {
        const duplicatedEntry = BookkeepingBusinessService.createJournalEntry({
          date: entry.date,
          description: `Copy of ${entry.description}`,
          reference: entry.reference,
          lines: entry.lines.map(line => ({
            accountId: line.accountId,
            description: line.description,
            debitAmount: line.debitAmount,
            creditAmount: line.creditAmount
          })),
          companyId: entry.companyId
        });
        duplicatedEntries.push(duplicatedEntry);
      } catch (error) {
        console.error('Error duplicating entry:', error);
      }
    });

    if (duplicatedEntries.length > 0) {
      setJournalEntries(prev => [...duplicatedEntries, ...prev]);
      setSelectedEntries(new Set());
      
      // Highlight and expand the duplicated entries
      const duplicatedIds = duplicatedEntries.map(entry => entry.id);
      setHighlightedEntryId(duplicatedIds[0]);
      setExpandedEntries(prev => new Set([...prev, ...duplicatedIds]));
    }
  }, [journalEntries, selectedEntries]);

  const handleBulkReverse = useCallback(() => {
    const entriesToReverse = journalEntries.filter(entry => 
      selectedEntries.has(entry.id) && 
      entry.status === 'posted' && 
      !entry.reversalEntryId
    );

    const reversedEntries: JournalEntry[] = [];

    entriesToReverse.forEach(entry => {
      try {
        const reversalEntry = JournalEntryStorageService.reverseJournalEntry(
          entry.id, 
          'Bulk reversal operation'
        );
        if (reversalEntry) {
          reversedEntries.push(reversalEntry);
        }
      } catch (error) {
        console.error('Error reversing entry:', error);
      }
    });

    if (reversedEntries.length > 0) {
      // Reload journal entries to get the updated data
      const companyId = selectedCompany === 'all' ? undefined : selectedCompany;
      const entries = BookkeepingBusinessService.getJournalEntries(companyId);
      setJournalEntries(entries);
      
      // Highlight and expand the reversed entries
      const reversedIds = reversedEntries.map(entry => entry.id);
      setHighlightedEntryId(reversedIds[0]);
      setExpandedEntries(prev => new Set([...prev, ...reversedIds]));
      setSelectedEntries(new Set());
    }
  }, [journalEntries, selectedEntries, selectedCompany]);

  const clearSelection = useCallback(() => {
    setSelectedEntries(new Set());
  }, []);

  // Single entry duplication
  const handleDuplicateEntry = useCallback((entry: JournalEntry) => {
    try {
      const duplicatedEntry = BookkeepingBusinessService.createJournalEntry({
        date: entry.date,
        description: `Copy of ${entry.description}`,
        reference: entry.reference,
        lines: entry.lines.map(line => ({
          accountId: line.accountId,
          description: line.description,
          debitAmount: line.debitAmount,
          creditAmount: line.creditAmount
        })),
        companyId: entry.companyId
      });

      setJournalEntries(prev => [duplicatedEntry, ...prev]);
      setHighlightedEntryId(duplicatedEntry.id);
      setExpandedEntries(prev => new Set([...prev, duplicatedEntry.id]));
    } catch (error) {
      console.error('Error duplicating entry:', error);
      alert('Failed to duplicate journal entry: ' + (error as Error).message);
    }
  }, []);

  // Reversal handlers
  const handleReverseEntry = useCallback((entry: JournalEntry) => {
    setEntryToReverse(entry);
    setShowReversalDialog(true);
  }, []);

  const confirmReversal = useCallback((entry: JournalEntry, reason: string) => {
    try {
      const reversalEntry = JournalEntryStorageService.reverseJournalEntry(entry.id, reason);
      
      if (reversalEntry) {
        // Reload journal entries to get the updated data
        const companyId = selectedCompany === 'all' ? undefined : selectedCompany;
        const entries = BookkeepingBusinessService.getJournalEntries(companyId);
        setJournalEntries(entries);
        
        // Highlight the new reversal entry
        setHighlightedEntryId(reversalEntry.id);
        setExpandedEntries(prev => new Set([...prev, reversalEntry.id]));
        
      } else {
        throw new Error('Failed to create reversal entry');
      }
    } catch (error) {
      console.error('Error reversing journal entry:', error);
      alert('Failed to reverse journal entry: ' + (error as Error).message);
    } finally {
      setShowReversalDialog(false);
      setEntryToReverse(undefined);
    }
  }, [selectedCompany]);

  const handleCancelReversal = useCallback(() => {
    setShowReversalDialog(false);
    setEntryToReverse(undefined);
  }, []);

  const handleViewReversalEntry = useCallback((reversalEntryId: string) => {
    setHighlightedEntryId(reversalEntryId);
    setExpandedEntries(prev => new Set([...prev, reversalEntryId]));
    
    // Scroll to the entry if needed
    setTimeout(() => {
      const element = document.getElementById(`entry-${reversalEntryId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, []);

  // UI interactions
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

  const toggleEntrySelection = useCallback((entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedEntries.size === filteredAndSortedEntries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(filteredAndSortedEntries.map(entry => entry.id)));
    }
  }, [filteredAndSortedEntries, selectedEntries]);

  const toggleAllEntriesExpansion = useCallback(() => {
    if (expandedEntries.size === filteredAndSortedEntries.length) {
      setExpandedEntries(new Set());
    } else {
      setExpandedEntries(new Set(filteredAndSortedEntries.map(entry => entry.id)));
    }
  }, [filteredAndSortedEntries, expandedEntries]);

  const handleShowAddDialog = useCallback(() => {
    setEditingEntry(undefined);
    setShowEntryDialog(true);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setShowEntryDialog(false);
    setEditingEntry(undefined);
  }, []);

  // Utility functions
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return BookkeepingBusinessService.formatLargeCurrency(amount, currency);
  }, []);

  // Derived state
  const isAllExpanded = expandedEntries.size === filteredAndSortedEntries.length && filteredAndSortedEntries.length > 0;
  const entriesToDeleteDetails = journalEntries
    .filter(entry => selectedEntries.has(entry.id))
    .map(entry => ({
      id: entry.id,
      display: entry.description,
      amount: entry.totalDebits
    }));

  return {
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
  };
};