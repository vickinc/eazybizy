import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { Note } from '@/types/calendar.types';
import { Company } from '@/types';
import { 
  NotesService, 
  NotesFilters,
  NoteCreateRequest,
  NoteUpdateRequest,
  NotesStatisticsResponse
} from '@/services/api/notesService';

export interface NoteFormData {
  title: string;
  content: string;
  eventId: string;
  companyId: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  isStandalone: boolean;
}

export interface NotesManagementEnhancedHook {
  // Data
  notes: Note[];
  filteredNotes: Note[];
  statistics: NotesStatisticsResponse | undefined;
  
  // UI State
  isDialogOpen: boolean;
  editingNote: Note | null;
  selectedNote: Note | null;
  isDetailsDialogOpen: boolean;
  showArchived: boolean;
  
  // Filter State
  searchTerm: string;
  filterType: string;
  filterPriority: string;
  sortBy: string;
  
  // Form State
  formData: NoteFormData;
  
  // Loading & Error States
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  isMutating: boolean;
  
  // Infinite Query States
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  
  // Actions
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (id: string) => void;
  handleCompleteNote: (id: string) => void;
  handleRestoreNote: (id: string) => void;
  openDialog: () => void;
  closeDialog: () => void;
  openDetailsDialog: (note: Note) => void;
  closeDetailsDialog: () => void;
  toggleArchiveView: () => void;
  
  // Form Actions
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  handleSelectChange: (field: string, value: string | boolean) => void;
  handleSubmit: (e: React.FormEvent) => void;
  
  // Filter Actions
  setSearchTerm: (term: string) => void;
  setFilterType: (type: string) => void;
  setFilterPriority: (priority: string) => void;
  setSortBy: (sortBy: string) => void;
  setFilters: (filters: NotesFilters) => void;
  
  // Utility Functions
  getPriorityColor: (priority: string) => string;
  getCompanyName: (companyId: number | undefined) => string;
  
  // Data Refresh
  refetch: () => void;
}

const initialFormData: NoteFormData = {
  title: '',
  content: '',
  eventId: '',
  companyId: '',
  tags: [],
  priority: 'medium',
  isStandalone: true
};

export function useNotesManagementEnhanced(
  selectedCompany: string | number = 'all',
  companies: Company[] = []
): NotesManagementEnhancedHook {
  const queryClient = useQueryClient();
  const notesService = new NotesService();
  
  // UI State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  
  // Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [sortBy, setSortBy] = useState('created');
  const [filtersState, setFiltersState] = useState<NotesFilters>({});
  
  // Form State
  const [formData, setFormData] = useState<NoteFormData>(initialFormData);
  
  // Query Keys
  const notesQueryKey = ['notes', selectedCompany, filtersState];
  const statisticsQueryKey = ['notes', 'statistics', selectedCompany];
  
  // Build filters object
  const filters = useMemo(() => {
    const baseFilters: NotesFilters = {
      companyId: selectedCompany !== 'all' ? selectedCompany.toString() : undefined,
      isCompleted: showArchived ? true : false,
      ...filtersState
    };
    
    if (searchTerm) baseFilters.search = searchTerm;
    if (filterType !== 'all') {
      if (filterType === 'standalone') baseFilters.isStandalone = true;
      if (filterType === 'linked') baseFilters.isStandalone = false;
    }
    if (filterPriority !== 'all') baseFilters.priority = filterPriority;
    
    return baseFilters;
  }, [selectedCompany, showArchived, filtersState, searchTerm, filterType, filterPriority]);
  
  // Infinite Query for Notes with cursor pagination
  const {
    data: notesData,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    isLoading: notesLoading,
    isError: notesError,
    error: notesErrorObj,
    refetch: refetchNotes
  } = useInfiniteQuery({
    queryKey: notesQueryKey,
    queryFn: ({ pageParam }) => notesService.getNotesWithCursor(
      pageParam,
      20,
      'desc',
      filters
    ),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 300000 // 5 minutes
  });
  
  // Statistics Query
  const { data: statistics } = useQuery({
    queryKey: statisticsQueryKey,
    queryFn: () => notesService.getStatistics(selectedCompany?.toString()),
    staleTime: 300000, // 5 minutes
    gcTime: 600000 // 10 minutes
  });
  
  // Mutations
  const createNoteMutation = useMutation({
    mutationFn: (noteData: NoteCreateRequest) => 
      notesService.createNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: unknown) => {
      console.error('Create note failed:', error);
    }
  });
  
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NoteUpdateRequest }) => 
      notesService.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: unknown) => {
      console.error('Update note failed:', error);
    }
  });
  
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: unknown) => {
      console.error('Delete note failed:', error);
    }
  });
  
  const toggleNoteMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) => 
      notesService.updateNote(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes'] });
    },
    onError: (error: unknown) => {
      console.error('Toggle note status failed:', error);
    }
  });
  
  // Extract notes from infinite query data
  const notes = notesData?.pages.flatMap(page => page.notes) || [];
  
  // Apply client-side sorting
  const filteredNotes = useMemo(() => {
    const filtered = [...notes];
    
    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'updated':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        case 'title':
          return a.title.localeCompare(b.title);
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        default:
          return 0;
      }
    });
    
    return filtered;
  }, [notes, sortBy]);
  
  const isMutating = createNoteMutation.isPending || 
                     updateNoteMutation.isPending || 
                     deleteNoteMutation.isPending ||
                     toggleNoteMutation.isPending;
  
  // Actions
  const openDialog = useCallback(() => {
    setFormData(initialFormData);
    setEditingNote(null);
    setIsDialogOpen(true);
  }, []);
  
  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setEditingNote(null);
    setFormData(initialFormData);
  }, []);
  
  const openDetailsDialog = useCallback((note: Note) => {
    setSelectedNote(note);
    setIsDetailsDialogOpen(true);
  }, []);
  
  const closeDetailsDialog = useCallback(() => {
    setIsDetailsDialogOpen(false);
    setSelectedNote(null);
  }, []);
  
  const toggleArchiveView = useCallback(() => {
    setShowArchived(prev => !prev);
  }, []);
  
  const handleEditNote = useCallback((note: Note) => {
    setEditingNote(note);
    setFormData({
      title: note.title,
      content: note.content,
      eventId: note.eventId || '',
      companyId: note.companyId?.toString() || '',
      tags: note.tags || [],
      priority: note.priority,
      isStandalone: note.isStandalone
    });
    setIsDialogOpen(true);
  }, []);
  
  const handleDeleteNote = useCallback((id: string) => {
    if (confirm('Are you sure you want to delete this note?')) {
      deleteNoteMutation.mutate(id);
    }
  }, [deleteNoteMutation]);
  
  const handleCompleteNote = useCallback((id: string) => {
    toggleNoteMutation.mutate({ id, isCompleted: true });
  }, [toggleNoteMutation]);
  
  const handleRestoreNote = useCallback((id: string) => {
    toggleNoteMutation.mutate({ id, isCompleted: false });
  }, [toggleNoteMutation]);
  
  // Form Actions
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'tags') {
      setFormData(prev => ({
        ...prev,
        tags: value.split(',').map(tag => tag.trim()).filter(tag => tag)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  }, []);
  
  const handleSelectChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    const noteData: NoteCreateRequest | NoteUpdateRequest = {
      title: formData.title,
      content: formData.content,
      eventId: formData.eventId || undefined,
      companyId: formData.companyId ? parseInt(formData.companyId) : undefined,
      tags: formData.tags,
      priority: formData.priority.toUpperCase(),
      isStandalone: formData.isStandalone
    };
    
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, data: noteData });
    } else {
      createNoteMutation.mutate(noteData as NoteCreateRequest);
    }
  }, [formData, editingNote, createNoteMutation, updateNoteMutation]);
  
  // Filter Actions
  const setFilters = useCallback((newFilters: NotesFilters) => {
    setFiltersState(newFilters);
  }, []);
  
  // Utility Functions
  const getPriorityColor = useCallback((priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      case 'low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  }, []);
  
  const getCompanyName = useCallback((companyId: number | undefined) => {
    if (!companyId) return 'No Company';
    const company = companies.find(c => c.id === companyId);
    return company?.tradingName || company?.legalName || 'Unknown Company';
  }, [companies]);
  
  const refetch = useCallback(() => {
    refetchNotes();
  }, [refetchNotes]);
  
  return {
    // Data
    notes,
    filteredNotes,
    statistics,
    
    // UI State
    isDialogOpen,
    editingNote,
    selectedNote,
    isDetailsDialogOpen,
    showArchived,
    
    // Filter State
    searchTerm,
    filterType,
    filterPriority,
    sortBy,
    
    // Form State
    formData,
    
    // Loading & Error States
    isLoading: notesLoading,
    isError: notesError,
    error: notesErrorObj,
    isMutating,
    
    // Infinite Query States
    hasNextPage: !!hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    
    // Actions
    handleEditNote,
    handleDeleteNote,
    handleCompleteNote,
    handleRestoreNote,
    openDialog,
    closeDialog,
    openDetailsDialog,
    closeDetailsDialog,
    toggleArchiveView,
    
    // Form Actions
    handleInputChange,
    handleSelectChange,
    handleSubmit,
    
    // Filter Actions
    setSearchTerm,
    setFilterType,
    setFilterPriority,
    setSortBy,
    setFilters,
    
    // Utility Functions
    getPriorityColor,
    getCompanyName,
    
    // Data Refresh
    refetch
  };
}