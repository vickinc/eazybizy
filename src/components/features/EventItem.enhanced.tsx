import React, { memo, useMemo } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Edit3, Trash2, StickyNote } from "lucide-react";
import { CalendarEvent, Note } from '@/types/calendar.types';
import { cn } from '@/utils/cn';

interface EventItemProps {
  event: CalendarEvent;
  eventNotes: Note[];
  handleEditEvent: (event: CalendarEvent) => void;
  handleDeleteEvent: (eventId: string) => void;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
  formatDate?: (date: Date) => string;
  showDate?: boolean;
  className?: string;
  compact?: boolean;
}

// Memoized EventItem component for performance
const EventItemEnhanced: React.FC<EventItemProps> = memo(({
  event,
  eventNotes,
  handleEditEvent,
  handleDeleteEvent,
  getPriorityColor,
  getTypeIcon,
  formatDate,
  showDate = false,
  className = "",
  compact = false
}) => {
  // Memoize expensive calculations
  const priorityColorClass = useMemo(() => 
    getPriorityColor(event.priority), 
    [event.priority, getPriorityColor]
  );
  
  const typeIcon = useMemo(() => 
    getTypeIcon(event.type), 
    [event.type, getTypeIcon]
  );
  
  const formattedDateTime = useMemo(() => {
    if (!showDate || !formatDate) return event.time;
    return `${formatDate(event.date)} at ${event.time}`;
  }, [showDate, formatDate, event.date, event.time]);
  
  const hasNotes = eventNotes.length > 0;
  const hasDescription = event.description && event.description.trim().length > 0;
  
  // Memoized event handlers to prevent unnecessary re-renders
  const handleEdit = useMemo(() => 
    () => handleEditEvent(event), 
    [handleEditEvent, event]
  );
  
  const handleDelete = useMemo(() => 
    () => handleDeleteEvent(event.id), 
    [handleDeleteEvent, event.id]
  );

  if (compact) {
    // Compact view for virtual lists with many items
    return (
      <div className={cn(
        "flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:border-gray-300 transition-colors group",
        className
      )}>
        {/* Type Icon */}
        <div className="flex-shrink-0 mr-3">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            {typeIcon}
          </div>
        </div>
        
        {/* Event Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-1">
            <h4 className="font-medium text-sm truncate">{event.title}</h4>
            <Badge className={cn("text-xs", priorityColorClass)}>
              {event.priority}
            </Badge>
          </div>
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>{formattedDateTime}</span>
            {event.company && (
              <>
                <span>•</span>
                <span className="flex items-center truncate">
                  <Building2 className="h-3 w-3 mr-1 flex-shrink-0" />
                  {event.company}
                </span>
              </>
            )}
            {hasNotes && (
              <>
                <span>•</span>
                <span className="flex items-center">
                  <StickyNote className="h-3 w-3 mr-1" />
                  {eventNotes.length}
                </span>
              </>
            )}
          </div>
        </div>
        
        {/* Actions (shown on hover) */}
        <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleEdit}
            className="h-8 w-8 p-0"
          >
            <Edit3 className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="h-8 w-8 p-0 hover:text-red-500"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  // Full view for detailed event display
  return (
    <div className={cn("p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-all", className)}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          <div className="flex-shrink-0 pt-1">
            {typeIcon}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 mb-1">{event.title}</h4>
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
              <span>{formattedDateTime}</span>
              {event.company && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    {event.company}
                  </span>
                </>
              )}
              {hasNotes && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="flex items-center">
                    <StickyNote className="h-3 w-3 mr-1" />
                    {eventNotes.length} note{eventNotes.length > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
            {hasDescription && (
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">{event.description}</p>
            )}
          </div>
        </div>
        
        {/* Priority Badge and Actions */}
        <div className="flex items-start space-x-2 flex-shrink-0 ml-2">
          <Badge className={priorityColorClass}>
            {event.priority}
          </Badge>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleEdit}
              className="h-8 w-8 p-0"
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      
      {/* Related Notes Section */}
      {hasNotes && (
        <div className="mt-3 pl-8 space-y-2 border-t border-gray-200 pt-3">
          <h5 className="text-sm font-medium text-gray-700 flex items-center">
            <StickyNote className="h-4 w-4 mr-1" />
            Related Notes ({eventNotes.length})
          </h5>
          <div className="space-y-2">
            {eventNotes.slice(0, 2).map((note) => (
              <div key={note.id} className="bg-white p-2 rounded border-l-4 border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{note.title}</p>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{note.content}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {note.priority}
                      </Badge>
                      {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {note.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {note.tags.length > 2 && (
                            <span className="text-xs text-gray-500">+{note.tags.length - 2}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {eventNotes.length > 2 && (
              <div className="text-xs text-gray-500 text-center py-1">
                +{eventNotes.length - 2} more notes
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  return (
    prevProps.event.id === nextProps.event.id &&
    prevProps.event.title === nextProps.event.title &&
    prevProps.event.description === nextProps.event.description &&
    prevProps.event.date.getTime() === nextProps.event.date.getTime() &&
    prevProps.event.time === nextProps.event.time &&
    prevProps.event.type === nextProps.event.type &&
    prevProps.event.priority === nextProps.event.priority &&
    prevProps.event.company === nextProps.event.company &&
    prevProps.eventNotes.length === nextProps.eventNotes.length &&
    prevProps.showDate === nextProps.showDate &&
    prevProps.compact === nextProps.compact &&
    prevProps.className === nextProps.className
  );
});

EventItemEnhanced.displayName = 'EventItemEnhanced';

export { EventItemEnhanced };
export default EventItemEnhanced;