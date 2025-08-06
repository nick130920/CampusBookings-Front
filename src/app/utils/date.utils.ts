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

/**
 * Calcula la diferencia en días calendario entre dos fechas
 * Ignora las horas para comparar solo fechas calendario
 */
export function getDaysDifference(dateString: string, referenceDate: Date = new Date()): number {
  const date = new Date(dateString);
  
  // Normalizar ambas fechas a medianoche para comparar solo días calendario
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const referenceOnly = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
  
  // Calcular diferencia en días
  return Math.floor((referenceOnly.getTime() - dateOnly.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha para mostrar de forma relativa (Hoy, Ayer, Hace X días)
 */
export function formatRelativeDate(dateString: string): string {
  const diffInDays = getDaysDifference(dateString);
  
  if (diffInDays === 0) {
    return 'Hoy';
  } else if (diffInDays === 1) {
    return 'Ayer';
  } else if (diffInDays < 7) {
    return `Hace ${diffInDays} días`;
  } else {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}