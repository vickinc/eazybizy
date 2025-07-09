import { Note } from '@/types/calendar.types';

const NOTES_STORAGE_KEY = 'app-notes';

export class NotesStorageService {
  // Notes storage
  static getNotes(): Note[] {
    try {
      const savedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
      if (savedNotes) {
        return JSON.parse(savedNotes).map((note: Note & { 
          createdAt: string; 
          updatedAt: string; 
          completedAt?: string;
        }) => ({
          ...note,
          createdAt: new Date(note.createdAt),
          updatedAt: new Date(note.updatedAt),
          completedAt: note.completedAt ? new Date(note.completedAt) : undefined
        }));
      }
    } catch (error) {
      console.error('Error loading notes from localStorage:', error);
    }
    return [];
  }

  static saveNotes(notes: Note[]): boolean {
    try {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
      return true;
    } catch (error) {
      console.error('Error saving notes to localStorage:', error);
      return false;
    }
  }

  static addNote(note: Note): boolean {
    try {
      const existingNotes = this.getNotes();
      const updatedNotes = [note, ...existingNotes];
      return this.saveNotes(updatedNotes);
    } catch (error) {
      console.error('Error adding note:', error);
      return false;
    }
  }

  static updateNote(noteId: string, updatedNote: Note): boolean {
    try {
      const existingNotes = this.getNotes();
      const updatedNotes = existingNotes.map(note => 
        note.id === noteId ? updatedNote : note
      );
      return this.saveNotes(updatedNotes);
    } catch (error) {
      console.error('Error updating note:', error);
      return false;
    }
  }

  static deleteNote(noteId: string): boolean {
    try {
      const existingNotes = this.getNotes();
      const updatedNotes = existingNotes.filter(note => note.id !== noteId);
      return this.saveNotes(updatedNotes);
    } catch (error) {
      console.error('Error deleting note:', error);
      return false;
    }
  }

  static completeNote(noteId: string, isAutoArchived: boolean = false): boolean {
    try {
      const existingNotes = this.getNotes();
      const updatedNotes = existingNotes.map(note => 
        note.id === noteId 
          ? {
              ...note,
              isCompleted: true,
              completedAt: new Date(),
              updatedAt: new Date(),
              isAutoArchived
            }
          : note
      );
      return this.saveNotes(updatedNotes);
    } catch (error) {
      console.error('Error completing note:', error);
      return false;
    }
  }

  static restoreNote(noteId: string): boolean {
    try {
      const existingNotes = this.getNotes();
      const updatedNotes = existingNotes.map(note => 
        note.id === noteId 
          ? {
              ...note,
              isCompleted: false,
              completedAt: undefined,
              updatedAt: new Date(),
              isAutoArchived: false
            }
          : note
      );
      return this.saveNotes(updatedNotes);
    } catch (error) {
      console.error('Error restoring note:', error);
      return false;
    }
  }
}