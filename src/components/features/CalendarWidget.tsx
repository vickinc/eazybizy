"use client";

import React, { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Plus from "lucide-react/dist/esm/icons/plus";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import Clock from "lucide-react/dist/esm/icons/clock";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import StickyNote from "lucide-react/dist/esm/icons/sticky-note";
import TrendingUp from "lucide-react/dist/esm/icons/trending-up";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Loader2 from "lucide-react/dist/esm/icons/loader-2";
import { CalendarEvent } from "@/types/calendar.types";
import { toast } from "sonner";

interface CalendarWidgetProps {
  selectedDate: Date | undefined;
  currentMonth: Date;
  events: CalendarEvent[];
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
  onAddEvent: () => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
  handleEditEvent: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string, onConfirm?: () => void) => Promise<void>;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "meeting": return <CalendarDays className="h-3 w-3" />;
    case "deadline": return <Clock className="h-3 w-3" />;
    case "renewal": return <StickyNote className="h-3 w-3" />;
    case "anniversary": return <TrendingUp className="h-3 w-3" />;
    default: return <CalendarDays className="h-3 w-3" />;
  }
};

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  currentMonth,
  events,
  onDateSelect,
  onMonthChange,
  onAddEvent,
  getEventsForDate,
  getPriorityColor,
  formatDate,
  handleEditEvent,
  handleDeleteEvent,
}) => {
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];
  const [deletingEventId, setDeletingEventId] = useState<string | null>(null);

  const handleDeleteWithConfirmation = (event: CalendarEvent) => {
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
              onClick={() => toast.dismiss(t)}
              className="text-xs"
            >
              Cancel
            </Button>
            <button
              onClick={() => {
                toast.dismiss(t);
                setDeletingEventId(event.id);
                handleDeleteEvent(event.id, () => {
                  toast.loading('Deleting event...', { id: `delete-${event.id}` });
                })
                  .then(() => {
                    toast.success('Event deleted successfully', { id: `delete-${event.id}` });
                  })
                  .catch((error) => {
                    toast.error(`Failed to delete event: ${error.message}`, { id: `delete-${event.id}` });
                  })
                  .finally(() => {
                    setDeletingEventId(null);
                  });
              }}
              className="px-3 py-1.5 text-xs text-white bg-red-600 hover:bg-red-700 rounded-md border-0 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    ), {
      duration: 0, // Keep open until dismissed
      position: 'top-center',
    });
  };
  
  // Filter events to only include those in the current month being displayed
  const currentMonthEvents = events.filter(event => {
    const eventDate = new Date(event.date);
    return eventDate.getMonth() === currentMonth.getMonth() && 
           eventDate.getFullYear() === currentMonth.getFullYear();
  });

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="pb-2 px-4 pt-4">
        <div className="flex items-center space-x-2">
          <CalendarDays className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Calendar</CardTitle>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4 p-4 pt-2">
        {/* Calendar Component */}
        <div className="flex justify-center mb-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            month={currentMonth}
            onMonthChange={onMonthChange}
            onSelect={onDateSelect}
            className="rounded-md border-0 scale-100"
            modifiers={{
              hasEvents: currentMonthEvents.map(event => new Date(event.date)),
              today: new Date()
            }}
            modifiersClassNames={{
              hasEvents: "bg-blue-100 text-blue-900 font-medium",
              today: "bg-lime-200 text-black font-bold border-2 border-lime-400 shadow-md hover:bg-lime-300"
            }}
          />
        </div>

        {/* Add Event Button */}
        <Button
          onClick={onAddEvent}
          className="w-full"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Event
        </Button>

        {/* Selected Date Events */}
        {selectedDate && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900">
                {formatDate(selectedDate)}
              </h4>
              <span className="text-xs text-gray-500">
                {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedDateEvents.length === 0 ? (
                <p className="text-xs text-gray-500 text-center py-4">
                  No events for this date
                </p>
              ) : (
                selectedDateEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-2 bg-gray-50 rounded-md space-y-1 group hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1 flex-1 min-w-0">
                        {getTypeIcon(event.type)}
                        <span className="text-xs font-medium truncate">
                          {event.title}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Badge className={`${getPriorityColor(event.priority)} text-xs px-1 py-0`}>
                          {event.priority}
                        </Badge>
                        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditEvent(event)}
                            className="h-6 w-6 p-0 hover:bg-blue-100"
                            disabled={event.isAutoGenerated}
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteWithConfirmation(event)}
                            className="h-6 w-6 p-0 hover:bg-red-100"
                            disabled={deletingEventId === event.id}
                          >
                            {deletingEventId === event.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Trash2 className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1 text-xs text-gray-600">
                      <Clock className="h-3 w-3" />
                      <span>{event.time}</span>
                      {event.company && (
                        <>
                          <span>•</span>
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{event.company}</span>
                        </>
                      )}
                    </div>
                    
                    {event.description && (
                      <p className="text-xs text-gray-600 truncate">
                        {event.description}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};