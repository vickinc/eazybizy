import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Edit3, Trash2, StickyNote, Loader2 } from "lucide-react";
import { CalendarEvent, Note } from '@/types/calendar.types';
import { toast } from 'sonner';

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
  isDeleting?: boolean;
}

export const EventItem: React.FC<EventItemProps> = ({
  event,
  eventNotes,
  handleEditEvent,
  handleDeleteEvent,
  getPriorityColor,
  getTypeIcon,
  formatDate,
  showDate = false,
  className = "",
  isDeleting = false
}) => {
  const [isBeingDeleted, setIsBeingDeleted] = useState(false);

  const handleDelete = async () => {
    setIsBeingDeleted(true);
    try {
      await handleDeleteEvent(event.id);
      toast.success(`Event "${event.title}" deleted successfully`);
    } catch (error) {
      // Reset the local state if deletion fails
      setIsBeingDeleted(false);
      toast.error('Failed to delete event. Please try again.');
    }
  };
  const isEventDeleting = isDeleting || isBeingDeleted;

  return (
    <div className={`p-3 bg-gray-50 rounded-lg transition-opacity ${isEventDeleting ? 'opacity-60' : ''} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            {getTypeIcon(event.type)}
          </div>
          <div className="flex-1">
            <h4 className="font-medium">{event.title}</h4>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>
                {showDate && formatDate ? `${formatDate(event.date)} at ` : ''}{event.time}
              </span>
              {event.company && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <Building2 className="h-3 w-3 mr-1" />
                    {event.company}
                  </span>
                </>
              )}
              {eventNotes.length > 0 && (
                <>
                  <span>•</span>
                  <span className="flex items-center">
                    <StickyNote className="h-3 w-3 mr-1" />
                    {eventNotes.length} note{eventNotes.length > 1 ? 's' : ''}
                  </span>
                </>
              )}
            </div>
            {event.description && (
              <p className="text-sm text-gray-600 mt-1">{event.description}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Badge className={getPriorityColor(event.priority)}>
              {event.priority}
            </Badge>
            {event.type === 'anniversary' && (
              <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                Auto-generated
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleEditEvent(event)}
              disabled={isEventDeleting}
            >
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={isEventDeleting}
              className={`transition-all duration-200 ${isEventDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-50 hover:text-red-600'}`}
            >
                {isEventDeleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
          </div>
        </div>
      </div>
      
      {/* Related Notes */}
      {eventNotes.length > 0 && (
        <div className="mt-3 pl-8 space-y-2">
          <h5 className="text-sm font-medium text-gray-700 flex items-center">
            <StickyNote className="h-4 w-4 mr-1" />
            Related Notes
          </h5>
          {eventNotes.map((note) => (
            <div key={note.id} className="bg-white p-2 rounded border-l-4 border-blue-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{note.title}</p>
                  <p className="text-xs text-gray-600 mt-1">{note.content}</p>
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
                          <span className="text-xs text-gray-500">+{note.tags.length - 2} more</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};