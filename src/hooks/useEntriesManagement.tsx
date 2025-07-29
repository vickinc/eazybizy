import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { 
  EntryApiService, 
  EntryFilters, 
  EntryPaginationOptions,
  CreateEntryData,
  UpdateEntryData,
  entryApiService 
} from '@/services/api/entryApiService';
import { BookkeepingEntry } from '@/types/bookkeeping.types';
import { BookkeepingBusinessService } from '@/services/business/bookkeepingBusinessService';

interface UseEntriesManagementProps {
  companyId?: string;
  initialFilters?: EntryFilters;
  initialPagination?: EntryPaginationOptions;
}

export function useEntriesManagement({
  companyId = 'all',
  initialFilters = {},
  initialPagination = { skip: 0, take: 20 }
}: UseEntriesManagementProps = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();


  // State management
  const [filters, setFilters] = useState<EntryFilters>({
    companyId,
    ...initialFilters,
  });

  const [pagination, setPagination] = useState<EntryPaginationOptions>(initialPagination);

  // Sync companyId prop changes with filters
  useEffect(() => {
    setFilters(prev => ({ ...prev, companyId }));
  }, [companyId]);

  // Form state for create/edit dialogs
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BookkeepingEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<BookkeepingEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  
  // Link to revenue state
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [expenseToLink, setExpenseToLink] = useState<BookkeepingEntry | null>(null);
  const [selectedIncomeForLink, setSelectedIncomeForLink] = useState('');

  // Handle URL-based highlighting
  const highlightedEntryId = searchParams.get('highlight');

  useEffect(() => {
    if (highlightedEntryId) {
      // Clear highlight after 3 seconds
      const timer = setTimeout(() => {
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('highlight');
        router.push(`?${newSearchParams.toString()}`, { scroll: false });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [highlightedEntryId, router, searchParams]);

  // Query key factory
  const queryKeys = {
    list: ['entries', 'list', filters, pagination] as const,
    detail: (id: string) => ['entries', 'detail', id] as const,
  };

  // Fetch entries
  const {
    data: entriesData,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: queryKeys.list,
    queryFn: () => {
      return EntryApiService.getEntries(filters, pagination);
    },
    staleTime: 0, // No caching
    gcTime: 0, // No caching
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  // Note: Statistics are included in the entries response, no separate query needed

  // Create entry mutation
  const createEntryMutation = useMutation({
    mutationFn: (data: CreateEntryData) => EntryApiService.createEntry(data),
    onSuccess: (newEntry) => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setShowEntryDialog(false);
      toast.success('Entry created successfully');
      
      // Navigate with highlight
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.set('highlight', newEntry.id);
      router.push(`?${newSearchParams.toString()}`, { scroll: false });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create entry');
    },
  });

  // Update entry mutation
  const updateEntryMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEntryData }) =>
      EntryApiService.updateEntry(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setShowEntryDialog(false);
      setEditingEntry(null);
      toast.success('Entry updated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update entry');
    },
  });

  // Delete entry mutation
  const deleteEntryMutation = useMutation({
    mutationFn: (id: string) => EntryApiService.deleteEntry(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setShowDeleteDialog(false);
      setEntryToDelete(null);
      toast.success('Entry deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete entry');
    },
  });

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: string[]) => EntryApiService.deleteBulkEntries(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      setShowBulkDeleteDialog(false);
      setSelectedEntries(new Set());
      toast.success('Entries deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete entries');
    },
  });

  // Bulk create mutation
  const bulkCreateMutation = useMutation({
    mutationFn: (entries: CreateEntryData[]) => EntryApiService.createBulkEntries(entries),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entries'] });
      toast.success('Entries created successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create entries');
    },
  });


  // Filter handlers
  const handleFilterChange = useCallback((newFilters: Partial<EntryFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, skip: 0 })); // Reset to first page
  }, []);

  const handlePaginationChange = useCallback((newPagination: Partial<EntryPaginationOptions>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  // Entry selection handlers
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
    if (!entriesData?.entries) return;
    
    if (selectedEntries.size === entriesData.entries.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(entriesData.entries.map(e => e.id)));
    }
  }, [entriesData?.entries, selectedEntries.size]);

  // Dialog handlers
  const handleCreateEntry = useCallback(() => {
    setEditingEntry(null);
    setShowEntryDialog(true);
  }, []);

  const handleEditEntry = useCallback((entry: BookkeepingEntry) => {
    setEditingEntry(entry);
    setShowEntryDialog(true);
  }, []);

  const handleDeleteEntry = useCallback((entry: BookkeepingEntry) => {
    setEntryToDelete(entry);
    setShowDeleteDialog(true);
  }, []);

  const handleBulkDelete = useCallback(() => {
    if (selectedEntries.size > 0) {
      setShowBulkDeleteDialog(true);
    }
  }, [selectedEntries.size]);

  // Submit handlers
  const handleSubmitEntry = useCallback((data: CreateEntryData) => {
    if (editingEntry) {
      updateEntryMutation.mutate({ id: editingEntry.id, data });
    } else {
      createEntryMutation.mutate(data);
    }
  }, [editingEntry, createEntryMutation, updateEntryMutation]);

  const confirmDelete = useCallback(() => {
    if (entryToDelete) {
      deleteEntryMutation.mutate(entryToDelete.id);
    }
  }, [entryToDelete, deleteEntryMutation]);

  const confirmBulkDelete = useCallback(() => {
    const idsToDelete = Array.from(selectedEntries);
    bulkDeleteMutation.mutate(idsToDelete);
  }, [selectedEntries, bulkDeleteMutation]);

  // Computed values
  const entries = entriesData?.entries || [];
  const { pagination: paginationData, stats } = entriesData || {};
  
  const financialSummary = useMemo(() => {
    if (!stats) {
      return null;
    }
    
    const totalCogs = stats.expense.totalCogs || 0;
    const totalCogsPaid = stats.expense.totalCogsPaid || 0;
    
    const summary = {
      revenue: stats.income.total || 0,
      expenses: stats.expense.total || 0,
      netProfit: stats.netProfit || 0,
      accountsPayable: totalCogs - totalCogsPaid,
      totalCogs: totalCogs,
    };
    
    return summary;
  }, [stats, filters]);

  // Group entries by category
  const groupedEntries = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      const key = `${entry.type}_${entry.category}`;
      if (!acc[key]) {
        acc[key] = {
          key,
          name: entry.category,
          type: entry.type,
          category: entry.category,
          entries: [],
          totalIncome: 0,
          totalExpenses: 0,
        };
      }
      acc[key].entries.push(entry);
      
      // Add to appropriate total based on entry type
      if (entry.type === 'revenue') {
        acc[key].totalIncome += entry.amount;
      } else if (entry.type === 'expense') {
        acc[key].totalExpenses += entry.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped);
  }, [entries]);

  // Link to revenue handlers
  const handleLinkToIncome = useCallback((expenseEntry: BookkeepingEntry) => {
    const availableIncomeEntries = BookkeepingBusinessService.getAvailableIncomeEntriesForLinking(entries, expenseEntry);

    if (availableIncomeEntries.length === 0) {
      toast.error('No revenue entries available to link to');
      return;
    }

    setExpenseToLink(expenseEntry);
    setSelectedIncomeForLink('');
    setShowLinkDialog(true);
  }, [entries]);

  const handleConfirmLink = useCallback(() => {
    if (!expenseToLink || !selectedIncomeForLink) {
      toast.error('Please select a revenue entry to link to');
      return;
    }

    const selectedIncomeEntry = entries.find(entry => entry.id === selectedIncomeForLink);
    if (!selectedIncomeEntry) {
      toast.error('Selected revenue entry not found');
      return;
    }

    // Update the entry with linkedIncomeId using the update mutation
    updateEntryMutation.mutate({
      id: expenseToLink.id,
      data: { linkedIncomeId: selectedIncomeEntry.id }
    }, {
      onSuccess: () => {
        // Refetch entries to show updated linked status
        refetch();
        toast.success(`Expense linked to revenue entry: ${selectedIncomeEntry.reference || selectedIncomeEntry.description}`);
      },
      onError: (error) => {
        console.error('Failed to link entries:', error);
        toast.error('Failed to link entries. Please try again.');
      }
    });
    
    setShowLinkDialog(false);
    setExpenseToLink(null);
    setSelectedIncomeForLink('');
  }, [expenseToLink, selectedIncomeForLink, entries, updateEntryMutation, refetch]);

  const handleCancelLink = useCallback(() => {
    setShowLinkDialog(false);
    setExpenseToLink(null);
    setSelectedIncomeForLink('');
  }, []);

  const handleViewRelatedIncomeEntry = useCallback((incomeId: string) => {
    // Navigate to highlight the income entry
    const newSearchParams = new URLSearchParams(searchParams);
    newSearchParams.set('highlight', incomeId);
    router.push(`?${newSearchParams.toString()}`, { scroll: false });
    
    // Scroll to the entry after navigation
    setTimeout(() => {
      const element = document.getElementById(`entry-${incomeId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  }, [router, searchParams]);


  // Format currency helper
  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }, []);

  // Simple COGS currency helper - for now just return the entry currency
  const getCOGSCurrency = useCallback((entry: BookkeepingEntry) => {
    return entry.currency || 'USD';
  }, []);

  return {
    // Data
    entries,
    groupedEntries,
    financialSummary,
    stats,
    isLoading,
    isFetching,
    error,

    // Pagination
    pagination: paginationData,
    currentPage: Math.floor((pagination.skip || 0) / (pagination.take || 20)) + 1,
    totalPages: Math.ceil((paginationData?.total || 0) / (pagination.take || 20)),

    // Filters
    filters,
    handleFilterChange,
    handlePaginationChange,

    // Selection
    selectedEntries,
    toggleEntrySelection,
    toggleSelectAll,

    // Dialogs
    showEntryDialog,
    setShowEntryDialog,
    editingEntry,
    showDeleteDialog,
    setShowDeleteDialog,
    entryToDelete,
    showBulkDeleteDialog,
    setShowBulkDeleteDialog,

    // Actions
    handleCreateEntry,
    handleEditEntry,
    handleDeleteEntry,
    handleBulkDelete,
    handleSubmitEntry,
    confirmDelete,
    confirmBulkDelete,
    refetch,

    // Link actions
    handleLinkToIncome,
    handleConfirmLink,
    handleCancelLink,
    handleViewRelatedIncomeEntry,
    showLinkDialog,
    setShowLinkDialog,
    expenseToLink,
    selectedIncomeForLink,
    setSelectedIncomeForLink,


    // Mutations
    createEntryMutation,
    updateEntryMutation,
    deleteEntryMutation,
    bulkDeleteMutation,
    bulkCreateMutation,

    // Utilities
    formatCurrency,
    getCOGSCurrency,
    highlightedEntryId,
  };
}