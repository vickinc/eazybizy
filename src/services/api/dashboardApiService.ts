import { Company } from '@/types/company.types';

export interface DashboardStats {
  totalCompanies: number;
  activeCompaniesCount: number;
  passiveCompaniesCount: number;
  upcomingEventsCount: number;
  activeNotesCount: number;
  activeBusinessCardsCount: number;
  archivedBusinessCardsCount: number;
}

export class DashboardApiService {
  /**
   * Fetch complete company details including shareholders and representatives
   */
  async getCompanyDetails(companyId: number): Promise<Company> {
    const response = await fetch(`/api/companies/${companyId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch company details');
    }
    return response.json();
  }

  /**
   * Copy text to clipboard with error handling
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  /**
   * Format event date for display
   */
  formatEventDate(date: Date): string {
    const eventDate = new Date(date);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    
    // Reset hours for comparison
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);
    
    if (eventDate.getTime() === today.getTime()) {
      return "Today";
    } else if (eventDate.getTime() === tomorrow.getTime()) {
      return "Tomorrow";
    } else {
      return eventDate.toLocaleDateString('en-GB');
    }
  }

  /**
   * Get priority color class for events
   */
  getPriorityColor(priority: string): string {
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
}

// Export singleton instance
export const dashboardApiService = new DashboardApiService();