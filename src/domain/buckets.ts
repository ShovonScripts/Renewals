/**
 * PURE grouping of items into the Upcoming buckets. No React, no I/O.
 *
 * docs/DATA_MODEL.md rule 4 — boundaries are inclusive exactly as written:
 *   overdue: daysLeft < 0
 *   today:   daysLeft === 0
 *   week:    1..7
 *   month:   8..30
 *   later:   > 30
 *
 * Grouping does not filter by status: docs/FEATURES.md F-06 keeps archived items off Home,
 * and that filtering belongs to the store selectors so this function stays pure.
 */

import { daysLeft } from '@/domain/dates';
import type { RenewalItem } from '@/types';

export const BUCKET_ORDER = ['overdue', 'today', 'week', 'month', 'later'] as const;

export type BucketId = (typeof BUCKET_ORDER)[number];

export function bucketOf(days: number): BucketId {
  if (days < 0) {
    return 'overdue';
  }
  if (days === 0) {
    return 'today';
  }
  if (days <= 7) {
    return 'week';
  }
  if (days <= 30) {
    return 'month';
  }
  return 'later';
}

export interface BucketGroup {
  bucket: BucketId;
  items: RenewalItem[];
}

/**
 * Group items into the five buckets, in display order, soonest first within each bucket.
 * Empty buckets are omitted so screens can render section headers without a check.
 * Items whose stored date cannot be parsed are skipped — they cannot survive validation.
 */
export function groupItems(items: readonly RenewalItem[], now: Date = new Date()): BucketGroup[] {
  const byBucket = new Map<BucketId, { item: RenewalItem; days: number }[]>();

  for (const item of items) {
    const days = daysLeft(item.expiresOn, now);
    if (days === null) {
      continue;
    }
    const bucket = bucketOf(days);
    const list = byBucket.get(bucket);
    if (list === undefined) {
      byBucket.set(bucket, [{ item, days }]);
    } else {
      list.push({ item, days });
    }
  }

  const groups: BucketGroup[] = [];
  for (const bucket of BUCKET_ORDER) {
    const list = byBucket.get(bucket);
    if (list === undefined) {
      continue;
    }
    // Soonest first. For `overdue` the most negative value is the longest overdue, which
    // is also what a user wants at the top. Ties break on title so lists are stable.
    list.sort((a, b) => a.days - b.days || compareTitles(a.item.title, b.item.title));
    groups.push({ bucket, items: list.map((entry) => entry.item) });
  }

  return groups;
}

function compareTitles(a: string, b: string): number {
  if (a === b) {
    return 0;
  }
  return a < b ? -1 : 1;
}
