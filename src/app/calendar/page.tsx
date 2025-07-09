"use client";

import React from "react";
import { CalendarDays, CalendarClock, Timer, Bell, Repeat, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useCalendarManagementDB } from "@/hooks/useCalendarManagementDB";
import { CalendarWidget } from "@/components/features/CalendarWidget";
import { MobileCalendarModal } from "@/components/features/MobileCalendarModal";
import { EventDialog } from "@/components/features/EventDialog";
import { EventList } from "@/components/features/EventList";
import { CalendarStats } from "@/components/features/CalendarStats";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useDelayedLoading } from "@/hooks/useDelayedLoading";

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
  
  // Clean up any old localStorage data on first load
  React.useEffect(() => {
    try {
      localStorage.removeItem('app-events');
      localStorage.removeItem('app-notes');
      localStorage.removeItem('calendar-migration-completed');
      localStorage.removeItem('calendar-selected-date');
    } catch (error) {
      // Ignore storage cleanup errors
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


  // Get current filter info
  const selectedCompanyObj = globalSelectedCompany !== 'all' ? companies.find(c => c.id === globalSelectedCompany) : null;
  const isFiltered = globalSelectedCompany !== 'all';

  const handleCalendarSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      updateFormField('date', date);
      openDialog();
    }
  };

  // Use delayed loading to prevent flash for cached data
  const showLoader = useDelayedLoading(isLoading);

  // Handle loading state
  if (showLoader) {
    return <LoadingScreen />;
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
        <div className="flex items-center space-x-3 mb-2">
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
      </div>

      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 relative">
        {/* Main Content Section */}
        <div className="flex-1 space-y-4 sm:space-y-6 pb-20 lg:pb-0">
          {/* Stats Cards */}
          <CalendarStats 
            filteredEvents={filteredEvents}
            getTodaysEvents={getTodaysEvents}
            getThisWeekEvents={getThisWeekEvents}
            getUpcomingEvents={getUpcomingEvents}
          />

          {/* Mobile Calendar Widget - shown under stats on mobile only */}
          <div className="lg:hidden">
            <CalendarWidget
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              events={filteredEvents}
              isExpanded={true}
              onDateSelect={handleCalendarSelect}
              onMonthChange={setCurrentMonth}
              onToggleExpanded={() => {}} // No-op since always expanded on mobile
              onAddEvent={openDialog}
              getEventsForDate={getEventsForDate}
              getPriorityColor={getPriorityColor}
              formatDate={formatDate}
            />
          </div>

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
          />

          {/* Selected Date Events */}
          {selectedDate && (
            <EventList 
              title={`Events for ${formatDate(selectedDate)}`}
              description={`${getEventsForDate(selectedDate).length} event(s) scheduled`}
              events={getEventsForDate(selectedDate)}
              emptyMessage="No events scheduled for this date"
              getNotesForEvent={getNotesForEvent}
              handleEditEvent={handleEditEvent}
              handleDeleteEvent={handleDeleteEvent}
              getPriorityColor={getPriorityColor}
              getTypeIcon={getTypeIcon}
            />
          )}

          {/* Future Events List */}
          <EventList 
            title="All Future Events"
            description={`Upcoming events across all dates (${getUpcomingEvents().length} total)`}
            events={getUpcomingEvents()}
            emptyMessage="No upcoming events scheduled"
            icon={<TrendingUp className="h-5 w-5" />}
            showDate={true}
            getNotesForEvent={getNotesForEvent}
            handleEditEvent={handleEditEvent}
            handleDeleteEvent={handleDeleteEvent}
            getPriorityColor={getPriorityColor}
            getTypeIcon={getTypeIcon}
            formatDate={formatDate}
          />
        </div>

        {/* Calendar Widget Sidebar */}
        <div className="hidden lg:block flex-shrink-0 w-80">
          <div className="h-fit">
            <CalendarWidget
              selectedDate={selectedDate}
              currentMonth={currentMonth}
              events={filteredEvents}
              isExpanded={isCalendarWidgetExpanded}
              onDateSelect={handleCalendarSelect}
              onMonthChange={setCurrentMonth}
              onToggleExpanded={toggleCalendarWidget}
              onAddEvent={openDialog}
              getEventsForDate={getEventsForDate}
              getPriorityColor={getPriorityColor}
              formatDate={formatDate}
            />
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
  );
}