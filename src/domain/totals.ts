/**
 * PURE subscription cost normalization. No React, no I/O.
 *
 * docs/DATA_MODEL.md ("Cost normalization") — only items with status === 'active',
 * amount > 0 and billingCycle !== 'none' count:
 *   monthly equivalent = weekly: amount * 52 / 12 | monthly: amount | yearly: amount / 12
 *   yearly equivalent  = monthly equivalent * 12
 *
 * One currency only (Settings.currencyCode). Mixed currencies are out of scope for v1.
 * Values are returned unrounded; rounding is a presentation concern.
 */

import type { RenewalItem } from '@/types';

const WEEKS_PER_YEAR = 52;
const MONTHS_PER_YEAR = 12;

/** Monthly cost of one item, or null when it is not a costed, active subscription. */
export function monthlyEquivalent(item: RenewalItem): number | null {
  if (item.status !== 'active') {
    return null;
  }
  if (item.amount === null || !Number.isFinite(item.amount) || item.amount <= 0) {
    return null;
  }

  switch (item.billingCycle) {
    case 'weekly':
      return (item.amount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR;
    case 'monthly':
      return item.amount;
    case 'yearly':
      return item.amount / MONTHS_PER_YEAR;
    case 'none':
      return null;
  }
}

export interface SubscriptionTotals {
  monthly: number;
  yearly: number;
  /** Number of items that contributed. */
  count: number;
}

export function subscriptionTotals(items: readonly RenewalItem[]): SubscriptionTotals {
  let monthly = 0;
  let count = 0;

  for (const item of items) {
    const value = monthlyEquivalent(item);
    if (value === null) {
      continue;
    }
    monthly += value;
    count += 1;
  }

  return { monthly, yearly: monthly * MONTHS_PER_YEAR, count };
}

/**
 * Active, costed subscriptions sorted by next due date, soonest first — the list for the
 * Subscriptions screen (docs/FEATURES.md F-08). 'YYYY-MM-DD' strings sort chronologically,
 * so a plain string compare is correct and avoids re-parsing every row.
 */
export function activeSubscriptions(items: readonly RenewalItem[]): RenewalItem[] {
  return items
    .filter((item) => monthlyEquivalent(item) !== null)
    .sort((a, b) => {
      if (a.expiresOn !== b.expiresOn) {
        return a.expiresOn < b.expiresOn ? -1 : 1;
      }
      if (a.title === b.title) {
        return 0;
      }
      return a.title < b.title ? -1 : 1;
    });
}
