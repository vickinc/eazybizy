"use client";

import React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  CalendarDays,
  Clock,
  Building2,
  StickyNote,
  TrendingUp
} from "lucide-react";
import { CalendarEvent } from "@/types/calendar.types";

interface CalendarWidgetProps {
  selectedDate: Date | undefined;
  currentMonth: Date;
  events: CalendarEvent[];
  isExpanded: boolean;
  onDateSelect: (date: Date | undefined) => void;
  onMonthChange: (date: Date) => void;
  onToggleExpanded: () => void;
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
    case "anniversary": return <TrendingUp className="h-3 w-3" />;
    default: return <CalendarDays className="h-3 w-3" />;
  }
};

export const CalendarWidget: React.FC<CalendarWidgetProps> = ({
  selectedDate,
  currentMonth,
  events,
  isExpanded,
  onDateSelect,
  onMonthChange,
  onToggleExpanded,
  onAddEvent,
  getEventsForDate,
  getPriorityColor,
  formatDate,
}) => {
  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  return (
    <Card className={`transition-all duration-300 ${isExpanded ? 'w-full' : 'w-16'}`}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            {isExpanded && (
              <CardTitle className="text-lg">Calendar</CardTitle>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleExpanded}
            className="h-8 w-8 p-0"
          >
            {isExpanded ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="space-y-4">
          {/* Calendar Component */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              month={currentMonth}
              onMonthChange={onMonthChange}
              onSelect={onDateSelect}
              className="rounded-md border-0 scale-90"
              modifiers={{
                hasEvents: events.map(event => new Date(event.date)),
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
                      className="p-2 bg-gray-50 rounded-md space-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-1 flex-1 min-w-0">
                          {getTypeIcon(event.type)}
                          <span className="text-xs font-medium truncate">
                            {event.title}
                          </span>
                        </div>
                        <Badge className={`${getPriorityColor(event.priority)} text-xs px-1 py-0`}>
                          {event.priority}
                        </Badge>
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
      )}
    </Card>
  );
};