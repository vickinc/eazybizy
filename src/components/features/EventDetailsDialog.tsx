import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import { CalendarEvent } from '@/types/calendar.types';

interface EventDetailsDialogProps {
  event: CalendarEvent | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onViewInCalendar: (date: Date) => void;
  formatEventDate: (date: Date) => string;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
}

export const EventDetailsDialog: React.FC<EventDetailsDialogProps> = ({
  event,
  isOpen,
  onOpenChange,
  onViewInCalendar,
  formatEventDate,
  getPriorityColor,
  getTypeIcon,
}) => {
  if (!event) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            {getTypeIcon(event.type)}
            <span>{event.title}</span>
          </DialogTitle>
          <DialogDescription>
            Event details and information
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Priority</p>
              <Badge className={getPriorityColor(event.priority)}>
                {event.priority}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Type</p>
              <Badge variant="outline" className="capitalize">
                {event.type}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-700">Date</p>
              <p className="text-sm text-gray-900">
                {formatEventDate(new Date(event.date))} at {event.time}
              </p>
            </div>
            
            {event.company && (
              <div>
                <p className="text-sm font-medium text-gray-700">Company</p>
                <p className="text-sm text-gray-900 mt-1">{event.company}</p>
              </div>
            )}
            
            {event.description && event.description.trim() && (
              <div>
                <p className="text-sm font-medium text-gray-700">Description</p>
                <p className="text-sm text-gray-900 mt-1">{event.description}</p>
              </div>
            )}
            
            {event.participants && event.participants.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-700">Participants</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {event.participants.map((participant, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {participant}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={() => onViewInCalendar(new Date(event.date))}
          >
            <Calendar className="w-4 h-4 mr-2" />
            View in Calendar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};