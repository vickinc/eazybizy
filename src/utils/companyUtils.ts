/**
 * Utility functions for company-related calculations and formatting
 */

/**
 * Calculate the age of a company based on its registration date
 * @param registrationDate - The registration date of the company
 * @returns Object with years, months, and formatted age string
 */
export function calculateCompanyAge(registrationDate: string | Date): {
  years: number;
  months: number;
  totalMonths: number;
  ageString: string;
} {
  if (!registrationDate) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      ageString: ''
    };
  }

  const regDate = new Date(registrationDate);
  const currentDate = new Date();
  
  // Check if registration date is in the future
  if (regDate > currentDate) {
    return {
      years: 0,
      months: 0,
      totalMonths: 0,
      ageString: '(Future date)'
    };
  }

  // Calculate the difference
  let years = currentDate.getFullYear() - regDate.getFullYear();
  let months = currentDate.getMonth() - regDate.getMonth();
  
  // Adjust for negative months
  if (months < 0) {
    years--;
    months += 12;
  }
  
  // Adjust for day of month
  if (currentDate.getDate() < regDate.getDate()) {
    months--;
    if (months < 0) {
      years--;
      months += 12;
    }
  }

  const totalMonths = years * 12 + months;

  // Format the age string
  let ageString = '';
  if (years === 0 && months === 0) {
    ageString = '(Less than 1 month)';
  } else if (years === 0) {
    ageString = `(${months} month${months !== 1 ? 's' : ''})`;
  } else if (months === 0) {
    ageString = `(${years} year${years !== 1 ? 's' : ''})`;
  } else {
    ageString = `(${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''})`;
  }

  return {
    years,
    months,
    totalMonths,
    ageString
  };
}

/**
 * Get the next anniversary date for a company
 * @param registrationDate - The registration date of the company
 * @returns The next anniversary date
 */
export function getNextAnniversaryDate(registrationDate: string | Date): Date | null {
  if (!registrationDate) return null;

  const regDate = new Date(registrationDate);
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  
  // Create anniversary date for current year
  const thisYearAnniversary = new Date(currentYear, regDate.getMonth(), regDate.getDate());
  
  // If this year's anniversary has passed, return next year's
  if (thisYearAnniversary < currentDate) {
    return new Date(currentYear + 1, regDate.getMonth(), regDate.getDate());
  }
  
  return thisYearAnniversary;
}

/**
 * Get all anniversary dates for a company within a date range
 * @param registrationDate - The registration date of the company
 * @param startDate - Start of the date range
 * @param endDate - End of the date range
 * @returns Array of anniversary dates within the range
 */
export function getAnniversaryDatesInRange(
  registrationDate: string | Date,
  startDate: Date,
  endDate: Date
): Array<{ date: Date; yearsOld: number }> {
  if (!registrationDate) return [];

  const regDate = new Date(registrationDate);
  const anniversaries: Array<{ date: Date; yearsOld: number }> = [];
  
  // Start from the year of the start date
  const startYear = startDate.getFullYear();
  const endYear = endDate.getFullYear();
  
  for (let year = startYear; year <= endYear; year++) {
    const anniversaryDate = new Date(year, regDate.getMonth(), regDate.getDate());
    
    // Only include if within range and after registration
    if (anniversaryDate >= startDate && 
        anniversaryDate <= endDate && 
        anniversaryDate >= regDate) {
      
      const yearsOld = year - regDate.getFullYear();
      anniversaries.push({
        date: anniversaryDate,
        yearsOld
      });
    }
  }
  
  return anniversaries;
}

/**
 * Format anniversary event title
 * @param companyName - Name of the company
 * @param yearsOld - How many years old the company is turning
 * @returns Formatted event title
 */
export function formatAnniversaryEventTitle(companyName: string, yearsOld: number): string {
  if (yearsOld === 0) {
    return `🎉 ${companyName} - Registration Day`;
  }
  
  const suffix = getOrdinalSuffix(yearsOld);
  return `🎂 ${companyName} - ${yearsOld}${suffix} Anniversary`;
}

/**
 * Get ordinal suffix for numbers (1st, 2nd, 3rd, etc.)
 */
function getOrdinalSuffix(num: number): string {
  const remainder10 = num % 10;
  const remainder100 = num % 100;
  
  if (remainder100 >= 11 && remainder100 <= 13) {
    return 'th';
  }
  
  switch (remainder10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

/**
 * Generate anniversary event description
 * @param companyName - Name of the company
 * @param registrationDate - Registration date
 * @param yearsOld - How many years old the company is turning
 * @returns Event description
 */
export function formatAnniversaryEventDescription(
  companyName: string,
  registrationDate: string | Date,
  yearsOld: number
): string {
  const regDate = new Date(registrationDate);
  const formattedRegDate = regDate.toLocaleDateString('en-GB');
  
  if (yearsOld === 0) {
    return `Today marks the registration day of ${companyName}! The company was registered on ${formattedRegDate}.`;
  }
  
  return `Today marks the ${yearsOld}${getOrdinalSuffix(yearsOld)} anniversary of ${companyName}! The company was registered on ${formattedRegDate}.`;
}