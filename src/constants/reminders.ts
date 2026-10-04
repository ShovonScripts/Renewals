/**
 * Default reminder offsets per category — docs/FEATURES.md F-03.
 *   documents:     [90, 30, 7, 1]
 *   subscriptions: [7, 1]
 *   warranties:    [30, 7]
 * Max 5 values per item, integers 0..365. The fire time comes from Settings (default 09:00).
 *
 * `other` has no specific default, so it falls back to Settings.defaultReminderDays
 * (docs/DATA_MODEL.md: "used when a category has no specific default").
 */

import type { CategoryId } from '@/types';

export const DOCUMENT_REMINDER_DAYS: readonly number[] = [90, 30, 7, 1];
export const SUBSCRIPTION_REMINDER_DAYS: readonly number[] = [7, 1];
export const WARRANTY_REMINDER_DAYS: readonly number[] = [30, 7];

const REMINDER_DAYS_BY_CATEGORY: Readonly<Partial<Record<CategoryId, readonly number[]>>> = {
  passport: DOCUMENT_REMINDER_DAYS,
  visa: DOCUMENT_REMINDER_DAYS,
  license: DOCUMENT_REMINDER_DAYS,
  id_card: DOCUMENT_REMINDER_DAYS,
  vehicle: DOCUMENT_REMINDER_DAYS,
  insurance: DOCUMENT_REMINDER_DAYS,
  domain_hosting: DOCUMENT_REMINDER_DAYS,
  subscription: SUBSCRIPTION_REMINDER_DAYS,
  warranty: WARRANTY_REMINDER_DAYS,
};

/**
 * Category-specific defaults, or null when the caller should use Settings.defaultReminderDays.
 * Returned as a fresh array so callers can hand it straight to an editable form.
 */
export function defaultReminderDaysFor(category: CategoryId): number[] | null {
  const days = REMINDER_DAYS_BY_CATEGORY[category];
  return days === undefined ? null : [...days];
}
