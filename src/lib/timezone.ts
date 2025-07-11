import { formatInTimeZone, toZonedTime } from 'date-fns-tz';

export interface TimezoneInfo {
  id: string;
  name: string;
  offset: string;
  abbreviation: string;
  isDST: boolean;
}

// Common timezones
export const COMMON_TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Vancouver',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Amsterdam',
  'Europe/Rome',
  'Europe/Madrid',
  'Europe/Stockholm',
  'Europe/Helsinki',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Asia/Singapore',
  'Asia/Seoul',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Australia/Sydney',
  'Australia/Melbourne',
  'Australia/Perth',
  'Pacific/Auckland',
  'Pacific/Honolulu'
];

export function getTimezoneInfo(timezoneId: string): TimezoneInfo {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en', {
    timeZone: timezoneId,
    timeZoneName: 'long'
  });
  
  const parts = formatter.formatToParts(now);
  const timeZoneName = parts.find(part => part.type === 'timeZoneName')?.value || timezoneId;
  
  const offsetFormatter = new Intl.DateTimeFormat('en', {
    timeZone: timezoneId,
    timeZoneName: 'short'
  });
  
  const offsetParts = offsetFormatter.formatToParts(now);
  const abbreviation = offsetParts.find(part => part.type === 'timeZoneName')?.value || '';
  
  // Calculate offset
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000);
  const timezoneTime = new Date(utcTime + (getTimezoneOffset(timezoneId) * 60000));
  const offset = formatOffset(getTimezoneOffset(timezoneId));
  
  return {
    id: timezoneId,
    name: timeZoneName,
    offset,
    abbreviation,
    isDST: isDaylightSavingTime(timezoneId, now)
  };
}

function getTimezoneOffset(timezoneId: string): number {
  const now = new Date();
  
  // Special case for UTC
  if (timezoneId === 'UTC') {
    return 0;
  }
  
  // Use a more reliable method to calculate timezone offset
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  const tzDate = new Date(now.toLocaleString('en-US', { timeZone: timezoneId }));
  
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

function formatOffset(minutes: number): string {
  const sign = minutes >= 0 ? '+' : '-';
  const absMinutes = Math.abs(minutes);
  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;
  return `${sign}${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function isDaylightSavingTime(timezoneId: string, date: Date): boolean {
  const january = new Date(date.getFullYear(), 0, 1);
  const july = new Date(date.getFullYear(), 6, 1);
  
  const janOffset = getTimezoneOffset(timezoneId);
  const julyOffset = getTimezoneOffset(timezoneId);
  
  return Math.max(janOffset, julyOffset) !== getTimezoneOffset(timezoneId);
}

export function convertToUserTimezone(date: Date, userTimezone: string): Date {
  return toZonedTime(date, userTimezone);
}

export function convertFromUserTimezone(date: Date, userTimezone: string): Date {
  return new Date(formatInTimeZone(date, userTimezone, 'yyyy-MM-dd HH:mm:ss'));
}

export function formatDateInTimezone(date: Date, timezone: string, format: string): string {
  return formatInTimeZone(date, timezone, format);
}

export function getTimezoneOptions(): Array<{ value: string; label: string }> {
  return COMMON_TIMEZONES.map(tz => {
    if (tz === 'UTC') {
      return {
        value: 'UTC',
        label: 'UTC (+00:00) UTC'
      };
    }
    
    const info = getTimezoneInfo(tz);
    return {
      value: tz,
      label: `${tz.replace('_', ' ')} (${info.offset}) ${info.abbreviation}`
    };
  });
}

export function detectUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return 'UTC';
  }
}

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}

// Conflict detection utilities
export function detectTimeConflicts(
  events: Array<{ start: Date; end: Date; title: string; id: string }>,
  tolerance: number = 0 // minutes
): Array<{ event1: string; event2: string; title1: string; title2: string; overlapMinutes: number }> {
  const conflicts = [];
  
  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const event1 = events[i];
      const event2 = events[j];
      
      const start1 = event1.start.getTime();
      const end1 = event1.end.getTime();
      const start2 = event2.start.getTime();
      const end2 = event2.end.getTime();
      
      // Check for overlap
      const overlapStart = Math.max(start1, start2);
      const overlapEnd = Math.min(end1, end2);
      
      if (overlapStart < overlapEnd) {
        const overlapMinutes = (overlapEnd - overlapStart) / (1000 * 60);
        
        if (overlapMinutes > tolerance) {
          conflicts.push({
            event1: event1.id,
            event2: event2.id,
            title1: event1.title,
            title2: event2.title,
            overlapMinutes
          });
        }
      }
    }
  }
  
  return conflicts;
}

export function resolveTimeConflict(
  event1: { start: Date; end: Date; title: string },
  event2: { start: Date; end: Date; title: string },
  resolution: 'first' | 'second' | 'merge' | 'split'
): Array<{ start: Date; end: Date; title: string }> {
  switch (resolution) {
    case 'first':
      return [event1];
    case 'second':
      return [event2];
    case 'merge':
      return [{
        start: new Date(Math.min(event1.start.getTime(), event2.start.getTime())),
        end: new Date(Math.max(event1.end.getTime(), event2.end.getTime())),
        title: `${event1.title} / ${event2.title}`
      }];
    case 'split':
      // Split the longer event around the shorter one
      const longer = event1.end.getTime() - event1.start.getTime() > event2.end.getTime() - event2.start.getTime() ? event1 : event2;
      const shorter = longer === event1 ? event2 : event1;
      
      const result = [shorter];
      
      // Add parts of the longer event that don't overlap
      if (longer.start.getTime() < shorter.start.getTime()) {
        result.push({
          start: longer.start,
          end: shorter.start,
          title: longer.title
        });
      }
      
      if (longer.end.getTime() > shorter.end.getTime()) {
        result.push({
          start: shorter.end,
          end: longer.end,
          title: longer.title
        });
      }
      
      return result;
    default:
      return [event1, event2];
  }
}