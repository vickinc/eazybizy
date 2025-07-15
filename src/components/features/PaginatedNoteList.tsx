import React, { useState, useMemo, useCallback, startTransition } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StickyNote, Plus, ChevronDown } from "lucide-react";
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

interface PaginatedNoteListProps {
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
  initialLimit?: number; // Initial number of notes to show
  loadMoreSize?: number; // Number of notes to load on "Load More"
}

export const PaginatedNoteList: React.FC<PaginatedNoteListProps> = ({
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
  openDialog,
  initialLimit = 20, // Show 20 notes initially
  loadMoreSize = 20 // Load 20 more notes each time
}) => {
  const [displayLimit, setDisplayLimit] = useState(initialLimit);

  // Get notes to display based on current limit
  const displayedNotes = useMemo(() => {
    return filteredNotes.slice(0, displayLimit);
  }, [filteredNotes, displayLimit]);
  
  // Memoize expensive calculations
  const { hasMoreNotes, remainingCount, totalCount } = useMemo(() => ({
    hasMoreNotes: displayLimit < filteredNotes.length,
    remainingCount: filteredNotes.length - displayLimit,
    totalCount: filteredNotes.length
  }), [displayLimit, filteredNotes.length]);

  // Load more notes with transition for smooth UI
  const handleLoadMore = useCallback(() => {
    startTransition(() => {
      setDisplayLimit(prev => prev + loadMoreSize);
    });
  }, [loadMoreSize]);

  // Reset display limit when filteredNotes change (new search/filter)
  React.useEffect(() => {
    startTransition(() => {
      setDisplayLimit(initialLimit);
    });
  }, [filteredNotes.length, initialLimit]);

  if (totalCount === 0) {
    return (
      <Card className="p-12 text-center">
        <StickyNote className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {showArchived ? "No archived notes" : "No notes yet"}
        </h3>
        <p className="text-gray-600 mb-6">
          {showArchived 
            ? "Notes will appear here when completed or auto-archived."
            : "Create your first note to get started."
          }
        </p>
        {!showArchived && (
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={openDialog}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Note
          </Button>
        )}
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Notes List */}
      <div className="space-y-3">
        {displayedNotes.map((note) => {
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
        })}
      </div>

      {/* Load More Button */}
      {hasMoreNotes && (
        <div className="flex flex-col items-center justify-center py-6">
          <p className="text-sm text-gray-600 mb-4">
            Showing {displayedNotes.length} of {totalCount} notes
            {remainingCount > 0 && ` (${remainingCount} more)`}
          </p>
          <button
            onClick={handleLoadMore}
            className="flex items-center gap-2 px-4 py-2 bg-lime-300 text-black rounded-md hover:bg-lime-400 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            <ChevronDown className="h-4 w-4" />
            Load More ({Math.min(loadMoreSize, remainingCount)} notes)
          </button>
        </div>
      )}

      {/* Summary when all notes are loaded */}
      {!hasMoreNotes && totalCount > initialLimit && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            All {totalCount} notes loaded
          </p>
        </div>
      )}
    </div>
  );
};