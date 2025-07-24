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

  // Form state for create/edit dialogs
  const [showEntryDialog, setShowEntryDialog] = useState(false);
  const [editingEntry, setEditingEntry] = useState<BookkeepingEntry | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<BookkeepingEntry | null>(null);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

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
    stats: ['entries', 'stats', filters] as const,
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
    queryFn: () => EntryApiService.getEntries(filters, pagination),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch statistics
  const { data: statsData } = useQuery({
    queryKey: queryKeys.stats,
    queryFn: () => EntryApiService.getEntryStatistics(filters),
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  });

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
    if (!stats) return null;
    
    return {
      revenue: stats.income.total,
      expenses: stats.expense.total,
      netProfit: stats.netProfit,
      accountsPayable: stats.expense.total - stats.expense.totalCogsPaid,
      totalCogs: stats.expense.totalCogs,
    };
  }, [stats]);

  // Group entries by category
  const groupedEntries = useMemo(() => {
    const grouped = entries.reduce((acc, entry) => {
      const key = `${entry.type}_${entry.category}`;
      if (!acc[key]) {
        acc[key] = {
          type: entry.type,
          category: entry.category,
          entries: [],
          total: 0,
        };
      }
      acc[key].entries.push(entry);
      acc[key].total += entry.amount;
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(grouped);
  }, [entries]);

  // Format currency helper
  const formatCurrency = useCallback((amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
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

    // Mutations
    createEntryMutation,
    updateEntryMutation,
    deleteEntryMutation,
    bulkDeleteMutation,
    bulkCreateMutation,

    // Utilities
    formatCurrency,
    highlightedEntryId,
  };
}