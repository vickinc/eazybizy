/**
 * Service for managing company anniversary events
 */

import { CalendarEvent } from '@/types/calendar.types';
import { Company } from '@/types/company.types';
import { 
  getAnniversaryDatesInRange, 
  formatAnniversaryEventTitle, 
  formatAnniversaryEventDescription 
} from '@/utils/companyUtils';

export interface AnniversaryEventData {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  type: 'anniversary';
  priority: 'medium';
  companyId: number;
  companyName: string;
  yearsOld: number;
  isSystemGenerated: true;
}

export class CompanyAnniversaryService {
  
  /**
   * Generate anniversary events for a single company within a date range
   */
  static generateAnniversaryEvents(
    company: Company,
    startDate: Date,
    endDate: Date
  ): AnniversaryEventData[] {
    if (!company.registrationDate) {
      return [];
    }

    const anniversaries = getAnniversaryDatesInRange(
      company.registrationDate,
      startDate,
      endDate
    );

    return anniversaries.map(({ date, yearsOld }) => ({
      id: `anniversary-${company.id}-${date.getFullYear()}`,
      title: formatAnniversaryEventTitle(company.tradingName, yearsOld),
      description: formatAnniversaryEventDescription(
        company.tradingName,
        company.registrationDate!,
        yearsOld
      ),
      date,
      time: '09:00', // Default to 9 AM
      type: 'anniversary' as const,
      priority: 'medium' as const,
      companyId: company.id,
      companyName: company.tradingName,
      yearsOld,
      isSystemGenerated: true as const
    }));
  }

  /**
   * Generate anniversary events for multiple companies
   */
  static generateAnniversaryEventsForCompanies(
    companies: Company[],
    startDate: Date,
    endDate: Date
  ): AnniversaryEventData[] {
    const allEvents: AnniversaryEventData[] = [];

    for (const company of companies) {
      if (company.status === 'Active' && company.registrationDate) {
        const events = this.generateAnniversaryEvents(company, startDate, endDate);
        allEvents.push(...events);
      }
    }

    // Sort by date
    return allEvents.sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  /**
   * Convert anniversary event data to calendar event format
   */
  static convertToCalendarEvent(anniversaryEvent: AnniversaryEventData): CalendarEvent {
    // Create a unique numeric ID by combining company ID and year
    const yearPart = anniversaryEvent.date.getFullYear();
    const companyPart = anniversaryEvent.companyId;
    const uniqueId = parseInt(`${companyPart}${yearPart}`);
    
    return {
      id: uniqueId,
      title: anniversaryEvent.title,
      description: anniversaryEvent.description,
      date: anniversaryEvent.date,
      time: anniversaryEvent.time,
      type: anniversaryEvent.type,
      priority: anniversaryEvent.priority,
      companyId: anniversaryEvent.companyId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  /**
   * Get anniversary events for the current year
   */
  static getCurrentYearAnniversaryEvents(companies: Company[]): AnniversaryEventData[] {
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1); // January 1st
    const endDate = new Date(currentYear, 11, 31); // December 31st

    return this.generateAnniversaryEventsForCompanies(companies, startDate, endDate);
  }

  /**
   * Get upcoming anniversary events (next 30 days)
   */
  static getUpcomingAnniversaryEvents(companies: Company[]): AnniversaryEventData[] {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30); // Next 30 days

    return this.generateAnniversaryEventsForCompanies(companies, startDate, endDate);
  }

  /**
   * Get anniversary events for a specific month
   */
  static getMonthlyAnniversaryEvents(
    companies: Company[], 
    year: number, 
    month: number
  ): AnniversaryEventData[] {
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0); // Last day of month

    return this.generateAnniversaryEventsForCompanies(companies, startDate, endDate);
  }

  /**
   * Check if a date is a company anniversary
   */
  static isAnniversaryDate(company: Company, checkDate: Date): {
    isAnniversary: boolean;
    yearsOld?: number;
  } {
    if (!company.registrationDate) {
      return { isAnniversary: false };
    }

    const regDate = new Date(company.registrationDate);
    
    // Check if month and day match
    if (regDate.getMonth() === checkDate.getMonth() && 
        regDate.getDate() === checkDate.getDate()) {
      
      const yearsOld = checkDate.getFullYear() - regDate.getFullYear();
      
      // Make sure the anniversary date is not before registration
      if (checkDate >= regDate) {
        return { isAnniversary: true, yearsOld };
      }
    }

    return { isAnniversary: false };
  }

  /**
   * Get all companies having anniversaries on a specific date
   */
  static getCompaniesWithAnniversariesOnDate(
    companies: Company[], 
    date: Date
  ): Array<{ company: Company; yearsOld: number }> {
    const result: Array<{ company: Company; yearsOld: number }> = [];

    for (const company of companies) {
      if (company.status === 'Active') {
        const anniversaryCheck = this.isAnniversaryDate(company, date);
        if (anniversaryCheck.isAnniversary && anniversaryCheck.yearsOld !== undefined) {
          result.push({
            company,
            yearsOld: anniversaryCheck.yearsOld
          });
        }
      }
    }

    return result;
  }

  /**
   * Format multiple anniversaries for a single date
   */
  static formatMultipleAnniversariesTitle(
    anniversaries: Array<{ company: Company; yearsOld: number }>
  ): string {
    if (anniversaries.length === 0) return '';
    if (anniversaries.length === 1) {
      const { company, yearsOld } = anniversaries[0];
      return formatAnniversaryEventTitle(company.tradingName, yearsOld);
    }

    return `🎉 ${anniversaries.length} Company Anniversaries`;
  }

  /**
   * Format multiple anniversaries description
   */
  static formatMultipleAnniversariesDescription(
    anniversaries: Array<{ company: Company; yearsOld: number }>
  ): string {
    if (anniversaries.length === 0) return '';
    if (anniversaries.length === 1) {
      const { company, yearsOld } = anniversaries[0];
      return formatAnniversaryEventDescription(
        company.tradingName,
        company.registrationDate!,
        yearsOld
      );
    }

    const descriptions = anniversaries.map(({ company, yearsOld }) => {
      const suffix = yearsOld === 0 ? 'registration day' : 
                   yearsOld === 1 ? '1st anniversary' :
                   yearsOld === 2 ? '2nd anniversary' :
                   yearsOld === 3 ? '3rd anniversary' :
                   `${yearsOld}th anniversary`;
      return `• ${company.tradingName} - ${suffix}`;
    });

    return `Multiple companies are celebrating anniversaries today:\n\n${descriptions.join('\n')}`;
  }
}