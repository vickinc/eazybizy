import { useState, useCallback } from 'react';
import { 
  useQuery, 
  useInfiniteQuery, 
  useMutation, 
  useQueryClient 
} from '@tanstack/react-query';
import { CalendarEvent, Note, CalendarEventFormData } from '@/types/calendar.types';
import { Company } from '@/types';
import { 
  CalendarService, 
  CalendarEventFilters,
  CalendarEventCreateRequest,
  CalendarEventUpdateRequest,
  CalendarStatisticsResponse
} from '@/services/api/calendarService';
import { CalendarValidationService } from '@/services/business/calendarValidationService';
import { CalendarBusinessService } from '@/services/business/calendarBusinessService';

export interface CalendarManagementDBHook {
  // Data
  events: CalendarEvent[];
  notes: Note[];
  filteredEvents: CalendarEvent[];
  statistics: CalendarStatisticsResponse | undefined;
  
  // UI State
  selectedDate: Date | undefined;
  currentMonth: Date;
  isDialogOpen: boolean;
  editingEvent: CalendarEvent | null;
  isCalendarWidgetExpanded: boolean;
  isMobileCalendarOpen: boolean;
  
  // Form State
  formData: CalendarEventFormData;
  
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
  setSelectedDate: (date: Date | undefined) => void;
  setCurrentMonth: (date: Date) => void;
  handleAddEvent: () => Promise<void>;
  handleEditEvent: (event: CalendarEvent) => void;
  handleUpdateEvent: () => Promise<void>;
  handleDeleteEvent: (eventId: string) => Promise<void>;
  resetDialog: () => void;
  openDialog: () => void;
  closeDialog: () => void;
  toggleCalendarWidget: () => void;
  toggleMobileCalendar: (open?: boolean) => void;
  
  // Form Actions
  updateFormField: (field: keyof CalendarEventFormData, value: string | Date | string[]) => void;
  
  // Filter Actions
  setFilters: (filters: CalendarEventFilters) => void;
  resetFilters: () => void;
  
  // Utility Functions
  getEventsForDate: (date: Date) => CalendarEvent[];
  getTodaysEvents: () => CalendarEvent[];
  getUpcomingEvents: () => CalendarEvent[];
  getThisWeekEvents: () => CalendarEvent[];
  getNotesForEvent: (eventId: string) => Note[];
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
  formatDateForInput: (date: Date) => string;
  parseDateFromInput: (dateString: string) => Date;
  
  // Data Refresh
  refetch: () => void;
  invalidateCache: () => void;
}

const initialFormData: CalendarEventFormData = {
  title: '',
  description: '',
  date: new Date(),
  time: '09:00',
  type: 'meeting',
  priority: 'medium',
  company: '',
  participants: []
};

const initialFilters: CalendarEventFilters = {
  companyId: 'all',
  type: 'all',
  priority: 'all',
  search: '',
  dateFrom: '',
  dateTo: ''
};

export const useCalendarManagementDB = (
  selectedCompany: string | number,
  companies: Company[]
): CalendarManagementDBHook => {
  const queryClient = useQueryClient();
  const calendarService = new CalendarService();
  
  // UI State
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState<boolean>(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [isCalendarWidgetExpanded, setIsCalendarWidgetExpanded] = useState<boolean>(true);
  const [isMobileCalendarOpen, setIsMobileCalendarOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<CalendarEventFormData>(initialFormData);
  const [filters, setFiltersState] = useState<CalendarEventFilters>(initialFilters);

  // Query Keys
  const eventsQueryKey = ['calendar', 'events', selectedCompany, filters];
  const notesQueryKey = ['calendar', 'notes', selectedCompany];
  const statisticsQueryKey = ['calendar', 'statistics', selectedCompany];

  // Events Query with Infinite Scroll
  const {
    data: eventsData,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    refetch: refetchEvents
  } = useInfiniteQuery({
    queryKey: eventsQueryKey,
    queryFn: ({ pageParam }) => calendarService.getEventsWithCursor(
      pageParam,
      20,
      'desc',
      {
        ...filters,
        companyId: selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
      }
    ),
    getNextPageParam: (lastPage) => lastPage.pagination.nextCursor,
    initialPageParam: undefined as string | undefined,
    staleTime: 30000, // 30 seconds
    gcTime: 300000 // 5 minutes
  });

  // Notes Query
  const { data: notesData } = useQuery({
    queryKey: notesQueryKey,
    queryFn: () => calendarService.getNotes(1, 1000, {
      companyId: selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
    }),
    staleTime: 60000, // 1 minute
    gcTime: 300000 // 5 minutes
  });

  // Statistics Query
  const { data: statistics } = useQuery({
    queryKey: statisticsQueryKey,
    queryFn: () => calendarService.getStatistics(selectedCompany !== 'all' ? selectedCompany?.toString() : undefined),
    staleTime: 300000, // 5 minutes
    gcTime: 600000 // 10 minutes
  });

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: (eventData: CalendarEventCreateRequest) => 
      calendarService.createEvent(eventData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      // Optionally invalidate statistics cache (don't throw if it fails)
      calendarService.invalidateStatistics().catch(err => 
        console.warn('Failed to invalidate statistics cache:', err.message)
      );
    },
    onError: (error: any) => {
      console.error('Create event failed:', error);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdateRequest }) => 
      calendarService.updateEvent(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      // Optionally invalidate statistics cache (don't throw if it fails)
      calendarService.invalidateStatistics().catch(err => 
        console.warn('Failed to invalidate statistics cache:', err.message)
      );
    },
    onError: (error: any) => {
      console.error('Update event failed:', error);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => calendarService.deleteEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      // Optionally invalidate statistics cache (don't throw if it fails)
      calendarService.invalidateStatistics().catch(err => 
        console.warn('Failed to invalidate statistics cache:', err.message)
      );
    },
    onError: (error: any) => {
      console.error('Delete event failed:', error);
      // Don't throw - let the UI handle this gracefully
    }
  });

  // Extract events from infinite query data
  const events = eventsData?.pages.flatMap(page => page.events) || [];
  const notes = notesData?.notes || [];

  // Filter events based on selected company (additional client-side filtering)
  const filteredEvents = CalendarBusinessService.filterEventsByCompany(events, selectedCompany, companies);

  // Form Actions
  const updateFormField = useCallback((field: keyof CalendarEventFormData, value: string | Date | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Dialog Management
  const resetDialog = useCallback(() => {
    setEditingEvent(null);
    setFormData(initialFormData);
    setIsDialogOpen(false);
  }, []);

  const openDialog = useCallback(() => {
    setIsDialogOpen(true);
  }, []);

  const closeDialog = useCallback(() => {
    resetDialog();
  }, [resetDialog]);

  const toggleCalendarWidget = useCallback(() => {
    setIsCalendarWidgetExpanded(prev => !prev);
  }, []);

  const toggleMobileCalendar = useCallback((open?: boolean) => {
    setIsMobileCalendarOpen(open !== undefined ? open : (prev => !prev));
  }, []);

  // Event CRUD Operations
  const handleAddEvent = useCallback(async () => {
    try {
      const validation = CalendarValidationService.validateEventForm(formData);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const eventData: CalendarEventCreateRequest = {
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        time: formData.time,
        type: formData.type.toUpperCase(),
        priority: formData.priority.toUpperCase(),
        company: formData.company,
        participants: formData.participants,
        companyId: selectedCompany && selectedCompany !== 'all' ? Number(selectedCompany) : undefined
      };

      await createEventMutation.mutateAsync(eventData);
      resetDialog();
    } catch (error) {
      console.error('Failed to create event:', error);
      // Error handling is already managed by React Query mutation
    }
  }, [formData, createEventMutation, resetDialog, selectedCompany]);

  const handleEditEvent = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      type: event.type,
      priority: event.priority,
      company: event.company || '',
      participants: event.participants || []
    });
    setIsDialogOpen(true);
  }, []);

  const handleUpdateEvent = useCallback(async () => {
    if (!editingEvent) return;
    
    try {
      const validation = CalendarValidationService.validateEventForm(formData);
      
      if (!validation.isValid) {
        throw new Error(validation.errors.join(', '));
      }

      const eventData: CalendarEventUpdateRequest = {
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        time: formData.time,
        type: formData.type.toUpperCase(),
        priority: formData.priority.toUpperCase(),
        company: formData.company,
        participants: formData.participants,
        companyId: selectedCompany && selectedCompany !== 'all' ? Number(selectedCompany) : undefined
      };

      await updateEventMutation.mutateAsync({ id: editingEvent.id, data: eventData });
      resetDialog();
    } catch (error) {
      console.error('Failed to update event:', error);
      // Error handling is already managed by React Query mutation
    }
  }, [editingEvent, formData, updateEventMutation, resetDialog, selectedCompany]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEventMutation.mutateAsync(eventId);
    } catch (error) {
      console.error('Failed to delete event:', error);
      // Error handling is already managed by React Query mutation
    }
  }, [deleteEventMutation]);

  // Filter Actions
  const setFilters = useCallback((newFilters: CalendarEventFilters) => {
    setFiltersState(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  // Utility Functions
  const getEventsForDate = useCallback((date: Date) => {
    return CalendarBusinessService.getEventsForDate(filteredEvents, date);
  }, [filteredEvents]);

  const getTodaysEvents = useCallback(() => {
    return CalendarBusinessService.getTodaysEvents(filteredEvents);
  }, [filteredEvents]);

  const getUpcomingEvents = useCallback(() => {
    return CalendarBusinessService.getUpcomingEvents(filteredEvents);
  }, [filteredEvents]);

  const getThisWeekEvents = useCallback(() => {
    return CalendarBusinessService.getThisWeekEvents(filteredEvents);
  }, [filteredEvents]);

  const getNotesForEvent = useCallback((eventId: string) => {
    return CalendarBusinessService.getNotesForEvent(notes, eventId);
  }, [notes]);

  const getPriorityColor = useCallback((priority: string) => {
    return CalendarBusinessService.getPriorityColor(priority);
  }, []);

  const formatDate = useCallback((date: Date) => {
    return CalendarBusinessService.formatDate(date);
  }, []);

  const formatDateForInput = useCallback((date: Date) => {
    return CalendarBusinessService.formatDateForInput(date);
  }, []);

  const parseDateFromInput = useCallback((dateString: string) => {
    return CalendarBusinessService.parseDateFromInput(dateString);
  }, []);

  // Data Refresh
  const refetch = useCallback(() => {
    refetchEvents();
  }, [refetchEvents]);

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }, [queryClient]);

  const isMutating = createEventMutation.isPending || 
                     updateEventMutation.isPending || 
                     deleteEventMutation.isPending;

  return {
    // Data
    events,
    notes,
    filteredEvents,
    statistics,
    
    // UI State
    selectedDate,
    currentMonth,
    isDialogOpen,
    editingEvent,
    isCalendarWidgetExpanded,
    isMobileCalendarOpen,
    
    // Form State
    formData,
    
    // Loading & Error States
    isLoading,
    isError,
    error: error as Error | null,
    isMutating,
    
    // Infinite Query States
    hasNextPage: hasNextPage || false,
    isFetchingNextPage,
    fetchNextPage,
    
    // Actions
    setSelectedDate,
    setCurrentMonth,
    handleAddEvent,
    handleEditEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    resetDialog,
    openDialog,
    closeDialog,
    toggleCalendarWidget,
    toggleMobileCalendar,
    
    // Form Actions
    updateFormField,
    
    // Filter Actions
    setFilters,
    resetFilters,
    
    // Utility Functions
    getEventsForDate,
    getTodaysEvents,
    getUpcomingEvents,
    getThisWeekEvents,
    getNotesForEvent,
    getPriorityColor,
    formatDate,
    formatDateForInput,
    parseDateFromInput,
    
    // Data Refresh
    refetch,
    invalidateCache
  };
};