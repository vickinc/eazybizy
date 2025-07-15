import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EventItem } from './EventItem';
import { CalendarEvent, Note } from '@/types/calendar.types';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from "sonner";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";

interface PaginatedEventListProps {
  title: string;
  description: string;
  events: CalendarEvent[];
  emptyMessage?: string;
  icon?: React.ReactNode;
  showDate?: boolean;
  getNotesForEvent: (eventId: string) => Note[];
  handleEditEvent: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  formatDate?: (date: Date) => string;
  className?: string;
  itemsPerPage?: number;
}

export const PaginatedEventList: React.FC<PaginatedEventListProps> = ({
  title,
  description,
  events,
  emptyMessage = "No events found",
  icon,
  showDate = false,
  getNotesForEvent,
  handleEditEvent,
  handleDeleteEvent,
  getPriorityColor,
  getTypeIcon,
  formatDate,
  className = "",
  itemsPerPage = 3
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Safety check for events array
  const safeEvents = events || [];

  // Filter events based on search term - include refreshTrigger to force re-calculation
  const filteredEvents = useMemo(() => {
    console.log('PaginatedEventList: Recalculating filteredEvents', { 
      eventsCount: safeEvents.length, 
      searchTerm, 
      refreshTrigger 
    });
    
    if (!searchTerm.trim()) {
      return safeEvents;
    }
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return safeEvents.filter(event => 
      event.title.toLowerCase().includes(lowerSearchTerm) ||
      event.description?.toLowerCase().includes(lowerSearchTerm) ||
      event.company?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [safeEvents, searchTerm, refreshTrigger]);

  // Calculate pagination - memoized to ensure React detects changes
  const { totalPages, currentEvents } = useMemo(() => {
    console.log('PaginatedEventList: Recalculating pagination', { 
      filteredEventsCount: filteredEvents.length, 
      currentPage, 
      itemsPerPage,
      refreshTrigger 
    });
    
    const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentEvents = filteredEvents.slice(startIndex, endIndex);
    
    return { totalPages, currentEvents };
  }, [filteredEvents, currentPage, itemsPerPage, refreshTrigger]);

  // Reset to first page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Reset to first page when events change (e.g., after deletion)
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredEvents.length, currentPage, totalPages]);

  // Watch for changes in events array to trigger refresh (only when length changes)
  useEffect(() => {
    console.log('PaginatedEventList: Events count changed, triggering refresh', { 
      eventsCount: safeEvents.length
    });
    setRefreshTrigger(prev => prev + 1);
  }, [safeEvents.length]);

  // Navigation handlers
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };

  // Handle delete with confirmation toast - returns a Promise
  const handleDeleteWithConfirmation = useCallback((event: CalendarEvent): Promise<void> => {
    return new Promise((resolve, reject) => {
      toast.custom((t) => (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-md">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <Trash2 className="h-5 w-5 text-red-500" />
              <h3 className="text-sm font-medium text-gray-900">Delete Event</h3>
            </div>
            <p className="text-sm text-gray-600">
              Are you sure you want to delete "<span className="font-medium">{event.title}</span>"?
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.dismiss(t);
                  reject(new Error('User cancelled deletion'));
                }}
                className="text-xs"
              >
                Cancel
              </Button>
              <button
                onClick={async () => {
                  toast.dismiss(t);
                  setDeletingEventId(event.id);
                  
                  try {
                    // Actually call the delete function after user confirms
                    console.log('PaginatedEventList: Calling handleDeleteEvent with:', event.id);
                    console.log('PaginatedEventList: Event details:', {
                      id: event.id,
                      title: event.title,
                      type: event.type,
                      isAutoGenerated: event.isAutoGenerated,
                      date: event.date
                    });
                    
                    const result = await handleDeleteEvent(event.id, () => {
                      console.log('PaginatedEventList: Delete confirmed callback called');
                    });
                    console.log('PaginatedEventList: Delete result:', result);
                    setDeletingEventId(null);
                    
                    // Force immediate refresh after successful deletion
                    console.log('PaginatedEventList: Forcing refresh after deletion');
                    setRefreshTrigger(prev => prev + 1);
                    
                    resolve();
                  } catch (error) {
                    console.error('PaginatedEventList: Delete error:', error);
                    setDeletingEventId(null);
                    reject(error);
                  }
                }}
                className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md border-0 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      ), { duration: 0, position: 'top-center' });
    });
  }, [handleDeleteEvent]);

  // Memoize event items to prevent unnecessary re-renders
  const eventItems = useMemo(() => {
    console.log('PaginatedEventList: Rendering event items', {
      currentEventsCount: currentEvents.length,
      currentEventIds: currentEvents.map(e => e.id),
      refreshTrigger,
      timestamp: new Date().toISOString()
    });
    
    return currentEvents.map((event) => {
      const eventNotes = getNotesForEvent(event.id);
      return (
        <EventItem
          key={`${event.id}-${refreshTrigger}`} // Force re-render with refresh trigger
          event={event}
          eventNotes={eventNotes}
          handleEditEvent={handleEditEvent}
          handleDeleteEvent={async (eventId: string) => {
            // Find the event by ID and call confirmation function
            const eventToDelete = currentEvents.find(e => e.id === eventId);
            if (eventToDelete) {
              try {
                await handleDeleteWithConfirmation(eventToDelete);
                console.log('PaginatedEventList: Deletion completed successfully');
                return Promise.resolve();
              } catch (error) {
                console.error('PaginatedEventList: Deletion failed:', error);
                throw error;
              }
            } else {
              console.error('PaginatedEventList: Event not found:', eventId);
              throw new Error('Event not found');
            }
          }}
          getPriorityColor={getPriorityColor}
          getTypeIcon={getTypeIcon}
          formatDate={formatDate}
          showDate={showDate}
          className={showDate ? "p-4 bg-white rounded-lg border border-gray-200 shadow-sm" : ""}
        />
      );
    });
  }, [currentEvents, getNotesForEvent, handleEditEvent, handleDeleteWithConfirmation, getPriorityColor, getTypeIcon, formatDate, showDate, refreshTrigger]);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'})
          </span>
        </CardTitle>
        <CardDescription>
          {searchTerm ? `Showing ${filteredEvents.length} of ${safeEvents.length} events` : description}
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search events..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Events List */}
        {filteredEvents.length === 0 ? (
          <div className="text-center py-8">
            {searchTerm ? (
              <div>
                <p className="text-gray-500 mb-2">No events found matching "{searchTerm}"</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSearchTerm('')}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              <p className="text-gray-500">{emptyMessage}</p>
            )}
          </div>
        ) : (
          <>
            <div key={`events-list-${refreshTrigger}`} className={`space-y-${showDate ? '6' : '3'}`}>
              {eventItems}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t">
                {/* Mobile-first responsive pagination */}
                <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
                  {/* Navigation buttons */}
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePreviousPage}
                      disabled={currentPage === 1}
                      className="flex items-center space-x-1"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span className="hidden xs:inline">Previous</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                      className="flex items-center space-x-1"
                    >
                      <span className="hidden xs:inline">Next</span>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Page info and number buttons */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">
                      {currentPage} of {totalPages}
                    </span>
                    
                    {/* Compact pagination - responsive */}
                    <div className="flex items-center space-x-1">
                      {/* Show minimal pagination on mobile, full on desktop */}
                      <div className="hidden sm:flex items-center space-x-1">
                        {/* First page */}
                        {currentPage > 3 && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(1)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                            {currentPage > 4 && <span className="text-gray-400">...</span>}
                          </>
                        )}
                        
                        {/* Pages around current */}
                        {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                          const page = Math.max(1, currentPage - 2) + i;
                          if (page > totalPages) return null;
                          return (
                            <Button
                              key={page}
                              variant={currentPage === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setCurrentPage(page)}
                              className="w-8 h-8 p-0"
                            >
                              {page}
                            </Button>
                          );
                        })}
                        
                        {/* Last page */}
                        {currentPage < totalPages - 2 && (
                          <>
                            {currentPage < totalPages - 3 && <span className="text-gray-400">...</span>}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          </>
                        )}
                      </div>
                      
                      {/* Mobile-only: Show only current page button as reference */}
                      <div className="sm:hidden">
                        <Button
                          variant="default"
                          size="sm"
                          className="w-8 h-8 p-0"
                          disabled
                        >
                          {currentPage}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};