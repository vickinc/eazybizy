export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: "meeting" | "deadline" | "renewal" | "anniversary" | "other";
  priority: "low" | "medium" | "high" | "critical";
  company?: string;
  participants?: string[];
  eventScope: "personal" | "company";
  isSystemGenerated?: boolean;
  companyId?: number;
  targetCalendarId?: string; // Which Google Calendar to sync to
  syncEnabled?: boolean; // Whether this event should be synced
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  eventId?: string;
  companyId?: number;
  tags: string[];
  priority: "low" | "medium" | "high" | "critical";
  isStandalone: boolean;
  isCompleted: boolean;
  completedAt?: Date;
  isAutoArchived?: boolean;
  event?: {
    id: string;
    title: string;
    date: Date;
    time: string;
  };
}

export interface CalendarEventFormData {
  title: string;
  description: string;
  date: Date;
  time: string;
  type: "meeting" | "deadline" | "renewal" | "anniversary" | "other";
  priority: "low" | "medium" | "high" | "critical";
  company: string;
  participants: string[];
  eventScope: "personal" | "company";
  targetCalendarId?: string; // Which Google Calendar to sync to
  syncEnabled?: boolean; // Whether this event should be synced
}

export interface NoteFormData {
  title: string;
  content: string;
  eventId: string;
  companyId: string;
  tags: string;
  priority: "low" | "medium" | "high" | "critical";
  isStandalone: boolean;
}