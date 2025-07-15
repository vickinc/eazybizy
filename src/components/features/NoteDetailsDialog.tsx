import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import StickyNote from "lucide-react/dist/esm/icons/sticky-note";
import Calendar from "lucide-react/dist/esm/icons/calendar";
import Building2 from "lucide-react/dist/esm/icons/building-2";
import Edit from "lucide-react/dist/esm/icons/edit";
import Trash2 from "lucide-react/dist/esm/icons/trash-2";
import Check from "lucide-react/dist/esm/icons/check";
import RotateCcw from "lucide-react/dist/esm/icons/rotate-ccw";
import { Note } from '@/types/calendar.types';

interface FormattedEvent {
  title: string;
  formattedDate: string;
  time?: string;
  description?: string;
  date: Date;
}

interface NoteDetailsDialogProps {
  isDetailsDialogOpen: boolean;
  closeDetailsDialog: () => void;
  selectedNote: (Note & {
    formattedUpdatedAt: string;
    formattedCompletedAt?: string;
    formattedCreatedAt: string;
  }) | null;
  getFormattedEvent: (eventId: string) => FormattedEvent | null;
  getPriorityColor: (priority: string) => string;
  getCompanyName: (companyId?: number) => string | null;
  handleRestoreNote: (noteId: string) => void;
  handleCompleteNote: (noteId: string) => void;
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (noteId: string) => void;
  navigateToCalendar: (date: Date) => void;
}

export const NoteDetailsDialog: React.FC<NoteDetailsDialogProps> = ({
  isDetailsDialogOpen,
  closeDetailsDialog,
  selectedNote,
  getFormattedEvent,
  getPriorityColor,
  getCompanyName,
  handleRestoreNote,
  handleCompleteNote,
  handleEditNote,
  handleDeleteNote,
  navigateToCalendar
}) => {
  return (
    <Dialog open={isDetailsDialogOpen} onOpenChange={(open) => !open && closeDetailsDialog()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <StickyNote className="h-5 w-5" />
            {selectedNote?.title}
          </DialogTitle>
        </DialogHeader>
        
        {selectedNote && (
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge 
                variant="outline" 
                className={getPriorityColor(selectedNote.priority)}
              >
                {selectedNote.priority} Priority
              </Badge>
              <Badge variant={selectedNote.isStandalone ? "secondary" : "default"}>
                {selectedNote.isStandalone ? "Standalone Note" : "Event-Related Note"}
              </Badge>
              {selectedNote.isCompleted && (
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  {selectedNote.isAutoArchived ? "Auto-Archived" : "Completed"}
                  {selectedNote.formattedCompletedAt && ` on ${selectedNote.formattedCompletedAt}`}
                </Badge>
              )}
            </div>

            {/* Event Information for Event-Related notes */}
            {!selectedNote.isStandalone && selectedNote.eventId && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Related Event
                </h4>
                {(() => {
                  const relatedEvent = getFormattedEvent(selectedNote.eventId, selectedNote.event);
                  return relatedEvent ? (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          navigateToCalendar(relatedEvent.date);
                          closeDetailsDialog();
                        }}
                        className="text-blue-700 hover:text-blue-900 font-medium hover:underline cursor-pointer block"
                      >
                        {relatedEvent.title}
                      </button>
                      <p className="text-blue-600 text-sm">
                        {relatedEvent.formattedDate} at {relatedEvent.time}
                      </p>
                      {relatedEvent.description && (
                        <p className="text-blue-700 text-sm">{relatedEvent.description}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-blue-600">Event not found</p>
                  );
                })()}
              </div>
            )}

            {/* Company Information */}
            {selectedNote.companyId && getCompanyName(selectedNote.companyId) && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-1 flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Company
                </h4>
                <p className="text-gray-700">{getCompanyName(selectedNote.companyId)}</p>
              </div>
            )}

            {/* Tags */}
            {selectedNote.tags.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Tags</h4>
                <div className="flex flex-wrap gap-1">
                  {selectedNote.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content */}
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">Content</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedNote.content}</p>
              </div>
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Created:</span>
                <span>{selectedNote.formattedCreatedAt} at {selectedNote.createdAt.toLocaleTimeString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Last Updated:</span>
                <span>{selectedNote.formattedUpdatedAt} at {selectedNote.updatedAt.toLocaleTimeString()}</span>
              </div>
              {selectedNote.completedAt && (
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span>{selectedNote.formattedCompletedAt} at {selectedNote.completedAt.toLocaleTimeString()}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-2 pt-4 border-t">
              {selectedNote.isCompleted ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRestoreNote(selectedNote.id);
                    closeDetailsDialog();
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restore Note
                </Button>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleCompleteNote(selectedNote.id);
                      closeDetailsDialog();
                    }}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleEditNote(selectedNote);
                      closeDetailsDialog();
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  handleDeleteNote(selectedNote.id);
                  closeDetailsDialog();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};