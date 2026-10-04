/**
 * PURE date helpers. No React, no I/O, no Intl. Fully unit-tested.
 *
 * Rules from docs/DATA_MODEL.md ("Date rules"):
 *  1. Expiry is stored as 'YYYY-MM-DD' — a local calendar date, never a UTC timestamp.
 *  2. Parse manually with `new Date(year, month - 1, day)` (local midnight).
 *     Never `new Date('YYYY-MM-DD')`, which parses as UTC.
 *  3. daysLeft = round((expiryLocalMidnight - todayLocalMidnight) / 86_400_000).
 *     Bangladesh has no daylight saving today, but the rounding keeps this correct elsewhere.
 *  4. addMonths clamps to month end: Jan 31 + 1 month is Feb 28 (Feb 29 in a leap year).
 */

const MS_PER_DAY = 86_400_000;

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parse a 'YYYY-MM-DD' string into a Date at LOCAL midnight.
 *
 * Returns null for anything that is not a real calendar date, so '2026-02-31',
 * '2026-13-01' and '2026-2-3' are all rejected. The round-trip check against
 * getFullYear/getMonth/getDate is what rejects the overflowed ones, because
 * `new Date(2026, 1, 31)` silently rolls over to March 3.
 */
export function parseDateOnly(value: string): Date | null {
  const match = DATE_ONLY_PATTERN.exec(value);
  if (match === null) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12 || day < 1) {
    return null;
  }

  const date = new Date(year, month - 1, day);

  // Rejects rolled-over dates ('2026-02-31') and two-digit-year traps ('0050-01-01',
  // which the Date constructor maps to 1950).
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

/** Local midnight of the given instant. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Format a Date as 'YYYY-MM-DD'. This is the storage format, not a user-facing one. */
export function toDateOnlyString(date: Date): string {
  const year = String(date.getFullYear()).padStart(4, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Whole days from today until `expiresOn`. Negative means overdue.
 * Returns null when the stored date cannot be parsed.
 */
export function daysLeft(expiresOn: string, now: Date = new Date()): number | null {
  const expiry = parseDateOnly(expiresOn);
  if (expiry === null) {
    return null;
  }
  return Math.round((expiry.getTime() - startOfDay(now).getTime()) / MS_PER_DAY);
}

/** Add (or subtract, when negative) whole calendar days. Handles month and year rollover. */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * Add (or subtract) calendar months, clamping to the last day of the target month.
 * Jan 31 + 1 month -> Feb 28 (Feb 29 in a leap year). Feb 29 2028 + 12 months -> Feb 28 2029.
 */
export function addMonths(date: Date, months: number): Date {
  const firstOfTargetMonth = new Date(date.getFullYear(), date.getMonth() + months, 1);
  // Day 0 of the following month is the last day of the target month.
  const daysInTargetMonth = new Date(
    firstOfTargetMonth.getFullYear(),
    firstOfTargetMonth.getMonth() + 1,
    0
  ).getDate();

  firstOfTargetMonth.setDate(Math.min(date.getDate(), daysInTargetMonth));
  return firstOfTargetMonth;
}

/**
 * User-facing date, e.g. "15 Mar 2028".
 *
 * Month names are passed in rather than read from `Intl`, because docs/ARCHITECTURE.md
 * requires Bangla formatting without relying on Intl locale data. i18n (Phase 4) supplies
 * the bn and en arrays; this stays pure and locale-free.
 */
export function formatDate(date: Date, monthNames: readonly string[]): string {
  const monthName = monthNames[date.getMonth()] ?? '';
  return `${date.getDate()} ${monthName} ${date.getFullYear()}`;
}
