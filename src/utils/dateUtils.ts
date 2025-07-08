/**
 * Utility functions for consistent local date formatting
 * These functions ensure that dates are always formatted using local timezone
 * to avoid timezone-related issues
 */

/**
 * Get local date string in YYYY-MM-DD format
 * @param date - Date object to format (defaults to current date)
 * @returns Date string in YYYY-MM-DD format using local timezone
 */
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Get local date-time string in ISO format
 * For timestamps, ISO format is standard and appropriate
 * @param date - Date object to format (defaults to current date)
 * @returns ISO date-time string
 */
export const getLocalDateTimeString = (date: Date = new Date()): string => {
  return date.toISOString();
};

/**
 * Add days to a date
 * @param date - Base date
 * @param days - Number of days to add (can be negative)
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Get current date in local YYYY-MM-DD format
 * @returns Today's date in YYYY-MM-DD format
 */
export const getTodayString = (): string => {
  return getLocalDateString();
};

/**
 * Get date string for N days from now
 * @param days - Number of days from today
 * @returns Date string in YYYY-MM-DD format
 */
export const getDateStringFromToday = (days: number): string => {
  return getLocalDateString(addDays(new Date(), days));
};

/**
 * Format date for display in DD/MM/YYYY format
 * @param dateString - Date string in YYYY-MM-DD format or ISO datetime string
 * @returns Date string in DD/MM/YYYY format for display
 */
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  try {
    // First try to parse as a Date object (handles both YYYY-MM-DD and ISO datetime strings)
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    }
    
    // Fallback: Parse the YYYY-MM-DD format directly to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    if (year && month && day) {
      const formattedMonth = String(month).padStart(2, '0');
      const formattedDay = String(day).padStart(2, '0');
      return `${formattedDay}/${formattedMonth}/${year}`;
    }
    return dateString; // fallback to original string if parsing fails
  } catch (error) {
    return dateString; // fallback to original string if parsing fails
  }
}; 