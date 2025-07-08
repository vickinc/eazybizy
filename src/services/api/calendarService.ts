import { CalendarEvent, Note } from '@/types/calendar.types';

// API Response Types
export interface CalendarEventResponse {
  id: string;
  title: string;
  description: string;
  date: string; // ISO string from API
  time: string;
  type: string;
  priority: string;
  company?: string;
  participants: string | string[]; // JSON string from API or array
  companyId?: number;
  createdAt: string;
  updatedAt: string;
  notes?: NoteResponse[];
  companyRecord?: {
    id: number;
    legalName: string;
    tradingName: string;
  };
}

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

export interface CalendarEventsPaginatedResponse {
  events: CalendarEventResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CalendarEventsCursorResponse {
  events: CalendarEventResponse[];
  pagination: {
    hasMore: boolean;
    nextCursor: string | null;
    limit: number;
    count: number;
  };
}

export interface CalendarStatisticsResponse {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
  eventsByType: Array<{ type: string; count: number }>;
  eventsByPriority: Array<{ priority: string; count: number }>;
  eventsByMonth: Array<{ month: string; count: number }>;
  lastUpdated: string;
}

export interface CalendarEventFilters {
  companyId?: string;
  type?: string;
  priority?: string;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface CalendarEventCreateRequest {
  title: string;
  description?: string;
  date: string; // ISO string
  time: string;
  type?: string;
  priority?: string;
  company?: string;
  participants?: string[];
  companyId?: number;
}

export interface CalendarEventUpdateRequest {
  title?: string;
  description?: string;
  date?: string; // ISO string
  time?: string;
  type?: string;
  priority?: string;
  company?: string;
  participants?: string[];
  companyId?: number;
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

export class CalendarService {
  private baseUrl = '/api/calendar';

  // Transform API response to client format
  private transformEventResponse(event: CalendarEventResponse): CalendarEvent {
    let participants: string[] = [];
    
    // Safely handle participants field - could be string (JSON) or array
    if (event.participants) {
      if (Array.isArray(event.participants)) {
        participants = event.participants;
      } else if (typeof event.participants === 'string' && event.participants.trim()) {
        try {
          const parsed = JSON.parse(event.participants);
          participants = Array.isArray(parsed) ? parsed : [];
        } catch (error) {
          console.warn('Failed to parse participants JSON for event:', event.title, 'Data:', event.participants);
          participants = [];
        }
      }
    }
    
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      date: new Date(event.date),
      time: event.time,
      type: event.type.toLowerCase() as CalendarEvent['type'],
      priority: event.priority.toLowerCase() as CalendarEvent['priority'],
      company: event.company,
      participants
    };
  }

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
      updatedAt: new Date(note.updatedAt)
    };
  }

  // Calendar Events API
  async getEvents(
    page: number = 1,
    limit: number = 50,
    filters: CalendarEventFilters = {}
  ): Promise<{ events: CalendarEvent[]; pagination: CalendarEventsPaginatedResponse['pagination'] }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    const response = await fetch(`${this.baseUrl}/events/fast?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events: ${response.statusText}`);
    }

    const data: CalendarEventsPaginatedResponse = await response.json();
    return {
      events: data.events.map(event => this.transformEventResponse(event)),
      pagination: data.pagination
    };
  }

  async getEventsWithCursor(
    cursor?: string,
    limit: number = 20,
    sortDirection: 'asc' | 'desc' = 'desc',
    filters: CalendarEventFilters = {}
  ): Promise<{ events: CalendarEvent[]; pagination: CalendarEventsCursorResponse['pagination'] }> {
    const params = new URLSearchParams({
      limit: limit.toString(),
      sortDirection,
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    });

    if (cursor) {
      params.set('cursor', cursor);
    }

    const response = await fetch(`${this.baseUrl}/events/cursor?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch events with cursor: ${response.statusText}`);
    }

    const data: CalendarEventsCursorResponse = await response.json();
    return {
      events: data.events.map(event => this.transformEventResponse(event)),
      pagination: data.pagination
    };
  }

  async getEvent(id: string): Promise<CalendarEvent> {
    const response = await fetch(`${this.baseUrl}/events/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch event: ${response.statusText}`);
    }

    const event: CalendarEventResponse = await response.json();
    return this.transformEventResponse(event);
  }

  async createEvent(eventData: CalendarEventCreateRequest): Promise<CalendarEvent> {
    const response = await fetch(`${this.baseUrl}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create event: ${response.statusText}`);
    }

    const event: CalendarEventResponse = await response.json();
    return this.transformEventResponse(event);
  }

  async updateEvent(id: string, eventData: CalendarEventUpdateRequest): Promise<CalendarEvent> {
    const response = await fetch(`${this.baseUrl}/events/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update event: ${response.statusText}`);
    }

    const event: CalendarEventResponse = await response.json();
    return this.transformEventResponse(event);
  }

  async deleteEvent(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/events/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete event: ${response.statusText}`);
    }
  }

  // Calendar Statistics
  async getStatistics(companyId?: string): Promise<CalendarStatisticsResponse> {
    const params = new URLSearchParams();
    if (companyId && companyId !== 'all') {
      params.set('companyId', companyId);
    }

    const response = await fetch(`${this.baseUrl}/events/statistics?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch statistics: ${response.statusText}`);
    }

    return response.json();
  }

  async invalidateStatistics(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/events/statistics/invalidate`, {
      method: 'POST'
    });

    if (!response.ok) {
      throw new Error(`Failed to invalidate statistics: ${response.statusText}`);
    }
  }

  // Notes API
  async getNotes(
    page: number = 1,
    limit: number = 50,
    filters: {
      eventId?: string;
      companyId?: string;
      priority?: string;
      isCompleted?: boolean;
      isStandalone?: boolean;
      search?: string;
    } = {}
  ): Promise<{ notes: Note[]; pagination: any }> {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters)
          .filter(([_, value]) => value !== undefined && value !== '')
          .map(([key, value]) => [key, value.toString()])
      )
    });

    const response = await fetch(`${this.baseUrl}/notes?${params}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch notes: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      notes: data.notes.map((note: NoteResponse) => this.transformNoteResponse(note)),
      pagination: data.pagination
    };
  }

  async getNote(id: string): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/notes/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch note: ${response.statusText}`);
    }

    const note: NoteResponse = await response.json();
    return this.transformNoteResponse(note);
  }

  async createNote(noteData: NoteCreateRequest): Promise<Note> {
    const response = await fetch(`${this.baseUrl}/notes`, {
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
    const response = await fetch(`${this.baseUrl}/notes/${id}`, {
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
    const response = await fetch(`${this.baseUrl}/notes/${id}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      throw new Error(`Failed to delete note: ${response.statusText}`);
    }
  }
}