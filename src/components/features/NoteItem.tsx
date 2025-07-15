import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Check from "lucide-react/dist/esm/icons/check";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import { Note } from '@/types/calendar.types';

interface FormattedEvent {
  id: string;
  title: string;
  date: Date;
  formattedDate: string;
  time: string;
  description: string;
  company: string;
}

interface NoteItemProps {
  note: Note & {
    formattedUpdatedAt: string;
    formattedCompletedAt?: string;
    formattedCreatedAt: string;
  };
  showArchived: boolean;
  relatedEvent: FormattedEvent | null;
  getPriorityColor: (priority: string) => string;
  getCompanyName: (companyId?: number) => string | null;
  handleRestoreNote: (noteId: string) => void;
  handleCompleteNote: (noteId: string) => void;
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (noteId: string) => void;
  openDetailsDialog: (note: Note) => void;
}

export const NoteItem: React.FC<NoteItemProps> = ({
  note,
  showArchived,
  relatedEvent,
  getPriorityColor,
  getCompanyName,
  handleRestoreNote,
  handleCompleteNote,
  handleEditNote,
  handleDeleteNote,
  openDetailsDialog
}) => {
  return (
    <Card 
      className={`hover:shadow-md transition-all cursor-pointer border-l-4 ${
        note.isStandalone ? 'border-l-blue-500' : 'border-l-black'
      }`}
      onClick={() => openDetailsDialog(note)}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            {/* Event information at top for Event-Related notes */}
            {!note.isStandalone && relatedEvent && (
              <div className="mb-2 p-2 bg-gray-50 rounded border text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Calendar className="h-4 w-4" />
                  <span className="font-medium">{relatedEvent.title}</span>
                  <span>•</span>
                  <span>{relatedEvent.formattedDate}</span>
                  {relatedEvent.time && (
                    <>
                      <span>•</span>
                      <span>{relatedEvent.time}</span>
                    </>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate">{note.title}</h3>
              <Badge 
                variant="outline" 
                className={getPriorityColor(note.priority)}
              >
                {note.priority}
              </Badge>
              <Badge variant={note.isStandalone ? "secondary" : "default"}>
                {note.isStandalone ? "Standalone" : "Event-Related"}
              </Badge>
              {note.isCompleted && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {note.isAutoArchived ? "Auto-Archived" : "Completed"}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>Last Updated: {note.formattedUpdatedAt}</span>
              {note.companyId && getCompanyName(note.companyId) && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {getCompanyName(note.companyId)}
                </span>
              )}
              {note.tags.length > 0 && (
                <span className="text-blue-600">
                  {note.tags.length} tag{note.tags.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <p className="text-gray-700 text-sm mt-1 line-clamp-2">
              {note.content.length > 100 ? `${note.content.substring(0, 100)}...` : note.content}
            </p>
          </div>
          
          <div className="flex items-center gap-2 ml-4">
            {showArchived ? (
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRestoreNote(note.id);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCompleteNote(note.id);
                  }}
                  className="text-green-600 hover:text-green-700 hover:bg-green-50"
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditNote(note);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteNote(note.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};