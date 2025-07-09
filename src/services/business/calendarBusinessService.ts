import { CalendarEvent, Note, CalendarEventFormData } from '@/types/calendar.types';
import { Company } from '@/types';

export class CalendarBusinessService {
  /**
   * Generates a unique ID for a new event
   */
  static generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Creates a new calendar event from form data
   */
  static createEventObject(formData: CalendarEventFormData): CalendarEvent {
    return {
      id: this.generateEventId(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date,
      time: formData.time,
      type: formData.type,
      priority: formData.priority,
      company: formData.company,
      participants: formData.participants || []
    };
  }

  /**
   * Updates an existing event with form data
   */
  static updateEventObject(existingEvent: CalendarEvent, formData: CalendarEventFormData): CalendarEvent {
    return {
      ...existingEvent,
      title: formData.title.trim(),
      description: formData.description.trim(),
      date: formData.date,
      time: formData.time,
      type: formData.type,
      priority: formData.priority,
      company: formData.company,
      participants: formData.participants || []
    };
  }

  /**
   * Filters events by company
   */
  static filterEventsByCompany(events: CalendarEvent[], selectedCompany: string | number, companies: Company[]): CalendarEvent[] {
    if (selectedCompany === 'all') {
      return events;
    }
    
    const selectedCompanyObj = companies.find(c => c.id === selectedCompany);
    if (!selectedCompanyObj) return [];
    
    return events.filter(event => {
      // Check by companyId first (for anniversary events and newer events)
      if (event.companyId && event.companyId === selectedCompanyObj.id) {
        return true;
      }
      
      // Fallback to company name string (for legacy events)
      if (event.company === selectedCompanyObj.tradingName) {
        return true;
      }
      
      return false;
    });
  }

  /**
   * Gets events for a specific date
   */
  static getEventsForDate(events: CalendarEvent[], date: Date): CalendarEvent[] {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    ).sort((a, b) => a.time.localeCompare(b.time));
  }

  /**
   * Gets today's events
   */
  static getTodaysEvents(events: CalendarEvent[]): CalendarEvent[] {
    const today = new Date();
    return this.getEventsForDate(events, today);
  }

  /**
   * Gets upcoming events (after today)
   */
  static getUpcomingEvents(events: CalendarEvent[], limit: number = 10): CalendarEvent[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate > today;
    }).sort((a, b) => a.date.getTime() - b.date.getTime()).slice(0, limit);
  }

  /**
   * Gets events for the current week
   */
  static getThisWeekEvents(events: CalendarEvent[]): CalendarEvent[] {
    const today = new Date();
    const startOfWeek = new Date(today);
    const endOfWeek = new Date(today);
    
    // Get start of week (Sunday)
    const dayOfWeek = today.getDay();
    startOfWeek.setDate(today.getDate() - dayOfWeek);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Get end of week (Saturday)
    endOfWeek.setDate(today.getDate() + (6 - dayOfWeek));
    endOfWeek.setHours(23, 59, 59, 999);
    
    return events.filter(event => {
      const eventDate = new Date(event.date);
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    });
  }

  /**
   * Gets priority color classes for UI
   */
  static getPriorityColor(priority: string): string {
    switch (priority) {
      case "critical": return "bg-red-100 text-red-800 border-red-200";
      case "high": return "bg-orange-100 text-orange-800 border-orange-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      default: return "bg-green-100 text-green-800 border-green-200";
    }
  }

  /**
   * Formats date for display
   */
  static formatDate(date: Date): string {
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const weekday = weekdays[date.getDay()];
    const day = date.getDate();
    const month = months[date.getMonth()];
    
    return `${weekday} ${day} ${month}`;
  }

  /**
   * Formats date for input field (YYYY-MM-DD)
   */
  static formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Parses date from input field
   */
  static parseDateFromInput(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  }

  /**
   * Gets notes for a specific event
   */
  static getNotesForEvent(notes: Note[], eventId: string): Note[] {
    return notes.filter(note => note.eventId === eventId && !note.isCompleted);
  }

  /**
   * Gets event statistics
   */
  static getEventStats(events: CalendarEvent[]): {
    total: number;
    today: number;
    thisWeek: number;
    upcoming: number;
    byPriority: { [key: string]: number };
    byType: { [key: string]: number };
  } {
    const stats = {
      total: events.length,
      today: this.getTodaysEvents(events).length,
      thisWeek: this.getThisWeekEvents(events).length,
      upcoming: this.getUpcomingEvents(events).length,
      byPriority: {} as { [key: string]: number },
      byType: {} as { [key: string]: number }
    };

    events.forEach(event => {
      // Count by priority
      stats.byPriority[event.priority] = (stats.byPriority[event.priority] || 0) + 1;
      
      // Count by type
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    });

    return stats;
  }

  /**
   * Validates if an event overlaps with existing events
   */
  static checkEventOverlap(
    newEvent: CalendarEventFormData,
    existingEvents: CalendarEvent[],
    excludeEventId?: string
  ): CalendarEvent[] {
    const newEventDateTime = new Date(newEvent.date);
    const [hours, minutes] = newEvent.time.split(':').map(Number);
    newEventDateTime.setHours(hours, minutes, 0, 0);

    return existingEvents.filter(event => {
      if (excludeEventId && event.id === excludeEventId) {
        return false;
      }

      const eventDateTime = new Date(event.date);
      const [eventHours, eventMinutes] = event.time.split(':').map(Number);
      eventDateTime.setHours(eventHours, eventMinutes, 0, 0);

      // Check if events are on the same date and time
      return eventDateTime.getTime() === newEventDateTime.getTime();
    });
  }

  /**
   * Searches events by text query
   */
  static searchEvents(events: CalendarEvent[], query: string): CalendarEvent[] {
    if (!query.trim()) {
      return events;
    }

    const searchTerm = query.toLowerCase();
    
    return events.filter(event => 
      event.title.toLowerCase().includes(searchTerm) ||
      event.description.toLowerCase().includes(searchTerm) ||
      (event.company && event.company.toLowerCase().includes(searchTerm)) ||
      event.type.toLowerCase().includes(searchTerm) ||
      event.priority.toLowerCase().includes(searchTerm)
    );
  }
}