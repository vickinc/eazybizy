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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Enhanced Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <StickyNote className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {selectedNote?.title}
              </DialogTitle>
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedNote && (
                  <>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getPriorityColor(selectedNote.priority)}`}
                    >
                      {selectedNote.priority.charAt(0).toUpperCase() + selectedNote.priority.slice(1)} Priority
                    </Badge>
                    <Badge variant={selectedNote.isStandalone ? "secondary" : "default"} className="text-xs">
                      {selectedNote.isStandalone ? "Standalone" : "Event-Related"}
                    </Badge>
                    {selectedNote.isCompleted && (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                        {selectedNote.isAutoArchived ? "Auto-Archived" : "Completed"}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </DialogHeader>
        
        {selectedNote && (
          <div className="px-6 pb-6 space-y-6">
            {/* Event Information Section */}
            {!selectedNote.isStandalone && selectedNote.eventId && (
              <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-blue-500 rounded-full"></div>
                  Related Event
                </h3>
                {(() => {
                  const relatedEvent = getFormattedEvent(selectedNote.eventId, selectedNote.event);
                  return relatedEvent ? (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <button
                        onClick={() => {
                          navigateToCalendar(relatedEvent.date);
                          closeDetailsDialog();
                        }}
                        className="text-blue-700 hover:text-blue-900 font-medium hover:underline cursor-pointer block mb-2"
                      >
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {relatedEvent.title}
                        </div>
                      </button>
                      <p className="text-blue-600 text-sm flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        {relatedEvent.formattedDate} at {relatedEvent.time}
                      </p>
                      {relatedEvent.description && (
                        <p className="text-blue-700 text-sm mt-2 pl-5">{relatedEvent.description}</p>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-blue-600 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Event not found or no longer available
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Company Information Section */}
            {selectedNote.companyId && getCompanyName(selectedNote.companyId) && (
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-purple-500 rounded-full"></div>
                  Company Association
                </h3>
                <div className="bg-white rounded-lg p-3 border border-purple-200">
                  <p className="text-gray-700 flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-purple-600" />
                    <span className="font-medium">{getCompanyName(selectedNote.companyId)}</span>
                  </p>
                </div>
              </div>
            )}

            {/* Tags Section */}
            {selectedNote.tags.length > 0 && (
              <div className="bg-orange-50 rounded-lg p-4 space-y-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <div className="w-1.5 h-4 bg-orange-500 rounded-full"></div>
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedNote.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="text-xs bg-white border-orange-200 text-orange-700">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Content Section */}
            <div className="bg-green-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-green-500 rounded-full"></div>
                Note Content
              </h3>
              <div className="bg-white rounded-lg p-4 border border-green-200">
                <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedNote.content}</p>
              </div>
            </div>

            {/* Metadata Section */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h3 className="font-medium text-gray-900 flex items-center gap-2">
                <div className="w-1.5 h-4 bg-gray-500 rounded-full"></div>
                Note Details
              </h3>
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        Created:
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedNote.formattedCreatedAt}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Edit className="h-3 w-3" />
                        Last Updated:
                      </span>
                      <span className="font-medium text-gray-900">
                        {selectedNote.formattedUpdatedAt}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Time Created:</span>
                      <span className="font-medium text-gray-900">
                        {selectedNote.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Time Updated:</span>
                      <span className="font-medium text-gray-900">
                        {selectedNote.updatedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>
                {selectedNote.completedAt && (
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 flex items-center gap-2">
                        <Check className="h-3 w-3 text-green-600" />
                        Completed:
                      </span>
                      <span className="font-medium text-green-700">
                        {selectedNote.formattedCompletedAt} at {selectedNote.completedAt.toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons Section */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              {selectedNote.isCompleted ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    handleRestoreNote(selectedNote.id);
                    closeDetailsDialog();
                  }}
                  className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-4"
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
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 px-4"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      handleEditNote(selectedNote);
                      closeDetailsDialog();
                    }}
                    className="px-4"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Note
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => {
                  handleDeleteNote(selectedNote.id);
                  closeDetailsDialog();
                }}
                className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4"
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