import { useState, useCallback, useMemo } from 'react';
import { 
  useQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { Note, CalendarEvent } from '@/types/calendar.types';
import { Company } from '@/types';
import { 
  NotesService, 
  NoteCreateRequest,
  NoteUpdateRequest
} from '@/services/api/notesService';
import { CalendarService } from '@/services/api/calendarService';

export interface NoteFormData {
  title: string;
  content: string;
  eventId: string;
  companyId: string;
  tags: string; // Changed from string[] to string for form input
  priority: 'low' | 'medium' | 'high';
  isStandalone: boolean;
}

export interface NotesManagementDBHook {
  // Data
  filteredNotes: Note[];
  formattedEvents: Array<{ id: string; displayText: string }>;
  
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
  
  // Utility Functions
  getPriorityColor: (priority: string) => string;
  getCompanyName: (companyId: number | undefined) => string;
  getFormattedEvent: (eventId: string | undefined, noteEvent?: Note['event']) => { id: string; title: string; date: Date; formattedDate: string; time: string; description: string; company: string } | null;
  navigateToCalendar: (date?: Date) => void;
  
  // Data Refresh
  refetch: () => void;
}

const initialFormData: NoteFormData = {
  title: '',
  content: '',
  eventId: '',
  companyId: '',
  tags: '',
  priority: 'medium',
  isStandalone: true
};

export function useNotesManagementDB(
  selectedCompany: string | number = 'all',
  companies: Company[] = []
): NotesManagementDBHook {
  const queryClient = useQueryClient();
  const notesService = new NotesService();
  const calendarService = new CalendarService();
  
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
  
  // Form State
  const [formData, setFormData] = useState<NoteFormData>(initialFormData);
  
  // Query Keys
  const notesQueryKey = ['notes', selectedCompany];
  const eventsQueryKey = ['calendar', 'events', selectedCompany];
  
  // Notes Query
  const { 
    data: notesData, 
    isLoading: notesLoading, 
    isError: notesError, 
    error: notesErrorObj,
    refetch: refetchNotes
  } = useQuery({
    queryKey: notesQueryKey,
    queryFn: () => notesService.getNotes(1, 1000, {
      companyId: selectedCompany !== 'all' ? selectedCompany.toString() : undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Events Query for dropdowns
  const { data: eventsData } = useQuery({
    queryKey: eventsQueryKey,
    queryFn: () => calendarService.getEvents(1, 1000, {
      companyId: selectedCompany !== 'all' ? selectedCompany.toString() : undefined,
    }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  const notes = notesData?.notes || [];
  const events = eventsData?.events || [];
  
  // Create Note Mutation
  const createNoteMutation = useMutation({
    mutationFn: (noteData: NoteCreateRequest) => notesService.createNote(noteData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to create note:', error);
    }
  });
  
  // Update Note Mutation
  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: NoteUpdateRequest }) => 
      notesService.updateNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
      closeDialog();
    },
    onError: (error) => {
      console.error('Failed to update note:', error);
    }
  });
  
  // Delete Note Mutation
  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => notesService.deleteNote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
    onError: (error) => {
      console.error('Failed to delete note:', error);
    }
  });
  
  // Complete/Restore Note Mutation
  const toggleNoteMutation = useMutation({
    mutationFn: ({ id, isCompleted }: { id: string; isCompleted: boolean }) => 
      notesService.updateNote(id, { isCompleted }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notesQueryKey });
    },
    onError: (error) => {
      console.error('Failed to toggle note status:', error);
    }
  });
  
  // Filtered Notes
  const filteredNotes = useMemo(() => {
    const filtered = notes.filter(note => {
      // Archive filter
      if (showArchived && !note.isCompleted) return false;
      if (!showArchived && note.isCompleted) return false;
      
      // Search filter
      if (searchTerm && !note.title.toLowerCase().includes(searchTerm.toLowerCase()) && 
          !note.content.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false;
      }
      
      // Type filter
      if (filterType !== 'all') {
        if (filterType === 'standalone' && !note.isStandalone) return false;
        if (filterType === 'linked' && note.isStandalone) return false;
      }
      
      // Priority filter
      if (filterPriority !== 'all' && note.priority !== filterPriority) {
        return false;
      }
      
      return true;
    });
    
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
  }, [notes, showArchived, searchTerm, filterType, filterPriority, sortBy]);
  
  // Formatted Events for dropdowns
  const formattedEvents = useMemo(() => {
    return events.map(event => {
      const dateStr = event.date instanceof Date 
        ? event.date.toLocaleDateString() 
        : new Date(event.date).toLocaleDateString();
      const displayText = `${event.title} - ${dateStr}${event.company ? ` (${event.company})` : ''}`;
      return {
        id: event.id,
        displayText
      };
    });
  }, [events]);
  
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
      tags: (note.tags || []).join(', '),
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
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);
  
  const handleSelectChange = useCallback((field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Parse tags from comma-separated string to array
    const tagsArray = formData.tags
      ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      : [];
    
    const noteData: NoteCreateRequest | NoteUpdateRequest = {
      title: formData.title,
      content: formData.content,
      eventId: formData.eventId || undefined,
      companyId: formData.companyId ? parseInt(formData.companyId) : undefined,
      tags: tagsArray,
      priority: formData.priority.toUpperCase(),
      isStandalone: formData.isStandalone
    };
    
    if (editingNote) {
      updateNoteMutation.mutate({ id: editingNote.id, data: noteData });
    } else {
      createNoteMutation.mutate(noteData as NoteCreateRequest);
    }
  }, [formData, editingNote, createNoteMutation, updateNoteMutation]);
  
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
  
  const getFormattedEvent = useCallback((eventId: string | undefined, noteEvent?: Note['event']) => {
    if (!eventId) return null;
    
    // First try to use event data from the note itself (if available)
    if (noteEvent) {
      const dateStr = noteEvent.date.toLocaleDateString();
      return {
        id: noteEvent.id,
        title: noteEvent.title,
        date: noteEvent.date, // Keep as Date object for navigation
        formattedDate: dateStr,
        time: noteEvent.time,
        description: '',
        company: ''
      };
    }
    
    // Fallback to formattedEvents from separate query
    const foundEvent = formattedEvents.find(event => event.id === eventId);
    if (foundEvent) {
      const dateStr = foundEvent.displayText.split(' - ')[1]?.split(' (')[0] || '';
      return {
        id: foundEvent.id,
        title: foundEvent.displayText.split(' - ')[0] || '',
        date: new Date(dateStr), // Convert to Date object for navigation
        formattedDate: dateStr,
        time: '',
        description: '',
        company: foundEvent.displayText.includes('(') ? foundEvent.displayText.split('(')[1]?.replace(')', '') || '' : ''
      };
    }
    
    return null;
  }, [formattedEvents]);
  
  const navigateToCalendar = useCallback((date?: Date) => {
    if (date) {
      localStorage.setItem('calendar-selected-date', date.toISOString());
    }
    window.location.href = '/calendar';
  }, []);
  
  const refetch = useCallback(() => {
    refetchNotes();
  }, [refetchNotes]);
  
  return {
    // Data
    filteredNotes,
    formattedEvents,
    
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
    isMutating: createNoteMutation.isPending || updateNoteMutation.isPending || 
                deleteNoteMutation.isPending || toggleNoteMutation.isPending,
    
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
    
    // Utility Functions
    getPriorityColor,
    getCompanyName,
    getFormattedEvent,
    navigateToCalendar,
    
    // Data Refresh
    refetch
  };
}