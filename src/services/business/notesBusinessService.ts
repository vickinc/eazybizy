import { Note, CalendarEvent, NoteFormData } from '@/types/calendar.types';
import { Company } from '@/types';

export type NoteSortOption = "event-soon" | "last-updated" | "last-created" | "first-created" | "event-first" | "standalone-first";
export type NoteFilterType = "all" | "standalone" | "event-related";

export class NotesBusinessService {
  /**
   * Create a new note object from form data
   */
  static createNoteObject(formData: NoteFormData): Note {
    const now = new Date();
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    return {
      id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: formData.title.trim(),
      content: formData.content.trim(),
      createdAt: now,
      updatedAt: now,
      eventId: formData.isStandalone ? undefined : (formData.eventId && formData.eventId !== "none" ? formData.eventId : undefined),
      companyId: formData.companyId && formData.companyId !== "none" ? parseInt(formData.companyId) : undefined,
      tags: tagsArray,
      priority: formData.priority,
      isStandalone: formData.isStandalone,
      isCompleted: false,
      completedAt: undefined,
      isAutoArchived: false
    };
  }

  /**
   * Update an existing note object with form data
   */
  static updateNoteObject(existingNote: Note, formData: NoteFormData): Note {
    const now = new Date();
    const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '');

    return {
      ...existingNote,
      title: formData.title.trim(),
      content: formData.content.trim(),
      updatedAt: now,
      eventId: formData.isStandalone ? undefined : (formData.eventId && formData.eventId !== "none" ? formData.eventId : undefined),
      companyId: formData.companyId && formData.companyId !== "none" ? parseInt(formData.companyId) : undefined,
      tags: tagsArray,
      priority: formData.priority,
      isStandalone: formData.isStandalone
    };
  }

  /**
   * Filter notes based on various criteria
   */
  static filterNotes(
    notes: Note[],
    filters: {
      showArchived: boolean;
      searchTerm: string;
      filterType: NoteFilterType;
      filterPriority: string;
      globalSelectedCompany: string | number;
    }
  ): Note[] {
    return notes.filter(note => {
      // Archive filter
      const matchesArchiveView = filters.showArchived ? note.isCompleted : !note.isCompleted;
      
      // Search filter
      const matchesSearch = note.title.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           note.content.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                           note.tags.some(tag => tag.toLowerCase().includes(filters.searchTerm.toLowerCase()));
      
      // Type filter
      const matchesType = filters.filterType === "all" ||
                         (filters.filterType === "standalone" && note.isStandalone) ||
                         (filters.filterType === "event-related" && !note.isStandalone);
      
      // Priority filter
      const matchesPriority = filters.filterPriority === "all" || note.priority === filters.filterPriority;
      
      // Global company filter
      const matchesGlobalCompanyFilter = filters.globalSelectedCompany === 'all' ||
                                        (note.companyId === filters.globalSelectedCompany);
      
      return matchesArchiveView && matchesSearch && matchesType && matchesPriority && matchesGlobalCompanyFilter;
    });
  }

  /**
   * Sort notes based on selected sort option
   */
  static sortNotes(notes: Note[], sortBy: NoteSortOption, events: CalendarEvent[]): Note[] {
    const getEvent = (eventId?: string) => {
      if (!eventId) return null;
      return events.find(e => e.id === eventId) || null;
    };

    return [...notes].sort((a, b) => {
      switch (sortBy) {
        case "last-updated":
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
        case "last-created":
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        
        case "first-created":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        
        case "event-first":
          // Event-related notes first, then by last updated
          if (a.isStandalone !== b.isStandalone) {
            return a.isStandalone ? 1 : -1;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
        case "standalone-first":
          // Standalone notes first, then by last updated
          if (a.isStandalone !== b.isStandalone) {
            return a.isStandalone ? -1 : 1;
          }
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        
        case "event-soon":
        default:
          // Event-related notes sorted by event date (soonest first), then standalone notes
          if (a.isStandalone !== b.isStandalone) {
            return a.isStandalone ? 1 : -1;
          }
          
          if (!a.isStandalone && !b.isStandalone) {
            // Both are event-related, sort by event date
            const eventA = a.eventId ? getEvent(a.eventId) : null;
            const eventB = b.eventId ? getEvent(b.eventId) : null;
            
            if (eventA && eventB) {
              const dateA = new Date(eventA.date).getTime();
              const dateB = new Date(eventB.date).getTime();
              return dateA - dateB; // Soonest first
            } else if (eventA) {
              return -1;
            } else if (eventB) {
              return 1;
            }
          }
          
          // Fallback to last updated for standalone notes or when events are missing
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      }
    });
  }

  /**
   * Get priority color class for styling
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case "critical":
        return "bg-red-50 border-red-200 text-red-800";
      case "high":
        return "bg-orange-50 border-orange-200 text-orange-800";
      case "medium":
        return "bg-yellow-50 border-yellow-200 text-yellow-800";
      default:
        return "bg-blue-50 border-blue-200 text-blue-800";
    }
  }

  /**
   * Get company name by ID
   */
  static getCompanyName(companyId: number | undefined, companies: Company[]): string | null {
    if (!companyId) return null;
    const company = companies.find(c => c.id === companyId);
    return company ? company.tradingName : `Company ${companyId}`;
  }

  /**
   * Get event title by ID
   */
  static getEventTitle(eventId: string | undefined, events: CalendarEvent[]): string | null {
    if (!eventId) return null;
    const event = events.find(e => e.id === eventId);
    return event ? event.title : `Event ${eventId}`;
  }

  /**
   * Get event object by ID
   */
  static getEvent(eventId: string | undefined, events: CalendarEvent[]): CalendarEvent | null {
    if (!eventId) return null;
    return events.find(e => e.id === eventId) || null;
  }

  /**
   * Auto-archive expired event notes
   */
  static getNotesToAutoArchive(notes: Note[], events: CalendarEvent[]): Note[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return notes
      .filter(note => !note.isStandalone && note.eventId && !note.isCompleted)
      .map(note => {
        const relatedEvent = this.getEvent(note.eventId, events);
        if (relatedEvent) {
          const eventDate = new Date(relatedEvent.date);
          eventDate.setHours(23, 59, 59, 999); // End of event day
          
          // If event date has passed, mark for auto-archiving
          if (today > eventDate) {
            return {
              ...note,
              isCompleted: true,
              completedAt: new Date(),
              isAutoArchived: true,
              updatedAt: new Date()
            };
          }
        }
        return note;
      })
      .filter(note => note.isCompleted && note.isAutoArchived); // Only return notes that were auto-archived
  }

  /**
   * Apply auto-archiving to notes array
   */
  static applyAutoArchiving(notes: Note[], events: CalendarEvent[]): Note[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return notes.map(note => {
      if (!note.isStandalone && note.eventId && !note.isCompleted) {
        const relatedEvent = this.getEvent(note.eventId, events);
        if (relatedEvent) {
          const eventDate = new Date(relatedEvent.date);
          eventDate.setHours(23, 59, 59, 999); // End of event day
          
          // If event date has passed, auto-archive the note
          if (today > eventDate) {
            return {
              ...note,
              isCompleted: true,
              completedAt: new Date(),
              isAutoArchived: true,
              updatedAt: new Date()
            };
          }
        }
      }
      return note;
    });
  }

  /**
   * Complete a note by setting completion status and timestamp
   */
  static completeNote(note: Note): Note {
    return {
      ...note,
      isCompleted: true,
      completedAt: new Date(),
      updatedAt: new Date(),
      isAutoArchived: false
    };
  }

  /**
   * Restore a completed note back to active status
   */
  static restoreNote(note: Note): Note {
    return {
      ...note,
      isCompleted: false,
      completedAt: undefined,
      updatedAt: new Date(),
      isAutoArchived: false
    };
  }

  /**
   * Format form data from existing note for editing
   */
  static formatFormDataFromNote(note: Note): NoteFormData {
    return {
      title: note.title,
      content: note.content,
      eventId: note.eventId || "none",
      companyId: note.companyId ? note.companyId.toString() : "none",
      tags: note.tags.join(', '),
      priority: note.priority,
      isStandalone: note.isStandalone
    };
  }
}