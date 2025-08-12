/**
 * Utility service for handling period-based filtering logic
 * Provides consistent date range calculations and validation
 */

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export type PeriodPreset = 
  | 'all' 
  | 'allTime' // Alias for 'all'
  | 'today'
  | 'yesterday'
  | 'last7days' 
  | 'last30days'
  | 'thisMonth' 
  | 'lastMonth' 
  | 'last3months'
  | 'last6months'
  | 'thisYear' 
  | 'lastYear'
  | 'custom';

export class PeriodFilterService {
  /**
   * Convert period preset to actual date range
   */
  static convertPresetToDateRange(preset: PeriodPreset, customRange?: DateRange): DateRange | null {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (preset) {
      case 'all':
      case 'allTime': // Handle both 'all' and 'allTime' the same way
        // Return a very wide date range to capture all transactions
        // Start from January 1, 2010 to ensure we capture all historical blockchain data
        const startOfHistory = new Date(2010, 0, 1); // January 1, 2010
        const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 23, 59, 59, 999);
        return {
          startDate: startOfHistory,
          endDate: tomorrow
        };

      case 'today':
        return {
          startDate: startOfToday,
          endDate: endOfToday
        };

      case 'yesterday':
        const yesterday = new Date(startOfToday);
        yesterday.setDate(yesterday.getDate() - 1);
        return {
          startDate: yesterday,
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1)
        };

      case 'last7days':
        const sevenDaysAgo = new Date(startOfToday);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return {
          startDate: sevenDaysAgo,
          endDate: endOfToday
        };

      case 'last30days':
        const thirtyDaysAgo = new Date(startOfToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return {
          startDate: thirtyDaysAgo,
          endDate: endOfToday
        };

      case 'thisMonth':
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return {
          startDate: startOfMonth,
          endDate: endOfMonth
        };

      case 'lastMonth':
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return {
          startDate: lastMonth,
          endDate: endOfLastMonth
        };

      case 'last3months':
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return {
          startDate: threeMonthsAgo,
          endDate: endOfToday
        };

      case 'last6months':
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
        return {
          startDate: sixMonthsAgo,
          endDate: endOfToday
        };

      case 'thisYear':
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        return {
          startDate: startOfYear,
          endDate: endOfYear
        };

      case 'lastYear':
        const lastYear = now.getFullYear() - 1;
        const startOfLastYear = new Date(lastYear, 0, 1);
        const endOfLastYear = new Date(lastYear, 11, 31, 23, 59, 59, 999);
        return {
          startDate: startOfLastYear,
          endDate: endOfLastYear
        };

      case 'custom':
        if (customRange && this.validateDateRange(customRange.startDate, customRange.endDate)) {
          return customRange;
        }
        return null;

      default:
        return null;
    }
  }

  /**
   * Validate date range inputs
   */
  static validateDateRange(startDate: Date | null, endDate: Date | null): boolean {
    if (!startDate || !endDate) {
      return false;
    }

    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return false;
    }

    // Start date should be before or equal to end date
    if (startDate > endDate) {
      return false;
    }

    // Reasonable date range limits (not older than 2010, not in the future)
    const earliestAllowedDate = new Date(2010, 0, 1); // January 1, 2010
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (startDate < earliestAllowedDate || endDate > tomorrow) {
      return false;
    }

    return true;
  }

  /**
   * Format date range for display
   */
  static formatDateRangeForDisplay(preset: PeriodPreset, customRange?: DateRange): string {
    // Special handling for 'all' preset to show "All Time" instead of the wide date range
    if (preset === 'all') {
      return 'All Time';
    }
    
    const range = this.convertPresetToDateRange(preset, customRange);
    
    if (!range) {
      return 'All Time';
    }

    const formatOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };

    const startStr = range.startDate.toLocaleDateString('en-US', formatOptions);
    const endStr = range.endDate.toLocaleDateString('en-US', formatOptions);

    // If same day, show only one date
    if (range.startDate.toDateString() === range.endDate.toDateString()) {
      return startStr;
    }

    return `${startStr} - ${endStr}`;
  }

  /**
   * Get period preset label for UI display
   */
  static getPeriodLabel(preset: PeriodPreset): string {
    const labels: Record<PeriodPreset, string> = {
      all: 'All Time',
      today: 'Today',
      yesterday: 'Yesterday',
      last7days: 'Last 7 Days',
      last30days: 'Last 30 Days',
      thisMonth: 'This Month',
      lastMonth: 'Last Month',
      last3months: 'Last 3 Months',
      last6months: 'Last 6 Months',
      thisYear: 'This Year',
      lastYear: 'Last Year',
      custom: 'Custom Range'
    };

    return labels[preset] || 'Unknown Period';
  }

  /**
   * Convert date range to query parameters for API calls
   */
  static dateRangeToQueryParams(range: DateRange | null): Record<string, string> {
    if (!range) {
      return {};
    }

    return {
      dateFrom: range.startDate.toISOString(),
      dateTo: range.endDate.toISOString()
    };
  }

  /**
   * Parse date strings from API/form inputs
   */
  static parseDateString(dateString: string): Date | null {
    if (!dateString) {
      return null;
    }

    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  }

  /**
   * Check if a date falls within a given range
   */
  static isDateInRange(date: Date, range: DateRange): boolean {
    return date >= range.startDate && date <= range.endDate;
  }

  /**
   * Get suggested period presets for transaction filtering
   */
  static getSuggestedPeriods(): Array<{ value: PeriodPreset; label: string; description?: string }> {
    return [
      { value: 'all', label: 'All Time', description: 'Show all transactions' },
      { value: 'today', label: 'Today', description: 'Transactions from today' },
      { value: 'last7days', label: 'Last 7 Days', description: 'Last week of activity' },
      { value: 'last30days', label: 'Last 30 Days', description: 'Last month of activity' },
      { value: 'thisMonth', label: 'This Month', description: 'Current calendar month' },
      { value: 'lastMonth', label: 'Last Month', description: 'Previous calendar month' },
      { value: 'last3months', label: 'Last 3 Months', description: 'Quarter view' },
      { value: 'last6months', label: 'Last 6 Months', description: 'Half-year view' },
      { value: 'thisYear', label: 'This Year', description: 'Current calendar year' },
      { value: 'lastYear', label: 'Last Year', description: 'Previous calendar year' },
      { value: 'custom', label: 'Custom Range', description: 'Choose specific dates' }
    ];
  }
}