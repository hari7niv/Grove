/**
 * Date utilities for Grove.
 *
 * The "logical date" concept is central: a day runs from dayStartHour
 * to dayStartHour the next calendar day. Late-night activity (e.g., 2 AM workout)
 * counts for the previous logical day.
 */

/**
 * Returns the logical date (YYYY-MM-DD) for a given timestamp.
 *
 * If the time is before dayStartHour, it belongs to the previous logical day.
 * E.g., with dayStartHour=4: 2024-03-15T02:30 => logical date 2024-03-14.
 */
export function getLogicalDate(timestamp: Date | string, dayStartHour: number = 4): string {
  const dateObj = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  const adjusted = new Date(dateObj.getTime());

  if (adjusted.getHours() < dayStartHour) {
    adjusted.setDate(adjusted.getDate() - 1);
  }

  return formatDate(adjusted);
}

/**
 * Format a Date as YYYY-MM-DD in local timezone.
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date at midnight local time.
 */
export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Get today's logical date string.
 */
export function getToday(dayStartHour: number = 4): string {
  return getLogicalDate(new Date(), dayStartHour);
}

/**
 * Add days to a date string, returning a new date string.
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDate(date);
}

/**
 * Subtract days from a date string.
 */
export function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days);
}

/**
 * Calculate the number of days between two date strings.
 * Returns a positive number if end > start.
 */
export function daysBetween(startStr: string, endStr: string): number {
  const start = parseDate(startStr);
  const end = parseDate(endStr);
  const diffMs = end.getTime() - start.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Check if two date strings are consecutive days.
 */
export function isConsecutive(dateStr1: string, dateStr2: string): boolean {
  return daysBetween(dateStr1, dateStr2) === 1;
}

/**
 * Generate an array of date strings from start to end (inclusive).
 */
export function dateRange(startStr: string, endStr: string): string[] {
  const result: string[] = [];
  const days = daysBetween(startStr, endStr);
  for (let i = 0; i <= days; i++) {
    result.push(addDays(startStr, i));
  }
  return result;
}

/**
 * Get the month key (YYYY-MM) from a date string.
 */
export function getMonthKey(dateStr: string): string {
  return dateStr.substring(0, 7);
}

/**
 * Get the start of the current month as date string.
 */
export function getMonthStart(dateStr: string): string {
  return dateStr.substring(0, 8) + '01';
}

/**
 * Check if a date string falls within the current month relative to a reference date.
 */
export function isSameMonth(dateStr: string, referenceStr: string): boolean {
  return getMonthKey(dateStr) === getMonthKey(referenceStr);
}

/**
 * Get the day of week (0=Sunday, 6=Saturday) for a date string.
 */
export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

/**
 * Get current timestamp as ISO 8601 string.
 */
export function nowISO(): string {
  return new Date().toISOString();
}

/**
 * Generate a UUID v4.
 */
export function generateId(): string {
  // Polyfill-safe approach
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
