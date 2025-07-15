import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventItem } from './EventItem';
import { CalendarEvent, Note } from '@/types/calendar.types';

interface VirtualizedEventListProps {
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
  height?: number; // Container height for virtualization
  itemHeight?: number; // Estimated item height
}

export const VirtualizedEventList: React.FC<VirtualizedEventListProps> = ({
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
  height = 400, // Default height
  itemHeight = showDate ? 120 : 80 // Estimated item height based on showDate
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Safety check for events array
  const safeEvents = events || [];
  
  // Only virtualize if we have many events
  const shouldVirtualize = safeEvents.length > 20;

  const virtualizer = useVirtualizer({
    count: safeEvents.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Render 5 items before and after visible area
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize event items to prevent unnecessary re-renders
  const eventItems = useMemo(() => {
    return safeEvents.map((event) => {
      const eventNotes = getNotesForEvent(event.id);
      return {
        event,
        eventNotes,
        component: (
          <EventItem
            key={event.id}
            event={event}
            eventNotes={eventNotes}
            handleEditEvent={handleEditEvent}
            handleDeleteEvent={handleDeleteEvent}
            getPriorityColor={getPriorityColor}
            getTypeIcon={getTypeIcon}
            formatDate={formatDate}
            showDate={showDate}
            className={showDate ? "p-4 bg-white rounded-lg border border-gray-200 shadow-sm" : ""}
          />
        )
      };
    });
  }, [safeEvents, getNotesForEvent, handleEditEvent, handleDeleteEvent, getPriorityColor, getTypeIcon, formatDate, showDate]);

  if (safeEvents.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
        </CardContent>
      </Card>
    );
  }

  if (!shouldVirtualize) {
    // For small lists, use regular rendering
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            {title}
          </CardTitle>
          <CardDescription>
            {description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className={`space-y-${showDate ? '6' : '3'}`}>
            {eventItems.map((item) => item.component)}
          </div>
        </CardContent>
      </Card>
    );
  }

  // For large lists, use virtualization
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center">
          {icon && <span className="mr-2">{icon}</span>}
          {title}
          <span className="ml-2 text-sm font-normal text-gray-500">
            (Virtualized - {events.length} events)
          </span>
        </CardTitle>
        <CardDescription>
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          ref={parentRef}
          style={{
            height: `${height}px`,
            overflow: 'auto',
          }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {virtualItems.map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                  paddingBottom: showDate ? '24px' : '12px',
                }}
              >
                {eventItems[virtualItem.index]?.component}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};