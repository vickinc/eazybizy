import React, { useMemo, useCallback } from 'react';
import { CalendarDays, Clock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VirtualList, VariableVirtualList, InfiniteVirtualList } from "@/components/ui/virtual-scroll";
import { CalendarEvent, Note } from '@/types/calendar.types';
import { EventItem } from './EventItem';
import { cn } from '@/utils/cn';

interface VirtualEventListProps {
  title: string;
  description: string;
  events: CalendarEvent[];
  notes: Note[];
  emptyMessage?: string;
  icon?: React.ReactNode;
  showDate?: boolean;
  height?: number;
  className?: string;
  virtualThreshold?: number; // Virtualize when events count exceeds this
  itemHeight?: number; // Fixed height for uniform items
  
  // Event handlers
  getNotesForEvent: (eventId: string) => Note[];
  handleEditEvent: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  formatDate?: (date: Date) => string;
  
  // Infinite loading support
  hasMore?: boolean;
  loadMore?: () => void;
  isLoading?: boolean;
  
  // Performance optimization
  enableVirtualization?: boolean;
}

export const VirtualEventList: React.FC<VirtualEventListProps> = ({
  title,
  description,
  events,
  notes,
  emptyMessage = "No events found",
  icon,
  showDate = false,
  height = 600,
  className = "",
  virtualThreshold = 50,
  itemHeight = 120, // Estimated height per event item
  getNotesForEvent,
  handleEditEvent,
  handleDeleteEvent,
  getPriorityColor,
  getTypeIcon,
  formatDate,
  hasMore = false,
  loadMore,
  isLoading = false,
  enableVirtualization = true
}) => {
  
  // Determine if we should use virtualization
  const shouldVirtualize = enableVirtualization && events.length > virtualThreshold;
  
  // Memoized event items with notes
  const eventsWithNotes = useMemo(() => {
    return events.map(event => ({
      ...event,
      eventNotes: getNotesForEvent(event.id)
    }));
  }, [events, getNotesForEvent]);
  
  // Calculate variable heights for events with notes
  const getItemHeight = useCallback((index: number) => {
    const event = eventsWithNotes[index];
    const height = itemHeight; // Base height
    
    // Add height for notes
    if (event.eventNotes.length > 0) {
      height += 20; // Header for notes section
      height += event.eventNotes.length * 60; // ~60px per note
    }
    
    // Add height for description
    if (event.description && event.description.length > 50) {
      height += 20; // Extra line for long descriptions
    }
    
    return Math.min(height, 300); // Cap at 300px max height
  }, [eventsWithNotes, itemHeight]);

  // Render function for individual event items
  const renderEventItem = useCallback((
    eventWithNotes: typeof eventsWithNotes[0],
    index: number,
    style?: React.CSSProperties
  ) => {
    return (
      <div 
        style={style} 
        className={cn(
          "px-1 py-2", // Padding around each item
          shouldVirtualize && "box-border"
        )}
      >
        <EventItem
          event={eventWithNotes}
          eventNotes={eventWithNotes.eventNotes}
          handleEditEvent={handleEditEvent}
          handleDeleteEvent={handleDeleteEvent}
          getPriorityColor={getPriorityColor}
          getTypeIcon={getTypeIcon}
          formatDate={formatDate}
          showDate={showDate}
          className={cn(
            "transition-all duration-200 hover:shadow-md border border-gray-200",
            showDate && "bg-white rounded-lg shadow-sm"
          )}
        />
      </div>
    );
  }, [
    shouldVirtualize,
    handleEditEvent,
    handleDeleteEvent,
    getPriorityColor,
    getTypeIcon,
    formatDate,
    showDate
  ]);

  // Infinite loading handler
  const loadMoreEvents = useCallback(async (startIndex: number, stopIndex: number) => {
    if (hasMore && loadMore && !isLoading) {
      loadMore();
    }
  }, [hasMore, loadMore, isLoading]);

  // Loading component
  const loadingComponent = useMemo(() => (
    <div className="space-y-4 p-4">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="bg-gray-200 h-24 rounded-lg mb-2"></div>
        </div>
      ))}
    </div>
  ), []);

  // Empty state component
  const emptyComponent = useMemo(() => (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <CalendarDays className="h-12 w-12 text-gray-400 mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
      <p className="text-gray-600">{emptyMessage}</p>
    </div>
  ), [emptyMessage]);

  // Render the appropriate list based on conditions
  const renderEventsList = () => {
    if (isLoading && events.length === 0) {
      return loadingComponent;
    }

    if (events.length === 0) {
      return emptyComponent;
    }

    // For large lists with infinite loading
    if (shouldVirtualize && hasMore && loadMore) {
      return (
        <InfiniteVirtualList
          items={eventsWithNotes}
          itemHeight={itemHeight}
          renderItem={renderEventItem}
          hasNextPage={hasMore}
          loadMoreItems={loadMoreEvents}
          isLoading={isLoading}
          height={height - 120} // Account for card header
          loadingComponent={
            <div className="flex items-center justify-center p-4">
              <Clock className="animate-spin h-5 w-5 mr-2" />
              Loading more events...
            </div>
          }
        />
      );
    }

    // For large lists with variable heights (events with different content sizes)
    if (shouldVirtualize) {
      const hasVariableHeights = eventsWithNotes.some(event => 
        event.eventNotes.length > 0 || (event.description && event.description.length > 50)
      );

      if (hasVariableHeights) {
        return (
          <VariableVirtualList
            items={eventsWithNotes}
            getItemHeight={getItemHeight}
            renderItem={renderEventItem}
            height={height - 120} // Account for card header
            estimatedItemHeight={itemHeight}
          />
        );
      } else {
        return (
          <VirtualList
            items={eventsWithNotes}
            itemHeight={itemHeight}
            renderItem={renderEventItem}
            height={height - 120} // Account for card header
            loading={isLoading}
            loadingComponent={loadingComponent}
          />
        );
      }
    }

    // For smaller lists, render normally for better UX
    return (
      <div 
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight: height - 120 }}
      >
        {eventsWithNotes.map((eventWithNotes, index) => 
          renderEventItem(eventWithNotes, index)
        )}
        
        {/* Load more button for non-virtual lists */}
        {hasMore && loadMore && (
          <div className="pt-4 text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Loading...' : 'Load More Events'}
            </button>
          </div>
        )}
      </div>
    );
  };

  // Performance info for development
  const performanceInfo = useMemo(() => {
    if (process.env.NODE_ENV !== 'development') return null;
    
    return (
      <div className="text-xs text-gray-500 p-2 bg-blue-50 border-t border-blue-200">
        <p>📊 Performance: {events.length} events • Virtualized: {shouldVirtualize ? 'Yes' : 'No'} • Height: {height}px</p>
      </div>
    );
  }, [events.length, shouldVirtualize, height]);

  return (
    <Card className={cn("h-fit", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center text-lg">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({events.length} {events.length === 1 ? 'event' : 'events'})
          </span>
        </CardTitle>
        <CardDescription className="text-sm">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {renderEventsList()}
        {performanceInfo}
      </CardContent>
    </Card>
  );
};

// Export both the enhanced and standard versions
export default VirtualEventList;