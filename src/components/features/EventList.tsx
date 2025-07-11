import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EventItem } from './EventItem';
import { CalendarEvent, Note } from '@/types/calendar.types';

interface EventListProps {
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
  isDeleting?: boolean;
}

export const EventList: React.FC<EventListProps> = ({
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
  isDeleting = false
}) => {
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
          {events.length === 0 ? (
            <p className="text-gray-500 text-center py-4">{emptyMessage}</p>
          ) : (
            events.map((event) => {
              const eventNotes = getNotesForEvent(event.id);
              return (
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
                  isDeleting={isDeleting}
                />
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};