import { addDays as addDaysFns, differenceInHours, differenceInDays } from "date-fns";

/**
 * Returns the current date (absolute timestamp).
 */
export function now(): Date {
  return new Date();
}

/**
 * Adds a specific number of days to a given date.
 */
export function addDays(date: Date, days: number): Date {
  return addDaysFns(date, days);
}

/**
 * Calculates the number of hours between two dates.
 */
export function hoursBetween(start: Date, end: Date): number {
  return differenceInHours(end, start);
}

/**
 * Calculates the number of days until a future date.
 * Returns negative if the date is in the past.
 */
export function daysUntil(date: Date, referenceDate: Date = now()): number {
  return differenceInDays(date, referenceDate);
}

/**
 * Checks if a given date is in the past compared to a reference date (defaults to now).
 */
export function isExpired(date: Date, referenceDate: Date = now()): boolean {
  return date.getTime() <= referenceDate.getTime();
}
