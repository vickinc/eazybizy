import { Note } from '@/types/calendar.types';

// API Response Types
export interface NoteResponse {
  id: string;
  title: string;
  content: string;
  eventId?: string;
  companyId?: number;
  tags: string | string[]; // JSON string from API or array
  priority: string;
  isStandalone: boolean;
  isCompleted: boolean;
  completedAt?: string;
  isAutoArchived: boolean;
  createdAt: string;
  updatedAt: string;
  event?: {
    id: string;
    title: string;
    date: string;
    time: string;
  };
  company?: {
    id: number;
    legalName: string;
    tradingName: string;
  };
}

export interface NotesPaginatedResponse {
  notes: NoteResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface NotesCursorResponse {
  notes: NoteResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
    count: number;
  };
}

export interface NotesStatisticsResponse {
  totalNotes: number;
  completedNotes: number;
  activeNotes: number;
  standaloneNotes: number;
  linkedNotes: number;
  notesByPriority: Array<{ priority: string; count: number }>;
  notesByMonth: Array<{ month: string; count: number }>;
  notesByCompany: Array<{ companyId: number; companyName: string; count: number }>;
  lastUpdated: string;
}

export interface NotesFilters {
  companyId?: string;
  eventId?: string;
  priority?: string;
  isCompleted?: boolean;
  isStandalone?: boolean;
  search?: string;
}

export interface NoteCreateRequest {
  title: string;
  content: string;
  eventId?: string;
  companyId?: number;
  tags?: string[];
  priority?: string;
  isStandalone?: boolean;
}

export interface NoteUpdateRequest {
  title?: string;
  content?: string;
  tags?: string[];
  priority?: string;
  isCompleted?: boolean;
  isStandalone?: boolean;
  eventId?: string;
  companyId?: number;
}

export class NotesService {
  private baseUrl = '/api/notes';

  // Transform API response to client format
  private transformNoteResponse(note: NoteResponse): Note {
    let tags: string[] = [];
    
    // Safely handle tags field - could be string (JSON) or array
    if (note.tags) {
      if (Array.isArray(note.tags)) {
        tags = note.tags;
      } else if (typeof note.tags === 'string' && note.tags.trim()) {
        try {
          const parsed = JSON.parse(note.tags);
          tags = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn('Failed to parse tags JSON for note:', note.title, 'Data:', note.tags);
          tags = [];
        }
      }
    }
    
    // Transform event data if present
    let event: Note['event'] = undefined;
    if (note.event) {
      event = {
        id: note.event.id,
        title: note.event.title,
        date: new Date(note.event.date),
        time: note.event.time
      };
    }
    
    return {
      id: note.id,
      title: note.title,
      content: note.content,
      eventId: note.eventId,
      companyId: note.companyId,
      tags,
      priority: note.priority.toLowerCase() as Note['priority'],
      isStandalone: note.isStandalone,
      isCompleted: note.isCompleted,
      completedAt: note.completedAt ? new Date(note.completedAt) : undefined,
      isAutoArchived: note.isAutoArchived,
      createdAt: new Date(note.createdAt),
      updatedAt: new Date(note.updatedAt),
      event
    };
  }

  // Notes API
  async getNotes(
    page: number = 1,
    limit: number = 50,
    filters: NotesFilters = {}
  ): Promise<{ notes: Note[]; pagination: NotesPaginatedResponse['pagination'] }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, value.toString()])
      )
    });

    const response = await fetch(`${this.baseUrl}/fast?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`);
    }

    const data: NotesPaginatedResponse = await response.json();
    return {
      notes: data.notes.map(note => this.transformNoteResponse(note)),
      pagination: data.pagination
    };
  }

  async getNotesWithCursor(
    cursor?: string,
    limit: number = 20,
    sortDirection: 'asc' | 'desc' = 'desc',
    filters: NotesFilters = {}
  ): Promise<{ notes: Note[]; pagination: NotesCursorResponse['pagination'] }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sortDirection,
      ...Object.fromEntries(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, value.toString()])
      )
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${this.baseUrl}/cursor?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notes with cursor: ${response.statusText}`);
    }

    const data: NotesCursorResponse = await response.json();
    return {
      notes: data.notes.map(note => this.transformNoteResponse(note)),
      pagination: data.pagination
    };
  }

  async getNote(id: string): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`);
    }

    const note: NoteResponse = await response.json();
    return this.transformNoteResponse(note);
  }

  async createNote(noteData: NoteCreateRequest): Promise<Note> {
    const response = await fetch(`${this.baseUrl}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create note: ${response.statusText}`);
    }

    const note: NoteResponse = await response.json();
    return this.transformNoteResponse(note);
  }

  async updateNote(id: string, noteData: NoteUpdateRequest): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(noteData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update note: ${response.statusText}`);
    }

    const note: NoteResponse = await response.json();
    return this.transformNoteResponse(note);
  }

  async deleteNote(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete note: ${response.statusText}`);
    }
  }

  // Notes Statistics
  async getStatistics(companyId?: string): Promise<NotesStatisticsResponse> {
    const params = new URLSearchParams();
    if (companyId && companyId !== 'all') {
      params.set('companyId', companyId);
    }

    const response = await fetch(`${this.baseUrl}/statistics?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }
}