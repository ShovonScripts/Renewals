/**
 * PURE reminder planning. No React, no I/O, no expo-notifications.
 *
 * Split out of `services/notifications.ts` so the scheduling logic can be unit-tested without
 * any native module loaded, and so it follows the repo rule that `domain/` holds pure,
 * fully-tested functions (docs/ARCHITECTURE.md).
 *
 * Rules from docs/ARCHITECTURE.md and docs/FEATURES.md F-03:
 *  - For each ACTIVE item and each `reminderDays` value, one reminder fires at
 *    `expiresOn - N days` at `notifyHour:notifyMinute` local time.
 *  - A reminder whose time is not in the future is skipped, never fired immediately.
 *  - Scheduled ids are not stored; the items are the source of truth.
 */

import { addDays, parseDateOnly } from '@/domain/dates';
import type { RenewalItem } from '@/types';

/**
 * Cap on concurrently scheduled notifications.
 *
 * docs/ARCHITECTURE.md: schedule the nearest 60. iOS limits pending notifications to 64, so
 * this also keeps a future iOS release safe.
 */
export const MAX_SCHEDULED_REMINDERS = 60;

export interface PlannedReminder {
  itemId: string;
  /** Copied through so the caller can build the notification body without a second lookup. */
  title: string;
  /** The `reminderDays` offset this reminder came from. */
  daysBefore: number;
  /** Local time the notification should fire. Always strictly in the future. */
  fireAt: Date;
}

/** The fire time for one offset, or null when the stored expiry date cannot be parsed. */
export function reminderFireDate(
  expiresOn: string,
  daysBefore: number,
  notifyHour: number,
  notifyMinute: number
): Date | null {
  const expiry = parseDateOnly(expiresOn);
  if (expiry === null) {
    return null;
  }
  const day = addDays(expiry, -daysBefore);
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), notifyHour, notifyMinute, 0, 0);
}

/**
 * Every reminder that is still in the future, soonest first, capped at
 * `MAX_SCHEDULED_REMINDERS`.
 *
 * Archived items contribute nothing. Items with an unparseable expiry date are skipped rather
 * than throwing — they cannot survive validation, but this function does not trust its input.
 */
export function planReminders(
  items: readonly RenewalItem[],
  settings: { notifyHour: number; notifyMinute: number },
  now: Date = new Date(),
  limit: number = MAX_SCHEDULED_REMINDERS
): PlannedReminder[] {
  const planned: PlannedReminder[] = [];

  for (const item of items) {
    if (item.status !== 'active') {
      continue;
    }

    for (const daysBefore of item.reminderDays) {
      const fireAt = reminderFireDate(
        item.expiresOn,
        daysBefore,
        settings.notifyHour,
        settings.notifyMinute
      );
      if (fireAt === null || fireAt.getTime() <= now.getTime()) {
        continue;
      }
      planned.push({ itemId: item.id, title: item.title, daysBefore, fireAt });
    }
  }

  return sortAndCap(planned, limit);
}

/**
 * The shape of a reminder's wording, without any words in it.
 *
 * Returning a descriptor instead of a sentence keeps English copy out of `domain/`. Phase 4
 * turns this into `t()` keys for Bangla and English; until then the service renders it.
 */
export type ReminderLabel =
  | { kind: 'today'; itemId: string }
  | { kind: 'tomorrow'; itemId: string }
  | { kind: 'inDays'; itemId: string; days: number };

/**
 * At the moment a reminder fires, the item is exactly `daysBefore` days from expiry, because
 * the fire time is defined as `expiresOn - daysBefore`.
 */
export function describeReminder(reminder: PlannedReminder): ReminderLabel {
  if (reminder.daysBefore <= 0) {
    return { kind: 'today', itemId: reminder.itemId };
  }
  if (reminder.daysBefore === 1) {
    return { kind: 'tomorrow', itemId: reminder.itemId };
  }
  return { kind: 'inDays', itemId: reminder.itemId, days: reminder.daysBefore };
}

function sortAndCap(planned: PlannedReminder[], limit: number): PlannedReminder[] {
  planned.sort((a, b) => {
    const difference = a.fireAt.getTime() - b.fireAt.getTime();
    if (difference !== 0) {
      return difference;
    }
    // Stable order for reminders that land in the same minute, so reconcile is idempotent.
    if (a.itemId !== b.itemId) {
      return a.itemId < b.itemId ? -1 : 1;
    }
    return b.daysBefore - a.daysBefore;
  });

  return planned.slice(0, limit);
}
