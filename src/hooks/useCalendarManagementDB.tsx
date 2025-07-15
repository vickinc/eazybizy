import { useState, useCallback, useEffect, useMemo } from 'react';
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
  
  
  // Actions
  setSelectedDate: (date: Date | undefined) => void;
  setCurrentMonth: (date: Date) => void;
  handleAddEvent: () => Promise<void>;
  handleEditEvent: (event: CalendarEvent) => void;
  handleUpdateEvent: () => Promise<void>;
  handleDeleteEvent: (eventId: string, onConfirm?: () => void) => Promise<void>;
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
  
  // Utility Functions (sync versions for backward compatibility)
  getEventsForDate: (date: Date) => CalendarEvent[];
  getTodaysEvents: () => CalendarEvent[];
  getUpcomingEvents: () => CalendarEvent[];
  getThisWeekEvents: () => CalendarEvent[];
  getMonthEvents: () => CalendarEvent[];
  getNotesForEvent: (eventId: string) => Note[];
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
  formatDateForInput: (date: Date) => string;
  parseDateFromInput: (dateString: string) => Date;
  
  // Backend-optimized async versions (performance optimized)
  getEventsForDateOptimized: (date: Date) => Promise<CalendarEvent[]>;
  getTodaysEventsOptimized: () => Promise<CalendarEvent[]>;
  getUpcomingEventsOptimized: () => Promise<CalendarEvent[]>;
  getThisWeekEventsOptimized: () => Promise<CalendarEvent[]>;
  getFilteredEventsOptimized: (customFilters?: CalendarEventFilters) => Promise<{ events: CalendarEvent[]; pagination: any }>;
  
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
  participants: [],
  eventScope: 'personal',
  syncEnabled: true,
  targetCalendarId: 'primary'
};

// Generate smart form data based on company context - moved inside hook for memoization

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
  
  // Memoize getSmartFormData to prevent recreating objects
  const getSmartFormData = useCallback((selectedCompany: string | number, companies: Company[]): CalendarEventFormData => {
    const isCompanyFiltered = selectedCompany !== 'all';
    const selectedCompanyObj = isCompanyFiltered ? companies.find(c => c.id === selectedCompany) : null;
    
    return {
      ...initialFormData,
      eventScope: isCompanyFiltered ? 'company' : 'personal',
      company: selectedCompanyObj?.tradingName || '',
      syncEnabled: true,
      targetCalendarId: 'primary'
    };
  }, []);

  // Memoize state setters for consistency and better dependency tracking
  const setSelectedDateMemoized = useCallback((date: Date | undefined) => {
    setSelectedDate(date);
  }, []);

  const setCurrentMonthMemoized = useCallback((date: Date) => {
    setCurrentMonth(date);
  }, []);


  // Initialize form data with smart defaults when company context changes
  useEffect(() => {
    if (!editingEvent && !isDialogOpen) {
      setFormData(getSmartFormData(selectedCompany, companies));
    }
  }, [selectedCompany, companies, editingEvent, isDialogOpen, getSmartFormData]);

  // Query Keys
  const eventsQueryKey = ['calendar', 'events', selectedCompany, filters];
  const notesQueryKey = ['calendar', 'notes', selectedCompany];
  const statisticsQueryKey = ['calendar', 'statistics', selectedCompany];

  // Fetch deleted anniversary event IDs
  const {
    data: deletedEventIdsData,
    isLoading: deletedEventIdsLoading,
    isError: deletedEventIdsError,
    error: deletedEventIdsErrorObj,
    refetch: refetchDeletedEventIds
  } = useQuery({
    queryKey: ['calendar', 'deleted-anniversary-events'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/calendar/auto-generated/deleted');
        if (!response.ok) {
          throw new Error('Failed to fetch deleted anniversary events');
        }
        const data = await response.json();
        const deletedIds = data.deletedEventIds || [];
        console.log('Fetched deleted event IDs:', deletedIds);
        return deletedIds;
      } catch (error) {
        console.warn('Could not fetch deleted anniversary events:', error);
        return [];
      }
    },
    staleTime: 0, // Always refetch when invalidated
    gcTime: 0, // No garbage collection time - always fresh
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false // No automatic refetch
  });

  const deletedEventIds = deletedEventIdsData || [];

  // Monthly Events Query - Fetch events for current month
  const {
    data: monthEventsData,
    isLoading,
    isError,
    error,
    refetch: refetchMonthEvents
  } = useQuery({
    queryKey: ['calendar', 'events', 'month', currentMonth.getFullYear(), currentMonth.getMonth(), selectedCompany],
    queryFn: () => {
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      return calendarService.getEvents(1, 200, {
        dateFrom: startOfMonth.toISOString().split('T')[0],
        dateTo: endOfMonth.toISOString().split('T')[0],
        companyId: selectedCompany !== 'all' ? selectedCompany?.toString() : undefined,
        sortBy: 'date',
        sortOrder: 'asc'
      });
    },
    staleTime: 0, // Always refetch when invalidated
    gcTime: 30 * 1000, // 30 seconds
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });


  // Upcoming Events Query - Fetch all upcoming events (no limit)
  const {
    data: upcomingEventsData,
    refetch: refetchUpcomingEvents
  } = useQuery({
    queryKey: ['calendar', 'events', 'upcoming', selectedCompany],
    queryFn: () => calendarService.getEvents(1, 5000, { // Increased limit to 5000 to get all upcoming events
      dateRange: 'upcoming',
      companyId: selectedCompany !== 'all' ? selectedCompany?.toString() : undefined,
      sortBy: 'date',
      sortOrder: 'asc'
    }),
    staleTime: 0, // Always refetch when invalidated
    gcTime: 0, // No garbage collection time - always fresh
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchInterval: false // No automatic refetch
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
      // Invalidate specific queries that might contain the new event
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'statistics'] });
      // Optionally invalidate statistics cache (don't throw if it fails)
      calendarService.invalidateStatistics().catch(err => 
        console.warn('Failed to invalidate statistics cache:', err.message)
      );
    },
    onError: (error: unknown) => {
      console.error('Create event failed:', error);
    }
  });

  const updateEventMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CalendarEventUpdateRequest }) => 
      calendarService.updateEvent(id, data),
    onSuccess: () => {
      // Invalidate and refetch specific queries that might contain the updated event
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'statistics'] });
      
      // Force refetch to ensure immediate UI update
      refetchMonthEvents();
      refetchUpcomingEvents();
      
      // Optionally invalidate statistics cache (don't throw if it fails)
      calendarService.invalidateStatistics().catch(err => 
        console.warn('Failed to invalidate statistics cache:', err.message)
      );
    },
    onError: (error: unknown) => {
      console.error('Update event failed:', error);
    }
  });

  const deleteEventMutation = useMutation({
    mutationFn: (id: string) => {
      console.log('deleteEventMutation: Starting deletion for event ID:', id);
      return calendarService.deleteEvent(id);
    },
    onSuccess: (data, variables) => {
      console.log('deleteEventMutation: Successfully deleted event:', variables);
      console.log('deleteEventMutation: Delete response:', data);
      
      // Immediately update the cache to remove the deleted event
      const monthQueryKey = ['calendar', 'events', 'month', currentMonth.getFullYear(), currentMonth.getMonth(), selectedCompany];
      const upcomingQueryKey = ['calendar', 'events', 'upcoming', selectedCompany];
      
      // Update month events cache
      queryClient.setQueryData(monthQueryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          events: oldData.events.filter((event: any) => event.id !== variables)
        };
      });
      
      // Update upcoming events cache
      queryClient.setQueryData(upcomingQueryKey, (oldData: any) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          events: oldData.events.filter((event: any) => event.id !== variables)
        };
      });
      
      // Invalidate and refetch specific queries that might contain the deleted event
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', 'month'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'events', 'upcoming'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'statistics'] });
      
      // Force refetch to ensure immediate UI update
      refetchMonthEvents();
      refetchUpcomingEvents();
      
      // Optionally invalidate statistics cache (don't throw if it fails)
      calendarService.invalidateStatistics().catch(err => 
        console.warn('Failed to invalidate statistics cache:', err.message)
      );
    },
    onError: (error: unknown, variables) => {
      console.error('Delete event failed for ID:', variables);
      console.error('Delete error details:', error);
      // Don't throw - let the UI handle this gracefully
    }
  });

  // Extract events from targeted queries and filter out ALL deleted events
  const monthEvents = useMemo(() => {
    const rawEvents = monthEventsData?.events || [];
    return rawEvents.filter(event => {
      // Filter out ALL deleted events (both anniversary and regular database events)
      if (deletedEventIds.includes(event.id)) {
        return false;
      }
      return true;
    });
  }, [monthEventsData?.events, deletedEventIds]);
  
  const upcomingEvents = useMemo(() => {
    const rawEvents = upcomingEventsData?.events || [];
    return rawEvents.filter(event => {
      // Filter out ALL deleted events (both anniversary and regular database events)
      if (deletedEventIds.includes(event.id)) {
        return false;
      }
      return true;
    });
  }, [upcomingEventsData?.events, deletedEventIds]);
  
  const notes = notesData?.notes || [];

  // Fetch anniversary events from the Calendar API
  const { 
    data: anniversaryData, 
    isLoading: anniversaryLoading, 
    error: anniversaryError 
  } = useQuery({
    queryKey: ['calendar', 'anniversary-events', 'upcoming', selectedCompany, currentMonth],
    queryFn: async () => {
      const params = new URLSearchParams({
        days: '60'
      });
      
      if (selectedCompany !== 'all') {
        params.append('companyId', selectedCompany.toString());
      }
      
      const response = await fetch(`/api/calendar/anniversary-events/upcoming?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch anniversary events');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: companies.length > 0 && !deletedEventIdsLoading
  });

  const anniversaryEvents = useMemo(() => {
    if (!anniversaryData?.events) return [];
    
    console.log('Calendar: Fetched anniversary events from API:', {
      anniversaryEventsCount: anniversaryData.events.length,
      deletedEventIdsCount: deletedEventIds.length,
      selectedCompany: selectedCompany
    });
    
    return anniversaryData.events;
  }, [anniversaryData, deletedEventIds, selectedCompany]);

  // Combine all events for backward compatibility (avoiding duplicates)
  const allEvents = useMemo(() => {
    const eventMap = new Map<string, CalendarEvent>();
    
    // Add month events
    monthEvents.forEach(event => eventMap.set(event.id, event));
    
    // Add upcoming events (may overlap with month events)
    upcomingEvents.forEach(event => eventMap.set(event.id, event));
    
    // Add anniversary events
    anniversaryEvents.forEach(event => eventMap.set(event.id, event));
    
    const result = Array.from(eventMap.values());
    console.log('allEvents computed:', { 
      monthEventsCount: monthEvents.length, 
      upcomingEventsCount: upcomingEvents.length,
      anniversaryEventsCount: anniversaryEvents.length,
      totalEvents: result.length,
      allEventIds: result.map(e => e.id),
      deletedEventIds: deletedEventIds,
      deletedEventIdsCount: deletedEventIds.length,
      filteredAnniversaryEvents: anniversaryEvents.filter(e => !deletedEventIds.includes(e.id)).length,
      timestamp: new Date().toISOString()
    });
    
    return result;
  }, [monthEvents, upcomingEvents, anniversaryEvents, deletedEventIds]);

  // Memoize filtered events to prevent unnecessary recalculations
  const filteredEvents = useMemo(() => 
    CalendarBusinessService.filterEventsByCompany(allEvents, selectedCompany, companies),
    [allEvents, selectedCompany, companies]
  );

  // Form Actions
  const updateFormField = useCallback((field: keyof CalendarEventFormData, value: string | Date | string[]) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };
      
      // Handle scope changes intelligently
      if (field === 'eventScope') {
        const isCompanyFiltered = selectedCompany !== 'all';
        const selectedCompanyObj = isCompanyFiltered ? companies.find(c => c.id === selectedCompany) : null;
        
        if (value === 'personal') {
          // Switch to personal: clear company
          newData.company = '';
        } else if (value === 'company') {
          // Switch to company: auto-fill with global company if available
          if (selectedCompanyObj) {
            newData.company = selectedCompanyObj.tradingName;
          }
        }
      }
      
      return newData;
    });
  }, [selectedCompany, companies, getSmartFormData]);

  // Dialog Management
  const resetDialog = useCallback(() => {
    setEditingEvent(null);
    setFormData(getSmartFormData(selectedCompany, companies));
    setIsDialogOpen(false);
  }, [selectedCompany, companies, getSmartFormData]);

  const openDialog = useCallback(() => {
    // Reset form to smart defaults when opening dialog
    if (!editingEvent) {
      setFormData(getSmartFormData(selectedCompany, companies));
    }
    setIsDialogOpen(true);
  }, [selectedCompany, companies, editingEvent, getSmartFormData]);

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
        companyId: formData.eventScope === 'company' && selectedCompany && selectedCompany !== 'all' ? Number(selectedCompany) : undefined,
        eventScope: formData.eventScope,
        syncEnabled: formData.syncEnabled,
        targetCalendarId: formData.targetCalendarId
      };

      await createEventMutation.mutateAsync(eventData);
      resetDialog();
    } catch (error) {
      console.error('Failed to create event:', error);
      // Error handling is already managed by React Query mutation
    }
  }, [formData, createEventMutation, resetDialog, selectedCompany]);


  const handleEditEvent = useCallback((event: CalendarEvent) => {
    // Prevent editing of auto-generated events
    if (event.isAutoGenerated) {
      console.warn('Cannot edit auto-generated events');
      return;
    }
    
    setEditingEvent(event);
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date,
      time: event.time,
      type: event.type,
      priority: event.priority,
      company: event.company || '',
      participants: event.participants || [],
      eventScope: event.eventScope || 'personal',
      syncEnabled: event.syncEnabled !== false,
      targetCalendarId: event.targetCalendarId
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

      // For regular events, update in database
      const eventData: CalendarEventUpdateRequest = {
        title: formData.title,
        description: formData.description,
        date: formData.date.toISOString(),
        time: formData.time,
        type: formData.type.toUpperCase(),
        priority: formData.priority.toUpperCase(),
        company: formData.company,
        participants: formData.participants,
        companyId: formData.eventScope === 'company' && selectedCompany && selectedCompany !== 'all' ? Number(selectedCompany) : undefined,
        eventScope: formData.eventScope,
        syncEnabled: formData.syncEnabled,
        targetCalendarId: formData.targetCalendarId
      };

      await updateEventMutation.mutateAsync({ id: editingEvent.id, data: eventData });
      resetDialog();
    } catch (error) {
      console.error('Failed to update event:', error);
      // Error handling is already managed by React Query mutation
    }
  }, [editingEvent, formData, updateEventMutation, resetDialog, selectedCompany]);

  const handleDeleteEvent = useCallback(async (eventId: string, onConfirm?: () => void) => {
    try {
      // Find the event to check if it's auto-generated
      const event = allEvents.find(e => e.id === eventId);
      
      console.log('handleDeleteEvent called:', { 
        eventId, 
        event: event ? {
          id: event.id,
          title: event.title,
          type: event.type,
          isAutoGenerated: event.isAutoGenerated
        } : null,
        allEventsCount: allEvents.length
      });
      
      if (!event) {
        console.error('Event not found in allEvents:', eventId);
        throw new Error('Event not found');
      }
      
      // Call the confirmation callback if provided
      if (onConfirm) {
        onConfirm();
      }
      
      const isAutoGenerated = event?.isAutoGenerated || event?.type === 'ANNIVERSARY';
      console.log('Event classification:', { 
        isAutoGenerated, 
        eventType: event.type, 
        eventIsAutoGenerated: event.isAutoGenerated,
        eventId: event.id,
        eventTitle: event.title
      });
      
      if (isAutoGenerated) {
        // For auto-generated events, call the deletion API
        console.log('Deleting auto-generated event:', { eventId, eventTitle: event.title, eventType: event.type });
        const response = await fetch('/api/calendar/auto-generated/delete', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId })
        });
        
        console.log('Auto-generated deletion response:', response.status, response.statusText);
        
        if (response.ok) {
          console.log('Auto-generated event deleted successfully');
          
          // Debug: Log the deletion details
          console.log('Deletion details:', {
            deletedEventId: eventId,
            eventTitle: event.title,
            eventDate: event.date,
            eventType: event.type,
            currentDeletedEventIds: deletedEventIds
          });
          
          // Wait a bit to see the response body
          const responseData = await response.json();
          console.log('Delete response data:', responseData);
          
          // Immediate cache update - add the deleted event ID to the cache
          const currentDeletedIds = queryClient.getQueryData(['calendar', 'deleted-anniversary-events']) || [];
          const newDeletedIds = [...currentDeletedIds, eventId];
          queryClient.setQueryData(['calendar', 'deleted-anniversary-events'], newDeletedIds);
          console.log('Updated deleted event IDs in cache:', newDeletedIds);
          
          // Immediate cache invalidation and removal
          queryClient.removeQueries({ queryKey: ['calendar'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
          queryClient.resetQueries({ queryKey: ['calendar'] });
          
          // Also invalidate the deleted event IDs query so home dashboard updates
          queryClient.invalidateQueries({ queryKey: ['calendar', 'deleted-anniversary-events'] });
          
          // Force immediate refetch and wait for completion
          console.log('Auto-generated event: Starting refetch after deletion');
          const refetchPromises = [
            refetchMonthEvents(),
            refetchUpcomingEvents(),
            refetchDeletedEventIds()
          ];
          
          await Promise.all(refetchPromises);
          console.log('Auto-generated event: Refetch completed');
          
          // Additional aggressive cache clearing
          setTimeout(() => {
            queryClient.removeQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['calendar'] });
            queryClient.invalidateQueries({ queryKey: ['calendar', 'deleted-anniversary-events'] });
          }, 10);
          
          // Final refetch to ensure UI is updated
          setTimeout(async () => {
            await Promise.all([
              refetchMonthEvents(),
              refetchUpcomingEvents(),
              refetchDeletedEventIds()
            ]);
          }, 100);
        } else {
          const errorData = await response.json();
          console.log('Auto-generated deletion failed:', errorData);
          throw new Error(errorData.error || 'Failed to delete auto-generated event');
        }
      } else {
        // For regular database events, try to delete normally
        console.log('Deleting regular database event:', { eventId, eventTitle: event.title, eventType: event.type });
        try {
          console.log('Calling deleteEventMutation.mutateAsync with:', eventId);
          const result = await deleteEventMutation.mutateAsync(eventId);
          console.log('Regular database deletion successful:', result);
          
          // Add the deleted event ID to the cache so it gets filtered out immediately
          const currentDeletedIds = queryClient.getQueryData(['calendar', 'deleted-anniversary-events']) || [];
          const newDeletedIds = [...currentDeletedIds, eventId];
          queryClient.setQueryData(['calendar', 'deleted-anniversary-events'], newDeletedIds);
          console.log('Added regular event to deleted IDs cache:', newDeletedIds);
          
        } catch (deleteError) {
          console.error('Regular database deletion failed:', deleteError);
          // If regular deletion fails with 404, try auto-generated deletion as fallback
          if (deleteError.message.includes('Calendar event not found')) {
            const response = await fetch('/api/calendar/auto-generated/delete', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ eventId })
            });
            
            if (response.ok) {
              // Immediate cache update - add the deleted event ID to the cache
              const currentDeletedIds = queryClient.getQueryData(['calendar', 'deleted-anniversary-events']) || [];
              const newDeletedIds = [...currentDeletedIds, eventId];
              queryClient.setQueryData(['calendar', 'deleted-anniversary-events'], newDeletedIds);
              console.log('Fallback: Updated deleted event IDs in cache:', newDeletedIds);
              
              // Immediate cache invalidation and removal
              queryClient.removeQueries({ queryKey: ['calendar'] });
              queryClient.invalidateQueries({ queryKey: ['calendar'] });
              queryClient.resetQueries({ queryKey: ['calendar'] });
              
              // Also invalidate the deleted event IDs query so home dashboard updates
              queryClient.invalidateQueries({ queryKey: ['calendar', 'deleted-anniversary-events'] });
              
              // Force immediate refetch and wait for completion
              console.log('Fallback deletion: Starting refetch after deletion');
              const refetchPromises = [
                refetchMonthEvents(),
                refetchUpcomingEvents(),
                refetchDeletedEventIds()
              ];
              
              await Promise.all(refetchPromises);
              console.log('Fallback deletion: Refetch completed');
              
              // Additional aggressive cache clearing
              setTimeout(() => {
                queryClient.removeQueries({ queryKey: ['calendar'] });
                queryClient.invalidateQueries({ queryKey: ['calendar'] });
                queryClient.invalidateQueries({ queryKey: ['calendar', 'deleted-anniversary-events'] });
              }, 10);
              
              // Final refetch to ensure UI is updated
              setTimeout(async () => {
                await Promise.all([
                  refetchMonthEvents(),
                  refetchUpcomingEvents(),
                  refetchDeletedEventIds()
                ]);
              }, 100);
            } else {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete event');
            }
          } else {
            throw deleteError;
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete event:', error);
      throw error; // Re-throw to let the caller handle the error
    }
  }, [deleteEventMutation, queryClient, allEvents, refetchMonthEvents, refetchUpcomingEvents]);

  // Filter Actions
  const setFilters = useCallback((newFilters: CalendarEventFilters) => {
    setFiltersState(newFilters);
  }, []);

  const resetFilters = useCallback(() => {
    setFiltersState(initialFilters);
  }, []);

  // Optimized utility functions using targeted data
  const getEventsForDate = useCallback((date: Date) => {
    // Always use filteredEvents for consistency - it contains all events including anniversary events
    return CalendarBusinessService.getEventsForDate(filteredEvents, date);
  }, [filteredEvents]);

  const getTodaysEvents = useCallback(() => {
    const today = new Date();
    return getEventsForDate(today);
  }, [getEventsForDate]);

  const getUpcomingEvents = useCallback(() => {
    // Use upcoming events data directly (already filtered by company in the query)
    return CalendarBusinessService.filterEventsByCompany(upcomingEvents, selectedCompany, companies);
  }, [upcomingEvents, selectedCompany, companies]);

  const getThisWeekEvents = useCallback(() => {
    return CalendarBusinessService.getThisWeekEvents(filteredEvents);
  }, [filteredEvents]);

  const getMonthEvents = useCallback(() => {
    return CalendarBusinessService.filterEventsByCompany(monthEvents, selectedCompany, companies);
  }, [monthEvents, selectedCompany, companies]);

  // Backend-optimized async versions (performance optimized)
  const getEventsForDateOptimized = useCallback(async (date: Date) => {
    try {
      const result = await calendarService.getEventsForDate(
        date,
        selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
      );
      return result.events;
    } catch (error) {
      console.warn('Backend date filtering failed, falling back to client-side:', error);
      return CalendarBusinessService.getEventsForDate(filteredEvents, date);
    }
  }, [calendarService, selectedCompany, filteredEvents]);

  const getTodaysEventsOptimized = useCallback(async () => {
    try {
      const result = await calendarService.getTodaysEvents(
        selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
      );
      return result.events;
    } catch (error) {
      console.warn('Backend today filtering failed, falling back to client-side:', error);
      return CalendarBusinessService.getTodaysEvents(filteredEvents);
    }
  }, [calendarService, selectedCompany, filteredEvents]);

  const getUpcomingEventsOptimized = useCallback(async () => {
    try {
      const result = await calendarService.getUpcomingEvents(
        selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
      );
      return result.events;
    } catch (error) {
      console.warn('Backend upcoming filtering failed, falling back to client-side:', error);
      return CalendarBusinessService.getUpcomingEvents(filteredEvents);
    }
  }, [calendarService, selectedCompany, filteredEvents]);

  const getThisWeekEventsOptimized = useCallback(async () => {
    try {
      const result = await calendarService.getThisWeekEvents(
        selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
      );
      return result.events;
    } catch (error) {
      console.warn('Backend week filtering failed, falling back to client-side:', error);
      return CalendarBusinessService.getThisWeekEvents(filteredEvents);
    }
  }, [calendarService, selectedCompany, filteredEvents]);

  // Comprehensive backend-filtered event fetching
  const getFilteredEventsOptimized = useCallback(async (customFilters?: CalendarEventFilters) => {
    try {
      const mergedFilters = {
        ...filters,
        ...customFilters,
        companyId: selectedCompany !== 'all' ? selectedCompany?.toString() : undefined
      };

      const result = await calendarService.getFilteredEvents(mergedFilters);
      return result;
    } catch (error) {
      console.warn('Backend filtered events failed, falling back to current data:', error);
      return {
        events: filteredEvents,
        pagination: {
          hasMore: false,
          nextCursor: null,
          limit: filteredEvents.length,
          count: filteredEvents.length
        }
      };
    }
  }, [calendarService, filters, selectedCompany, filteredEvents]);

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
    refetchMonthEvents();
    refetchUpcomingEvents();
    refetchDeletedEventIds();
  }, [refetchMonthEvents, refetchUpcomingEvents, refetchDeletedEventIds]);

  const invalidateCache = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['calendar'] });
  }, [queryClient]);


  const isMutating = createEventMutation.isPending || 
                     updateEventMutation.isPending || 
                     deleteEventMutation.isPending;

  // Update loading states to include deleted event IDs
  const isLoadingCombined = isLoading || deletedEventIdsLoading;
  const isErrorCombined = isError || deletedEventIdsError;
  const errorCombined = error || deletedEventIdsErrorObj;

  return {
    // Data
    events: allEvents,
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
    isLoading: isLoadingCombined,
    isError: isErrorCombined,
    error: errorCombined as Error | null,
    isMutating,
    
    // Actions
    setSelectedDate: setSelectedDateMemoized,
    setCurrentMonth: setCurrentMonthMemoized,
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
    getMonthEvents,
    getNotesForEvent,
    getPriorityColor,
    formatDate,
    formatDateForInput,
    parseDateFromInput,
    
    // Backend-optimized async versions
    getEventsForDateOptimized,
    getTodaysEventsOptimized,
    getUpcomingEventsOptimized,
    getThisWeekEventsOptimized,
    getFilteredEventsOptimized,
    
    // Data Refresh
    refetch,
    invalidateCache
  };
};