import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Company } from '@/types/company.types';
import { CalendarEvent } from '@/types/calendar.types';
import { useHomeDashboard } from '@/hooks/useHomeDashboard';
import { dashboardApiService } from '@/services/api/dashboardApiService';

export interface DashboardManagementHook {
  // Data from useHomeDashboard
  companies: Company[];
  activeCompanies: Company[];
  recentActiveCompanies: Company[];
  nextUpcomingEvents: CalendarEvent[];
  stats: {
    totalCompanies: number;
    activeCompaniesCount: number;
    passiveCompaniesCount: number;
    upcomingEventsCount: number;
    activeNotesCount: number;
    activeBusinessCardsCount: number;
    archivedBusinessCardsCount: number;
  };
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;

  // UI State
  selectedCompany: Company | null;
  isCompanyDialogOpen: boolean;
  selectedEvent: CalendarEvent | null;
  isEventDialogOpen: boolean;
  copiedFields: Record<string, boolean>;

  // Navigation handlers
  handleAddCompany: () => void;
  handleViewCompanies: () => void;
  handleViewCalendar: () => void;
  handleViewCalendarWithDate: (date: Date) => void;

  // Dialog handlers
  handleCompanyClick: (company: Company) => void;
  handleEventClick: (event: CalendarEvent) => void;
  setIsCompanyDialogOpen: (open: boolean) => void;
  setIsEventDialogOpen: (open: boolean) => void;

  // Utility functions
  copyToClipboard: (text: string, fieldName: string, companyId: number) => Promise<void>;
  formatEventDate: (date: Date) => string;
  getPriorityColor: (priority: string) => string;
  getTypeIcon: (type: string) => React.ReactNode;
}

export function useDashboardManagement(
  globalSelectedCompany: string | number = 'all'
): DashboardManagementHook {
  const router = useRouter();
  
  // UI State
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isEventDialogOpen, setIsEventDialogOpen] = useState(false);
  const [copiedFields, setCopiedFields] = useState<Record<string, boolean>>({});

  // Fetch dashboard data
  const dashboardData = useHomeDashboard(globalSelectedCompany);

  // Navigation handlers
  const handleAddCompany = useCallback(() => {
    router.push('/companies/company-onboarding');
  }, [router]);

  const handleViewCompanies = useCallback(() => {
    router.push('/companies');
  }, [router]);

  const handleViewCalendar = useCallback(() => {
    router.push('/calendar');
  }, [router]);

  const handleViewCalendarWithDate = useCallback((date: Date) => {
    localStorage.setItem('calendar-selected-date', date.toISOString());
    router.push('/calendar');
  }, [router]);

  // Dialog handlers
  const handleCompanyClick = useCallback(async (company: Company) => {
    try {
      // Fetch complete company data with shareholders and representatives
      const fullCompanyData = await dashboardApiService.getCompanyDetails(company.id);
      setSelectedCompany(fullCompanyData);
      setIsCompanyDialogOpen(true);
    } catch (error) {
      console.error('Error fetching company details:', error);
      // Fallback to basic company data
      setSelectedCompany(company);
      setIsCompanyDialogOpen(true);
    }
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDialogOpen(true);
  }, []);

  // Copy to clipboard functionality
  const copyToClipboard = useCallback(async (text: string, fieldName: string, companyId: number) => {
    const success = await dashboardApiService.copyToClipboard(text);
    
    if (success) {
      const fieldKey = `${companyId}-${fieldName}`;
      setCopiedFields(prev => ({ ...prev, [fieldKey]: true }));
      
      setTimeout(() => {
        setCopiedFields(prev => ({ ...prev, [fieldKey]: false }));
      }, 2000);
    } else {
      toast.error(`Failed to copy ${fieldName}`);
    }
  }, []);

  // Utility functions
  const formatEventDate = useCallback((date: Date) => {
    return dashboardApiService.formatEventDate(date);
  }, []);

  const getPriorityColor = useCallback((priority: string) => {
    return dashboardApiService.getPriorityColor(priority);
  }, []);

  const getTypeIcon = useCallback((type: string) => {
    // Import icons dynamically to avoid circular dependencies
    const { Clock, AlertCircle, CalendarDays, TrendingUp, FileText } = require('lucide-react');
    
    switch (type) {
      case "meeting":
        return <Clock className="h-4 w-4" />;
      case "deadline":
        return <AlertCircle className="h-4 w-4" />;
      case "renewal":
        return <CalendarDays className="h-4 w-4" />;
      case "anniversary":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  }, []);

  return {
    // Data from useHomeDashboard
    ...dashboardData,

    // UI State
    selectedCompany,
    isCompanyDialogOpen,
    selectedEvent,
    isEventDialogOpen,
    copiedFields,

    // Navigation handlers
    handleAddCompany,
    handleViewCompanies,
    handleViewCalendar,
    handleViewCalendarWithDate,

    // Dialog handlers
    handleCompanyClick,
    handleEventClick,
    setIsCompanyDialogOpen,
    setIsEventDialogOpen,

    // Utility functions
    copyToClipboard,
    formatEventDate,
    getPriorityColor,
    getTypeIcon,
  };
}