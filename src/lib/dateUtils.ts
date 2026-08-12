export const APP_LOCALE = 'ar-YE';

type DateInput = string | number | Date;

export function formatDateTime(date: DateInput): string {
  return new Date(date).toLocaleString(APP_LOCALE);
}

export function formatDate(date: DateInput, options?: Intl.DateTimeFormatOptions): string {
  return new Date(date).toLocaleDateString(APP_LOCALE, options);
}

export function formatTime(
  date: DateInput,
  options: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' }
): string {
  return new Date(date).toLocaleTimeString(APP_LOCALE, options);
}
