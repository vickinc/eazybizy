import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus } from "lucide-react";
import { NoteItem } from './NoteItem';
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

interface NoteListProps {
  filteredNotes: Array<Note & {
    formattedUpdatedAt: string;
    formattedCompletedAt?: string;
    formattedCreatedAt: string;
  }>;
  showArchived: boolean;
  getFormattedEvent: (eventId: string, noteEvent?: Note['event']) => FormattedEvent | null;
  getPriorityColor: (priority: string) => string;
  getCompanyName: (companyId?: number) => string | null;
  handleRestoreNote: (noteId: string) => void;
  handleCompleteNote: (noteId: string) => void;
  handleEditNote: (note: Note) => void;
  handleDeleteNote: (noteId: string) => void;
  openDetailsDialog: (note: Note) => void;
  openDialog: () => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  filteredNotes,
  showArchived,
  getFormattedEvent,
  getPriorityColor,
  getCompanyName,
  handleRestoreNote,
  handleCompleteNote,
  handleEditNote,
  handleDeleteNote,
  openDetailsDialog,
  openDialog
}) => {
  return (
    <div className="space-y-3">
      {filteredNotes.length > 0 ? (
        filteredNotes.map((note) => {
          const relatedEvent = note.eventId ? getFormattedEvent(note.eventId, note.event) : null;
          return (
            <NoteItem
              key={note.id}
              note={note}
              showArchived={showArchived}
              relatedEvent={relatedEvent}
              getPriorityColor={getPriorityColor}
              getCompanyName={getCompanyName}
              handleRestoreNote={handleRestoreNote}
              handleCompleteNote={handleCompleteNote}
              handleEditNote={handleEditNote}
              handleDeleteNote={handleDeleteNote}
              openDetailsDialog={openDetailsDialog}
            />
          );
        })
      ) : (
        <Card className="p-12 text-center">
          <StickyNote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {showArchived ? "No archived notes" : (filteredNotes.length === 0 ? "No notes yet" : "No notes match your filters")}
          </h3>
          <p className="text-gray-600 mb-6">
            {showArchived 
              ? "Notes will appear here when completed or auto-archived."
              : (filteredNotes.length === 0 
                ? "Create your first note to get started." 
                : "Try adjusting your search or filter criteria.")
            }
          </p>
          {!showArchived && filteredNotes.length === 0 && (
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={openDialog}>
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Note
            </Button>
          )}
        </Card>
      )}
    </div>
  );
};