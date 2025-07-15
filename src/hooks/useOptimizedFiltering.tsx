import { useMemo, useCallback, useRef, useEffect } from 'react';
import { Note } from '@/types/calendar.types';

// Threshold for using web worker (only for very large datasets)
const WEB_WORKER_THRESHOLD = 1000;

export interface FilterOptions {
  showArchived: boolean;
  searchTerm: string;
  filterType: string;
  filterPriority: string;
  sortBy: string;
}

export interface UseOptimizedFilteringResult {
  filteredNotes: Note[];
  isFiltering: boolean;
  shouldUseWebWorker: boolean;
}

export function useOptimizedFiltering(
  notes: Note[],
  filters: FilterOptions
): UseOptimizedFilteringResult {
  const workerRef = useRef<Worker | null>(null);
  const shouldUseWebWorker = notes.length > WEB_WORKER_THRESHOLD;
  
  // Initialize web worker for large datasets
  useEffect(() => {
    if (shouldUseWebWorker && !workerRef.current) {
      // For now, we'll use the main thread implementation
      // Web worker can be added later if needed for 5000+ notes
      workerRef.current = null;
    }
    
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
    };
  }, [shouldUseWebWorker]);

  // Main thread filtering with optimizations
  const filteredNotes = useMemo(() => {
    // Early return for empty datasets
    if (!notes || notes.length === 0) return [];
    
    // For small datasets, use simple filtering
    if (notes.length < 100) {
      return notes.filter(note => {
        // Archive filter
        if (filters.showArchived && !note.isCompleted) return false;
        if (!filters.showArchived && note.isCompleted) return false;
        
        // Search filter
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const titleMatch = note.title.toLowerCase().includes(searchLower);
          const contentMatch = note.content.toLowerCase().includes(searchLower);
          if (!titleMatch && !contentMatch) return false;
        }
        
        // Type filter
        if (filters.filterType !== 'all') {
          if (filters.filterType === 'standalone' && !note.isStandalone) return false;
          if (filters.filterType === 'linked' && note.isStandalone) return false;
        }
        
        // Priority filter
        if (filters.filterPriority !== 'all' && note.priority !== filters.filterPriority) {
          return false;
        }
        
        return true;
      }).sort((a, b) => {
        // Simple sorting for small datasets
        switch (filters.sortBy) {
          case 'created':
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          case 'updated':
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          case 'title':
            return a.title.localeCompare(b.title);
          case 'priority':
            const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
            return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
          default:
            return 0;
        }
      });
    }
    
    // For larger datasets, use optimized filtering with chunking
    const chunkSize = 100;
    const chunks: Note[][] = [];
    
    for (let i = 0; i < notes.length; i += chunkSize) {
      chunks.push(notes.slice(i, i + chunkSize));
    }
    
    const filtered = chunks.reduce((acc: Note[], chunk: Note[]) => {
      const chunkFiltered = chunk.filter(note => {
        // Archive filter (most selective first)
        if (filters.showArchived && !note.isCompleted) return false;
        if (!filters.showArchived && note.isCompleted) return false;
        
        // Search filter with early termination
        if (filters.searchTerm) {
          const searchLower = filters.searchTerm.toLowerCase();
          const titleMatch = note.title.toLowerCase().includes(searchLower);
          const contentMatch = !titleMatch && note.content.toLowerCase().includes(searchLower);
          if (!titleMatch && !contentMatch) return false;
        }
        
        // Type filter
        if (filters.filterType !== 'all') {
          if (filters.filterType === 'standalone' && !note.isStandalone) return false;
          if (filters.filterType === 'linked' && note.isStandalone) return false;
        }
        
        // Priority filter
        if (filters.filterPriority !== 'all' && note.priority !== filters.filterPriority) {
          return false;
        }
        
        return true;
      });
      
      return acc.concat(chunkFiltered);
    }, []);
    
    // Sort the filtered results
    return filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
          return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
        default:
          return 0;
      }
    });
  }, [notes, filters]);
  
  return {
    filteredNotes,
    isFiltering: false, // Could be used for loading states in future
    shouldUseWebWorker
  };
}