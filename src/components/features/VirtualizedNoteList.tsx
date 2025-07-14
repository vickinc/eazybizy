import React, { useRef, useMemo } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
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

interface VirtualizedNoteListProps {
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
  height?: number; // Container height for virtualization
  itemHeight?: number; // Estimated item height
}

export const VirtualizedNoteList: React.FC<VirtualizedNoteListProps> = ({
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
  height = 600, // Default height
  itemHeight = 150 // Estimated item height for notes
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Only virtualize if we have many notes
  const shouldVirtualize = filteredNotes.length > 20;

  const virtualizer = useVirtualizer({
    count: filteredNotes.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 5, // Render 5 items before and after visible area
  });

  const virtualItems = virtualizer.getVirtualItems();

  // Memoize note items to prevent unnecessary re-renders
  const noteItems = useMemo(() => {
    return filteredNotes.map((note) => {
      const relatedEvent = note.eventId ? getFormattedEvent(note.eventId, note.event) : null;
      return {
        note,
        relatedEvent,
        component: (
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
        )
      };
    });
  }, [filteredNotes, showArchived, getFormattedEvent, getPriorityColor, getCompanyName, handleRestoreNote, handleCompleteNote, handleEditNote, handleDeleteNote, openDetailsDialog]);

  if (filteredNotes.length === 0) {
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

  if (!shouldVirtualize) {
    // For small lists, use regular rendering
    return (
      <div className="space-y-3">
        {noteItems.map((item) => item.component)}
      </div>
    );
  }

  // For large lists, use virtualization
  return (
    <div
      ref={parentRef}
      style={{
        height: `${height}px`,
        overflow: 'auto',
      }}
      className="space-y-3"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
              paddingBottom: '12px',
            }}
          >
            {noteItems[virtualItem.index]?.component}
          </div>
        ))}
      </div>
      {/* Virtualization indicator */}
      <div className="text-center text-sm text-gray-500 mt-4">
        Virtualized - {filteredNotes.length} notes
      </div>
    </div>
  );
};