"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import CalendarDays from "lucide-react/dist/esm/icons/calendar-days";
import Clock from "lucide-react/dist/esm/icons/clock";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import StickyNote from "lucide-react/dist/esm/icons/sticky-note";
import Plus from "lucide-react/dist/esm/icons/plus";
import X from "lucide-react/dist/esm/icons/x";
import { CalendarEvent } from "@/types/calendar.types";

interface MobileCalendarModalProps {
  selectedDate: Date | undefined;
  currentMonth: Date;
  events: CalendarEvent[];
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
  onAddEvent: () => void;
  getEventsForDate: (date: Date) => CalendarEvent[];
  getPriorityColor: (priority: string) => string;
  formatDate: (date: Date) => string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "meeting": return <CalendarDays className="h-3 w-3" />;
    case "deadline": return <Clock className="h-3 w-3" />;
    case "renewal": return <StickyNote className="h-3 w-3" />;
    default: return <CalendarDays className="h-3 w-3" />;
  }
};

export const MobileCalendarModal: React.FC<MobileCalendarModalProps> = ({
  selectedDate,
  currentMonth,
  events,
  isOpen,
  onOpenChange,
  onDateSelect,
  onMonthChange,
  onAddEvent,
  getEventsForDate,
  getPriorityColor,
  formatDate,
}) => {
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const handleAddEventAndClose = () => {
    onAddEvent();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader>
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <CalendarDays className="h-5 w-5 text-blue-600" />
              <span>Calendar</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          {/* Calendar Component */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              month={currentMonth}
              onMonthChange={onMonthChange}
              onSelect={onDateSelect}
              className="rounded-md border-0"
              modifiers={{
                hasEvents: events.map(event => new Date(event.date))
              }}
              modifiersClassNames={{
                hasEvents: "bg-blue-100 text-blue-900 font-medium"
              }}
            />
          </div>

          {/* Add Event Button */}
          <Button
            onClick={handleAddEventAndClose}
            className="w-full"
            size="lg"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Event
          </Button>

          {/* Selected Date Events */}
          {selectedDate && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-base font-medium text-gray-900">
                  {formatDate(selectedDate)}
                </h4>
                <span className="text-sm text-gray-500">
                  {selectedDateEvents.length} event{selectedDateEvents.length !== 1 ? 's' : ''}
                </span>
              </div>
              
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {selectedDateEvents.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No events for this date
                  </p>
                ) : (
                  selectedDateEvents.map((event) => (
                    <div
                      key={event.id}
                      className="p-3 bg-gray-50 rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          {getTypeIcon(event.type)}
                          <span className="text-sm font-medium truncate">
                            {event.title}
                          </span>
                        </div>
                        <Badge className={`${getPriorityColor(event.priority)} text-xs px-2 py-1 shrink-0`}>
                          {event.priority}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
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
                        <p className="text-sm text-gray-600">
                          {event.description}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};