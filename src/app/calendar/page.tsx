"use client";

import React, { useState, useCallback, useMemo } from "react";
import dynamic from 'next/dynamic';
import { 
  CalendarDays, 
  CalendarClock, 
  Timer, 
  Bell, 
  Repeat, 
  TrendingUp, 
  Settings, 
  Calendar, 
  CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useCalendarManagementDB } from "@/hooks/useCalendarManagementDB";
import { useQuery } from "@tanstack/react-query";
import { CalendarWidget } from "@/components/features/CalendarWidget";
// Dynamic import for MobileCalendarModal to reduce bundle size
const MobileCalendarModal = dynamic(
  () => import('@/components/features/MobileCalendarModal').then(mod => ({ default: mod.MobileCalendarModal })),
  { 
    ssr: false, // Client-side only modal
    loading: () => null // No loading state needed for mobile modal
  }
);
// Dynamic import for EventDialog to reduce bundle size
const EventDialog = dynamic(
  () => import('@/components/features/EventDialog').then(mod => ({ default: mod.EventDialog })),
  { 
    ssr: false, // Client-side only modal
    loading: () => <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
  }
);
import { EventList } from "@/components/features/EventList";
import { VirtualizedEventList } from "@/components/features/VirtualizedEventList";
import { PaginatedEventList } from "@/components/features/PaginatedEventList";
// Dynamic import for CalendarSettings to reduce bundle size
const CalendarSettings = dynamic(
  () => import('@/components/features/CalendarSettings').then(mod => ({ default: mod.CalendarSettings })),
  { 
    ssr: false, // Client-side only modal
    loading: () => <div className="animate-pulse bg-gray-200 h-32 w-full rounded"></div>
  }
);
// Dynamic import for GoogleCalendarDialog to reduce bundle size
const GoogleCalendarDialog = dynamic(
  () => import('@/components/features/GoogleCalendarDialog').then(mod => ({ default: mod.GoogleCalendarDialog })),
  { 
    ssr: false, // Client-side only modal
    loading: () => <div className="animate-pulse bg-gray-200 h-8 w-8 rounded"></div>
  }
);
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

// Calendar Page Skeleton Component
const CalendarPageSkeleton = () => (
  <div className="min-h-screen bg-lime-50">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      
      {/* Header Skeleton */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <div className="h-6 w-6 sm:h-8 sm:w-8 bg-blue-200 rounded animate-pulse"></div>
            </div>
            <div>
              <div className="h-6 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
          <div className="flex gap-2">
            <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content - Calendar and Events Side by Side */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Calendar Widget Skeleton */}
        <div className="flex-1 lg:flex-none lg:w-1/2">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
              <div className="flex gap-2">
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
            
            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1 mb-4">
              {/* Day headers */}
              {[...Array(7)].map((_, i) => (
                <div key={`header-${i}`} className="h-6 bg-gray-100 rounded animate-pulse"></div>
              ))}
              {/* Calendar dates */}
              {[...Array(35)].map((_, i) => (
                <div key={`date-${i}`} className="h-8 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            
            {/* Add Event Button */}
            <div className="h-10 w-full bg-blue-200 rounded animate-pulse"></div>
          </div>
        </div>

        {/* Paginated Event List Skeleton */}
        <div className="flex-1 lg:w-1/2">
          <div className="bg-white rounded-lg shadow-sm">
            {/* Card Header */}
            <div className="p-6 border-b">
              <div className="flex items-center mb-2">
                <div className="h-5 w-5 bg-gray-200 rounded animate-pulse mr-2"></div>
                <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse ml-2"></div>
              </div>
              <div className="h-4 w-48 bg-gray-200 rounded animate-pulse"></div>
            </div>
            
            {/* Card Content */}
            <div className="p-6">
              {/* Search Bar */}
              <div className="relative mb-4">
                <div className="h-10 w-full bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              {/* Event Items */}
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="flex-1">
                          <div className="h-5 w-56 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-2"></div>
                          <div className="h-3 w-72 bg-gray-200 rounded animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-6 w-16 bg-yellow-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Pagination Skeleton */}
              <div className="mt-6 pt-4 border-t">
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-20 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="h-4 w-16 bg-gray-200 rounded animate-pulse"></div>
                    <div className="flex items-center space-x-1">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mobile Floating Action Button Skeleton */}
      <div className="lg:hidden fixed bottom-4 right-4">
        <div className="h-12 w-12 bg-blue-200 rounded-full animate-pulse"></div>
      </div>
    </div>
  </div>
);

const getTypeIcon = (type: string) => {
  switch (type) {
    case "meeting": return <CalendarClock className="h-4 w-4" />;
    case "deadline": return <Timer className="h-4 w-4" />;
    case "renewal": return <Repeat className="h-4 w-4" />;
    case "anniversary": return <TrendingUp className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

export default function CalendarPage() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGoogleCalendarOpen, setIsGoogleCalendarOpen] = useState(false);
  const [deleteUpdateTrigger, setDeleteUpdateTrigger] = useState(0);
  // Use React Query for sync status with caching and deduplication
  const { data: syncStatus, refetch: refetchSyncStatus } = useQuery({
    queryKey: ['calendar-sync-status'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/sync/google');
      if (!response.ok) {
        throw new Error('Failed to fetch sync status');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    refetchOnWindowFocus: false,
  });
  
  // Clean up any old localStorage data on first load - deferred to idle time
  React.useEffect(() => {
    const cleanupStorage = () => {
      try {
        localStorage.removeItem('app-events');
        localStorage.removeItem('app-notes');
        localStorage.removeItem('calendar-migration-completed');
        localStorage.removeItem('calendar-selected-date');
      } catch (error) {
        // Ignore storage cleanup errors
      }
    };

    if (typeof window !== 'undefined') {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(cleanupStorage);
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(cleanupStorage, 100);
      }
    }
  }, []);
  
  const {
    // Data
    events,
    filteredEvents,
    
    // UI State
    selectedDate,
    currentMonth,
    isDialogOpen,
    editingEvent,
    isCalendarWidgetExpanded,
    isMobileCalendarOpen,
    
    // Form State
    formData,
    
    // Actions
    setSelectedDate,
    setCurrentMonth,
    handleAddEvent,
    handleEditEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    openDialog,
    closeDialog,
    toggleCalendarWidget,
    toggleMobileCalendar,
    
    // Form Actions
    updateFormField,
    
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
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    isMutating,
    
    // Data Refresh
    refetch
  } = useCalendarManagementDB(globalSelectedCompany, companies);


  // Get current filter info - memoized to prevent unnecessary re-renders
  const selectedCompanyObj = useMemo(() => 
    globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null, 
    [globalSelectedCompany, companies]
  );
  const isFiltered = useMemo(() => 
    globalSelectedCompany !== 'all', 
    [globalSelectedCompany]
  );

  const handleCalendarSelect = useCallback((date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateFormField('date', date);
    }
  }, [setSelectedDate, updateFormField]);

  const handleGoogleCalendarChange = useCallback((open: boolean) => {
    setIsGoogleCalendarOpen(open);
    if (!open) {
      // Refresh sync status when dialog closes
      refetchSyncStatus();
    }
  }, [refetchSyncStatus]);

  const handleOpenGoogleCalendar = useCallback(() => {
    setIsGoogleCalendarOpen(true);
  }, []);

  const handleOpenSettings = useCallback(() => {
    setIsSettingsOpen(true);
  }, []);

  const noOpCallback = useCallback(() => {}, []);

  // Pre-fetch modal data on hover/focus for better UX
  const handleGoogleCalendarHover = useCallback(() => {
    // Pre-warm Google Calendar sync status if not already cached
    if (!syncStatus) {
      refetchSyncStatus();
    }
  }, [syncStatus, refetchSyncStatus]);

  const handleSettingsHover = useCallback(() => {
    // Pre-warm any settings data if needed
    // This is a placeholder for future settings data pre-fetching
  }, []);

  // Wrapped delete handler to trigger UI updates
  const handleDeleteEventWithUpdate = useCallback(async (eventId: string, onConfirm?: () => void) => {
    try {
      console.log('CalendarPage: Calling handleDeleteEvent with:', eventId);
      const result = await handleDeleteEvent(eventId, onConfirm);
      console.log('CalendarPage: Delete completed, triggering UI update');
      
      // Small delay to ensure all async operations complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Trigger UI update after successful deletion
      setDeleteUpdateTrigger(prev => prev + 1);
      console.log('CalendarPage: UI update trigger set');
      
      return result;
    } catch (error) {
      console.error('CalendarPage: Delete failed:', error);
      throw error;
    }
  }, [handleDeleteEvent]);

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state with progressive skeleton
  if (showLoader) {
    return <CalendarPageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-lime-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error State */}
        {isError && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertDescription>
                Failed to load calendar data: {error?.message || 'Unknown error'}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => refetch()}
                  className="ml-2"
                >
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {isFiltered ? `${selectedCompanyObj?.tradingName || 'Selected Company'} Calendar` : 'Calendar'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {isFiltered ? `Events for ${selectedCompanyObj?.tradingName || 'selected company'}` : 'Manage events and deadlines across all companies'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            {syncStatus?.googleSyncEnabled ? (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleOpenGoogleCalendar}
                onMouseEnter={handleGoogleCalendarHover}
                onFocus={handleGoogleCalendarHover}
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="hidden sm:inline">{syncStatus.googleEmail}</span>
                <span className="sm:hidden">Google</span>
              </Button>
            ) : (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onClick={handleOpenGoogleCalendar}
                onMouseEnter={handleGoogleCalendarHover}
                onFocus={handleGoogleCalendarHover}
              >
                <Calendar className="h-4 w-4" />
                <span className="hidden sm:inline">Connect Google Calendar</span>
                <span className="sm:hidden">Google</span>
              </Button>
            )}
            <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                size="sm" 
                className="flex items-center gap-2"
                onMouseEnter={handleSettingsHover}
                onFocus={handleSettingsHover}
              >
                <Settings className="h-4 w-4" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Calendar Settings</DialogTitle>
                <DialogDescription>
                  Manage your calendar integration, timezone settings, and synchronization options.
                </DialogDescription>
              </DialogHeader>
              <CalendarSettings />
            </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Google Calendar Dialog */}
        <GoogleCalendarDialog 
          open={isGoogleCalendarOpen} 
          onOpenChange={handleGoogleCalendarChange}
        />

        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
          {/* Main Content Section */}
          <div className="flex-1 space-y-4 sm:space-y-6 pb-20 lg:pb-0">

          <EventDialog 
            isDialogOpen={isDialogOpen}
            editingEvent={editingEvent}
            formData={formData}
            companies={companies}
            updateFormField={updateFormField}
            handleAddEvent={handleAddEvent}
            handleUpdateEvent={handleUpdateEvent}
            openDialog={openDialog}
            closeDialog={closeDialog}
            formatDateForInput={formatDateForInput}
            parseDateFromInput={parseDateFromInput}
            isMutating={isMutating}
            selectedCompany={globalSelectedCompany}
          />


          {/* Calendar and Events Side by Side */}
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Calendar Widget */}
            <div className="flex-1 lg:flex-none lg:w-1/2">
              <CalendarWidget
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                events={filteredEvents}
                onDateSelect={handleCalendarSelect}
                onMonthChange={setCurrentMonth}
                onAddEvent={openDialog}
                getEventsForDate={getEventsForDate}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
                handleEditEvent={handleEditEvent}
                handleDeleteEvent={handleDeleteEventWithUpdate}
              />
            </div>

            {/* Future Events List - Paginated with Search */}
            <div className="flex-1 lg:w-1/2">
              <PaginatedEventList 
                key={`upcoming-events-${getUpcomingEvents().length}-${deleteUpdateTrigger}`} // Force re-render when events change
                title="All Future Events"
                description={`Upcoming events across all dates (${getUpcomingEvents().length} total)`}
                events={getUpcomingEvents()}
                emptyMessage="No upcoming events scheduled"
                icon={<TrendingUp className="h-5 w-5" />}
                showDate={true}
                getNotesForEvent={getNotesForEvent}
                handleEditEvent={handleEditEvent}
                handleDeleteEvent={handleDeleteEventWithUpdate}
                getPriorityColor={getPriorityColor}
                getTypeIcon={getTypeIcon}
                formatDate={formatDate}
                itemsPerPage={3}
              />
            </div>
          </div>
        </div>
        </div>

        {/* Mobile Calendar Modal */}
      <MobileCalendarModal
        selectedDate={selectedDate}
        currentMonth={currentMonth}
        events={filteredEvents}
        isOpen={isMobileCalendarOpen}
        onOpenChange={toggleMobileCalendar}
        onDateSelect={handleCalendarSelect}
        onMonthChange={setCurrentMonth}
        onAddEvent={openDialog}
        getEventsForDate={getEventsForDate}
        getPriorityColor={getPriorityColor}
        formatDate={formatDate}
      />

      {/* Mobile Floating Action Button */}
      <div className="lg:hidden fixed bottom-4 right-4 z-50">
        <Button
          onClick={toggleMobileCalendar}
          size="lg"
          className="rounded-full h-12 w-12 shadow-lg"
        >
          <CalendarDays className="h-5 w-5" />
        </Button>
      </div>

      </div>
    </div>
  </div>
  );
}