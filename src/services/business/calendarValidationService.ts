import { CalendarEventFormData } from '@/types/calendar.types';

export interface CalendarValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class CalendarValidationService {
  /**
   * Validates calendar event form data
   */
  static validateEventForm(formData: CalendarEventFormData): CalendarValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!formData.title.trim()) {
      errors.push('Event title is required');
    }

    if (!formData.date) {
      errors.push('Event date is required');
    }

    if (!formData.time.trim()) {
      errors.push('Event time is required');
    }

    // Date validation
    if (formData.date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const eventDate = new Date(formData.date);
      eventDate.setHours(0, 0, 0, 0);
      
      if (eventDate < today) {
        warnings.push('Event is scheduled for a past date');
      }
      
      // Check if date is too far in the future (5 years)
      const fiveYearsFromNow = new Date();
      fiveYearsFromNow.setFullYear(fiveYearsFromNow.getFullYear() + 5);
      
      if (eventDate > fiveYearsFromNow) {
        warnings.push('Event is scheduled very far in the future');
      }
    }

    // Time format validation
    if (formData.time && !this.isValidTimeFormat(formData.time)) {
      errors.push('Invalid time format');
    }

    // Title length validation
    if (formData.title.length > 100) {
      errors.push('Event title must be less than 100 characters');
    }

    // Description length validation
    if (formData.description.length > 500) {
      errors.push('Event description must be less than 500 characters');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validates time format (HH:MM)
   */
  private static isValidTimeFormat(time: string): boolean {
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    return timeRegex.test(time);
  }

  /**
   * Quick validation for real-time form updates
   */
  static validateField(fieldName: string, value: string | Date): string[] {
    const errors: string[] = [];

    switch (fieldName) {
      case 'title':
        if (!value || !value.trim()) {
          errors.push('Title is required');
        } else if (value.length > 100) {
          errors.push('Title must be less than 100 characters');
        }
        break;

      case 'description':
        if (value && value.length > 500) {
          errors.push('Description must be less than 500 characters');
        }
        break;

      case 'time':
        if (value && !this.isValidTimeFormat(value)) {
          errors.push('Invalid time format (use HH:MM)');
        }
        break;

      case 'date':
        if (!value) {
          errors.push('Date is required');
        }
        break;
    }

    return errors;
  }
}