/**
 * PURE grouping of items into the Upcoming buckets. No React, no I/O.
 *
 * docs/DATA_MODEL.md rule 4 — boundaries are inclusive as written:
 *  - overdue: daysLeft < 0
 *  - today:   daysLeft === 0
 *  - week:    1..7
 *  - month:   8..30
 *  - later:   > 30
 *
 * Intended exports (Phase 1): bucketOf, groupItems.
 */
export {};
