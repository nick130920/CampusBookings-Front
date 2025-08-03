/**
 * Utility functions for handling dates without timezone conversion issues
 */

/**
 * Converts a Date object to ISO string in local timezone (without Z suffix)
 * This prevents timezone conversion issues when sending to backend
 */
export function toLocalISOString(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60 * 1000));
  return localDate.toISOString().slice(0, -1); // Remove 'Z' suffix
}

/**
 * Combines date and time parts maintaining local timezone
 */
export function combineDateTime(date: Date, time: Date): Date {
  const combined = new Date(date);
  combined.setHours(time.getHours(), time.getMinutes(), time.getSeconds(), time.getMilliseconds());
  return combined;
}

/**
 * Creates a date with specific hours and minutes in local timezone
 */
export function createLocalDateTime(date: Date, hours: number, minutes: number = 0): Date {
  const result = new Date(date);
  result.setHours(hours, minutes, 0, 0);
  return result;
}

/**
 * Formats date for backend API (YYYY-MM-DDTHH:mm:ss format without timezone)
 */
export function formatForAPI(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}