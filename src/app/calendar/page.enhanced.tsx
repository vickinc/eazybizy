"use client";

import React, { useState, useMemo } from "react";
import { CalendarDays, CalendarClock, Timer, Bell, Repeat, TrendingUp, Grid, List, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCompanyFilter } from "@/contexts/CompanyFilterContext";
import { useCalendarManagementDB } from "@/hooks/useCalendarManagementDB";
import { CalendarWidget } from "@/components/features/CalendarWidget";
import { MobileCalendarModal } from "@/components/features/MobileCalendarModal";
import { EventDialog } from "@/components/features/EventDialog";
import { VirtualEventList } from "@/components/features/VirtualEventList";
import { CalendarFilters } from "@/components/features/CalendarFilters";
import { CalendarStats } from "@/components/features/CalendarStats";
import { ErrorBoundary, ApiErrorBoundary } from "@/components/ui/error-boundary";

const getTypeIcon = (type: string) => {
  switch (type) {
    case "meeting": return <CalendarClock className="h-4 w-4" />;
    case "deadline": return <Timer className="h-4 w-4" />;
    case "renewal": return <Repeat className="h-4 w-4" />;
    default: return <Bell className="h-4 w-4" />;
  }
};

export default function CalendarPageEnhanced() {
  const { selectedCompany: globalSelectedCompany, companies } = useCompanyFilter();
  const [showFilters, setShowFilters] = useState(false);
  
  const {
    // Data
    events: allEvents,
    notes,
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
    
    // Loading & Error States
    isLoading,
    isError,
    error,
    isMutating,
    
    // Infinite Query States
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    
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
    
    // Data Refresh
    refetch
  } = useCalendarManagementDB(globalSelectedCompany, companies);
  
  // Simulate pagination interface for backward compatibility
  const paginatedEvents = allEvents;
  const pagination = {
    currentPage: 1,
    totalPages: 1,
    hasNextPage,
    hasPrevPage: false,
    total: allEvents.length
  };
  
  // Filter and view mode state for enhanced features
  const [filters, setFiltersState] = useState({
    search: '',
    type: 'all',
    priority: 'all',
    dateRange: 'all'
  });
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  
  // Enhanced filter actions
  const updateFilters = (newFilters: Partial<typeof filters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  };
  
  const clearFilters = () => {
    setFiltersState({
      search: '',
      type: 'all',
      priority: 'all',
      dateRange: 'all'
    });
  };
  
  // Pagination actions for backward compatibility
  const goToPage = (page: number) => {
    // No-op since we're using infinite scroll
  };
  
  const nextPage = () => {
    if (hasNextPage) {
      fetchNextPage();
    }
  };
  
  const prevPage = () => {
    // No-op since infinite scroll doesn't support going back
  };
  
  const loadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };
  
  // Performance info for backward compatibility
  const performanceInfo = {
    totalEvents: allEvents.length,
    filteredEvents: filteredEvents.length,
    renderTime: 0,
    isVirtualized: allEvents.length > 100
  };

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

  // Memoized event lists for different sections
  const eventSections = useMemo(() => ({
    today: getTodaysEvents(),
    thisWeek: getThisWeekEvents(),
    upcoming: getUpcomingEvents(),
    selectedDate: selectedDate ? getEventsForDate(selectedDate) : []
  }), [getTodaysEvents, getThisWeekEvents, getUpcomingEvents, getEventsForDate, selectedDate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-lime-50 flex items-center justify-center">
        <div className="text-center">
          <CalendarDays className="h-12 w-12 text-blue-500 mx-auto mb-4 animate-pulse" />
          <h3 className="text-lg font-semibold mb-2">Loading Calendar</h3>
          <p className="text-gray-600">Please wait while we load your events...</p>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary level="page">
      <div className="min-h-screen bg-lime-50 p-4 sm:max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {isFiltered ? `${selectedCompanyObj?.tradingName || 'Selected Company'} Calendar` : 'Calendar'}
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                {isFiltered ? `Events for ${selectedCompanyObj?.tradingName || 'selected company'}` : 'Manage events and deadlines across all companies'}
                <span className="ml-2 text-gray-500">
                  • {filteredEvents.length} total events • {pagination.totalPages} pages
                </span>
              </p>
            </div>
            
            {/* View Mode Toggle */}
            <div className="hidden sm:flex items-center space-x-2">
              <div className="flex items-center border rounded-lg p-1">
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="p-2"
                >
                  <CalendarDays className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className="p-2"
                >
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Controls Bar */}
        <div className="mb-6">
          <CalendarFilters
            filters={filters}
            events={allEvents}
            companies={companies}
            updateFilters={updateFilters}
            clearFilters={clearFilters}
            compact={true}
            className="mb-4"
          />
        </div>

        {/* Main Content Layout */}
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
                events={allEvents}
                isExpanded={true}
                onDateSelect={handleCalendarSelect}
                onMonthChange={setCurrentMonth}
                onToggleExpanded={() => {}}
                onAddEvent={openDialog}
                getEventsForDate={getEventsForDate}
                getPriorityColor={getPriorityColor}
                formatDate={formatDate}
              />
            </div>

            {/* Event Dialog */}
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
            />

            {/* Enhanced Filters (when expanded) */}
            {showFilters && (
              <CalendarFilters
                filters={filters}
                events={allEvents}
                companies={companies}
                updateFilters={updateFilters}
                clearFilters={clearFilters}
                compact={false}
              />
            )}

            {/* Tabbed Event Views */}
            <Tabs defaultValue="upcoming" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="today">Today</TabsTrigger>
                <TabsTrigger value="week">This Week</TabsTrigger>
                {selectedDate && (
                  <TabsTrigger value="selected">
                    Selected ({formatDate(selectedDate).split(',')[0]})
                  </TabsTrigger>
                )}
              </TabsList>

              {/* Upcoming Events */}
              <TabsContent value="upcoming">
                <ApiErrorBoundary>
                  <VirtualEventList
                    title="All Future Events"
                    description={`Upcoming events across all dates (${pagination.totalEvents} total)`}
                    events={paginatedEvents}
                    notes={notes}
                    emptyMessage="No upcoming events scheduled"
                    icon={<TrendingUp className="h-5 w-5" />}
                    showDate={true}
                    height={600}
                    virtualThreshold={50}
                    getNotesForEvent={getNotesForEvent}
                    handleEditEvent={handleEditEvent}
                    handleDeleteEvent={handleDeleteEvent}
                    getPriorityColor={getPriorityColor}
                    getTypeIcon={getTypeIcon}
                    formatDate={formatDate}
                    hasMore={pagination.hasMore}
                    loadMore={loadMore}
                    isLoading={isLoading}
                    enableVirtualization={performanceInfo.isVirtualized}
                  />
                </ApiErrorBoundary>
                
                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <Card className="mt-4">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">
                          Page {pagination.currentPage} of {pagination.totalPages} 
                          ({pagination.totalEvents} total events)
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={prevPage}
                            disabled={pagination.currentPage === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={nextPage}
                            disabled={!pagination.hasMore}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Today's Events */}
              <TabsContent value="today">
                <VirtualEventList
                  title="Today's Events"
                  description={`Events scheduled for today (${eventSections.today.length} total)`}
                  events={eventSections.today}
                  notes={notes}
                  emptyMessage="No events scheduled for today"
                  icon={<CalendarDays className="h-5 w-5" />}
                  height={400}
                  getNotesForEvent={getNotesForEvent}
                  handleEditEvent={handleEditEvent}
                  handleDeleteEvent={handleDeleteEvent}
                  getPriorityColor={getPriorityColor}
                  getTypeIcon={getTypeIcon}
                  formatDate={formatDate}
                />
              </TabsContent>

              {/* This Week's Events */}
              <TabsContent value="week">
                <VirtualEventList
                  title="This Week's Events"
                  description={`Events scheduled for this week (${eventSections.thisWeek.length} total)`}
                  events={eventSections.thisWeek}
                  notes={notes}
                  emptyMessage="No events scheduled for this week"
                  icon={<CalendarClock className="h-5 w-5" />}
                  showDate={true}
                  height={500}
                  getNotesForEvent={getNotesForEvent}
                  handleEditEvent={handleEditEvent}
                  handleDeleteEvent={handleDeleteEvent}
                  getPriorityColor={getPriorityColor}
                  getTypeIcon={getTypeIcon}
                  formatDate={formatDate}
                />
              </TabsContent>

              {/* Selected Date Events */}
              {selectedDate && (
                <TabsContent value="selected">
                  <VirtualEventList
                    title={`Events for ${formatDate(selectedDate)}`}
                    description={`${eventSections.selectedDate.length} event(s) scheduled`}
                    events={eventSections.selectedDate}
                    notes={notes}
                    emptyMessage="No events scheduled for this date"
                    height={400}
                    getNotesForEvent={getNotesForEvent}
                    handleEditEvent={handleEditEvent}
                    handleDeleteEvent={handleDeleteEvent}
                    getPriorityColor={getPriorityColor}
                    getTypeIcon={getTypeIcon}
                    formatDate={formatDate}
                  />
                </TabsContent>
              )}
            </Tabs>
          </div>

          {/* Calendar Widget Sidebar */}
          <div className="hidden lg:block flex-shrink-0 w-80">
            <div className="h-fit">
              <CalendarWidget
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                events={allEvents}
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
          events={allEvents}
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

        {/* Performance Info (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <Card className="mt-8 bg-blue-50 border-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-blue-900">Performance Metrics</CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-blue-700 space-y-1">
                <p>📊 Total events loaded: {performanceInfo.totalEventsLoaded}</p>
                <p>👀 Visible events: {performanceInfo.visibleEventsCount}</p>
                <p>🔄 Virtual scrolling: {performanceInfo.isVirtualized ? 'Active' : 'Disabled'}</p>
                <p>📄 Current page: {pagination.currentPage} of {pagination.totalPages}</p>
                <p>🎛️ View mode: {viewMode}</p>
                <p>🔍 Active filters: {Object.values(filters).filter(v => v !== 'all' && v !== '').length}</p>
                <p>⚡ Render performance: Optimized with React.memo and virtualization</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ErrorBoundary>
  );
}