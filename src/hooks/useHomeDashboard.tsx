import { useQuery } from '@tanstack/react-query';
import { Company } from '@/types/company.types';
import { CalendarEvent, Note } from '@/types/calendar.types';
import { companyApiService } from '@/services/api';
import { CalendarService } from '@/services/api/calendarService';
import { NotesService } from '@/services/api/notesService';
import { CompanyAnniversaryService } from '@/services/business/companyAnniversaryService';

interface BusinessCard {
  id: string;
  companyId: number;
  personName?: string;
  position?: string;
  qrType: "website" | "email";
  qrValue: string;
  template: "modern" | "classic" | "minimal" | "eazy";
  createdAt: Date;
  isArchived?: boolean;
}

export interface HomeDashboardData {
  // Companies
  companies: Company[];
  activeCompanies: Company[];
  passiveCompanies: Company[];
  recentActiveCompanies: Company[];
  
  // Events
  events: CalendarEvent[];
  upcomingEventsNext30Days: CalendarEvent[];
  nextUpcomingEvents: CalendarEvent[];
  
  // Notes
  notes: Note[];
  activeNotes: Note[];
  standaloneNotesCount: number;
  eventRelatedNotesCount: number;
  
  // Business Cards (keeping empty for now as not migrated yet)
  businessCards: BusinessCard[];
  activeBusinessCards: BusinessCard[];
  
  // Stats
  stats: {
    totalCompanies: number;
    activeCompaniesCount: number;
    passiveCompaniesCount: number;
    upcomingEventsCount: number;
    activeNotesCount: number;
    activeBusinessCardsCount: number;
    archivedBusinessCardsCount: number;
  };
  
  // Loading states
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  
  // Refetch
  refetch: () => void;
}

export function useHomeDashboard(
  selectedCompany: string | number = 'all'
): HomeDashboardData {
  const calendarService = new CalendarService();
  const notesService = new NotesService();
  
  // Fetch companies
  const {
    data: companiesData,
    isLoading: companiesLoading,
    isError: companiesError,
    error: companiesErrorObj,
    refetch: refetchCompanies
  } = useQuery({
    queryKey: ['companies', 'home'],
    queryFn: () => companyApiService.getCompanies({ take: 100 }),
    staleTime: 60000, // 1 minute
  });
  
  // Fetch events
  const {
    data: eventsData,
    isLoading: eventsLoading,
    isError: eventsError,
    error: eventsErrorObj,
    refetch: refetchEvents
  } = useQuery({
    queryKey: ['events', 'home', selectedCompany],
    queryFn: () => calendarService.getEvents(1, 100, {
      companyId: selectedCompany !== 'all' ? selectedCompany.toString() : undefined,
    }),
    staleTime: 60000, // 1 minute
  });
  
  // Fetch notes
  const {
    data: notesData,
    isLoading: notesLoading,
    isError: notesError,
    error: notesErrorObj,
    refetch: refetchNotes
  } = useQuery({
    queryKey: ['notes', 'home', selectedCompany],
    queryFn: () => notesService.getNotes(1, 100, {
      companyId: selectedCompany !== 'all' ? selectedCompany.toString() : undefined,
      isCompleted: false, // Only get active notes
    }),
    staleTime: 60000, // 1 minute
  });

  // Fetch deleted anniversary event IDs
  const {
    data: deletedEventIdsData,
    isLoading: deletedEventIdsLoading,
    isError: deletedEventIdsError,
    error: deletedEventIdsErrorObj,
    refetch: refetchDeletedEventIds
  } = useQuery({
    queryKey: ['calendar', 'deleted-anniversary-events'],
    queryFn: async () => {
      const response = await fetch('/api/calendar/auto-generated/deleted');
      if (!response.ok) {
        throw new Error('Failed to fetch deleted anniversary events');
      }
      const data = await response.json();
      return data.deletedEventIds || [];
    },
    staleTime: 60000, // 1 minute
  });
  
  // Process companies
  const companies = companiesData?.data || [];
  const activeCompanies = companies.filter(c => c.status === "Active");
  const passiveCompanies = companies.filter(c => c.status === "Passive");
  const recentActiveCompanies = activeCompanies.slice(-3).reverse();
  
  // Process events
  const databaseEvents = eventsData?.events || [];
  const deletedEventIds = deletedEventIdsData || [];
  
  // Generate anniversary events for the next year
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const next30Days = new Date(today);
  next30Days.setDate(today.getDate() + 30);
  const nextYear = new Date(today);
  nextYear.setFullYear(today.getFullYear() + 1);
  
  // Filter companies based on selected company for anniversary events
  const filteredCompanies = selectedCompany === 'all' 
    ? companies 
    : companies.filter(c => c.id === selectedCompany);
  
  const anniversaryEvents = CompanyAnniversaryService.generateAnniversaryEventsForCompanies(
    filteredCompanies,
    today,
    nextYear,
    deletedEventIds
  ).map(anniversaryEvent => CompanyAnniversaryService.convertToCalendarEvent(anniversaryEvent));
  
  // Combine database events with anniversary events
  const events = [...databaseEvents, ...anniversaryEvents];
  
  const upcomingEventsNext30Days = events.filter(event => {
    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);
    return eventDate >= today && eventDate <= next30Days;
  });
  
  const nextUpcomingEvents = events
    .filter(event => {
      const eventDate = new Date(event.date);
      eventDate.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3);
  
  // Process notes
  const notes = notesData?.notes || [];
  const activeNotes = notes.filter(note => !note.isCompleted);
  const standaloneNotesCount = activeNotes.filter(note => note.isStandalone).length;
  const eventRelatedNotesCount = activeNotes.filter(note => !note.isStandalone).length;
  
  // Business cards (empty for now - not migrated yet)
  const businessCards: BusinessCard[] = [];
  const activeBusinessCards = businessCards.filter(card => !card.isArchived);
  
  // Calculate stats
  const stats = {
    totalCompanies: companies.length,
    activeCompaniesCount: activeCompanies.length,
    passiveCompaniesCount: passiveCompanies.length,
    upcomingEventsCount: upcomingEventsNext30Days.length,
    activeNotesCount: activeNotes.length,
    activeBusinessCardsCount: activeBusinessCards.length,
    archivedBusinessCardsCount: businessCards.filter(card => card.isArchived).length,
  };
  
  // Combined loading and error states
  const isLoading = companiesLoading || eventsLoading || notesLoading || deletedEventIdsLoading;
  const isError = companiesError || eventsError || notesError || deletedEventIdsError;
  const error = companiesErrorObj || eventsErrorObj || notesErrorObj || deletedEventIdsErrorObj;
  
  // Combined refetch
  const refetch = () => {
    refetchCompanies();
    refetchEvents();
    refetchNotes();
    refetchDeletedEventIds();
  };
  
  return {
    // Companies
    companies,
    activeCompanies,
    passiveCompanies,
    recentActiveCompanies,
    
    // Events
    events,
    upcomingEventsNext30Days,
    nextUpcomingEvents,
    
    // Notes
    notes,
    activeNotes,
    standaloneNotesCount,
    eventRelatedNotesCount,
    
    // Business Cards
    businessCards,
    activeBusinessCards,
    
    // Stats
    stats,
    
    // Loading states
    isLoading,
    isError,
    error,
    
    // Refetch
    refetch,
  };
}