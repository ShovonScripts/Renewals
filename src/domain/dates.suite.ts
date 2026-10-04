/**
 * The date suite, written once and run under more than one timezone.
 *
 * `dates.test.ts` runs it in Asia/Dhaka (the production timezone, no daylight saving) and
 * `dates.sydney.test.ts` runs it in Australia/Sydney (which does observe DST). Every assertion
 * here is therefore required to hold in both, which is what catches a hidden UTC assumption.
 * The DST-specific arithmetic lives separately in `dates.dst.test.ts`.
 *
 * Not matched by jest's `**\/*.test.ts` pattern, so this file is never collected on its own.
 */

import {
  addDays,
  addMonths,
  daysLeft,
  formatDate,
  parseDateOnly,
  startOfDay,
  toDateOnlyString,
} from '@/domain/dates';

const EN_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

export function defineDateSuites(): void {
  /** Fixed "today" so every assertion below is deterministic. Built at call time, after the
   *  test environment has set the timezone. */
  const TODAY = new Date(2026, 9, 4); // 4 Oct 2026, local midnight

  function isoOfLocalMidnight(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}`;
  }

  /** The 'YYYY-MM-DD' string for TODAY + n days. */
  function inDays(days: number): string {
    return toDateOnlyString(addDays(TODAY, days));
  }

  describe('parseDateOnly', () => {
    it('parses a valid date at LOCAL midnight, not UTC', () => {
      const date = parseDateOnly('2028-03-15');
      expect(date).not.toBeNull();
      expect(date?.getFullYear()).toBe(2028);
      expect(date?.getMonth()).toBe(2); // March, zero-based
      expect(date?.getDate()).toBe(15);
      // `new Date('2028-03-15')` would be UTC midnight; in any timezone east of Greenwich that
      // reads back as the 15th only by luck. Asserting local midnight pins the behaviour down.
      expect(date?.getHours()).toBe(0);
      expect(date?.getMinutes()).toBe(0);
    });

    it('rejects an impossible day that the Date constructor would silently roll over', () => {
      expect(parseDateOnly('2026-02-31')).toBeNull(); // would roll to 3 Mar
      expect(parseDateOnly('2026-04-31')).toBeNull(); // April has 30 days
      expect(parseDateOnly('2026-06-31')).toBeNull();
      expect(parseDateOnly('2026-09-31')).toBeNull();
      expect(parseDateOnly('2026-11-31')).toBeNull();
    });

    it('rejects out-of-range month and day components', () => {
      expect(parseDateOnly('2026-13-01')).toBeNull();
      expect(parseDateOnly('2026-00-10')).toBeNull();
      expect(parseDateOnly('2026-01-00')).toBeNull();
      expect(parseDateOnly('2026-01-32')).toBeNull();
    });

    it('accepts a leap day only in a real leap year', () => {
      expect(parseDateOnly('2028-02-29')).not.toBeNull(); // divisible by 4
      expect(parseDateOnly('2000-02-29')).not.toBeNull(); // divisible by 400
      expect(parseDateOnly('2026-02-29')).toBeNull(); // not a leap year
      expect(parseDateOnly('2100-02-29')).toBeNull(); // century, not divisible by 400
      expect(parseDateOnly('1900-02-29')).toBeNull(); // century, not divisible by 400
    });

    it('rejects anything that is not exactly YYYY-MM-DD', () => {
      expect(parseDateOnly('')).toBeNull();
      expect(parseDateOnly('not-a-date')).toBeNull();
      expect(parseDateOnly('2026-2-3')).toBeNull(); // not zero-padded
      expect(parseDateOnly('2028/03/15')).toBeNull(); // slash-separated
      expect(parseDateOnly('15-03-2028')).toBeNull(); // day first
      expect(parseDateOnly('2028-03-15T00:00:00Z')).toBeNull();
      expect(parseDateOnly(' 2028-03-15')).toBeNull(); // no silent trimming
    });

    it('rejects a two-digit year the Date constructor would map into the 20th century', () => {
      // `new Date(50, 0, 1)` is 1950, so the round-trip check rejects it.
      expect(parseDateOnly('0050-01-01')).toBeNull();
    });
  });

  describe('startOfDay and toDateOnlyString', () => {
    it('zeroes the time part', () => {
      const date = startOfDay(new Date(2026, 9, 4, 23, 59, 59, 999));
      expect(date.getHours()).toBe(0);
      expect(date.getMinutes()).toBe(0);
      expect(date.getSeconds()).toBe(0);
      expect(date.getMilliseconds()).toBe(0);
      expect(date.getDate()).toBe(4);
    });

    it('zero-pads single-digit months and days', () => {
      expect(toDateOnlyString(new Date(2026, 0, 5))).toBe('2026-01-05');
      expect(toDateOnlyString(new Date(2026, 11, 31))).toBe('2026-12-31');
    });

    it('round-trips a parsed date', () => {
      for (const value of ['2026-01-01', '2026-02-28', '2028-02-29', '2028-12-31']) {
        const parsed = parseDateOnly(value);
        expect(parsed).not.toBeNull();
        expect(toDateOnlyString(parsed as Date)).toBe(value);
      }
    });
  });

  describe('daysLeft', () => {
    it('returns 0 for today, 1 for tomorrow, -1 for yesterday', () => {
      expect(daysLeft(inDays(0), TODAY)).toBe(0);
      expect(daysLeft(inDays(1), TODAY)).toBe(1);
      expect(daysLeft(inDays(-1), TODAY)).toBe(-1);
    });

    it('hits the bucket boundaries exactly at 7 and 30 days', () => {
      expect(daysLeft(inDays(7), TODAY)).toBe(7);
      expect(daysLeft(inDays(8), TODAY)).toBe(8);
      expect(daysLeft(inDays(30), TODAY)).toBe(30);
      expect(daysLeft(inDays(31), TODAY)).toBe(31);
    });

    it('returns negative values for overdue dates', () => {
      expect(daysLeft(inDays(-7), TODAY)).toBe(-7);
      expect(daysLeft(inDays(-30), TODAY)).toBe(-30);
      expect(daysLeft(inDays(-365), TODAY)).toBe(-365);
    });

    it('counts across a year boundary', () => {
      expect(daysLeft('2027-01-01', new Date(2026, 11, 31))).toBe(1);
      expect(daysLeft('2026-12-31', new Date(2027, 0, 1))).toBe(-1);
    });

    it('counts across a leap day', () => {
      // 28 Feb 2028 -> 1 Mar 2028 is 2 days, because 29 Feb exists.
      expect(daysLeft('2028-03-01', new Date(2028, 1, 28))).toBe(2);
      // In a non-leap year the same pair is 1 day.
      expect(daysLeft('2026-03-01', new Date(2026, 1, 28))).toBe(1);
    });

    it('handles a far future date', () => {
      const days = daysLeft('2099-12-31', TODAY);
      expect(days).not.toBeNull();
      expect(days).toBeGreaterThan(26000);
    });

    it('is independent of the time of day it is called at', () => {
      const earlyMorning = new Date(2026, 9, 4, 0, 0, 1);
      const lateNight = new Date(2026, 9, 4, 23, 59, 59);
      expect(daysLeft('2026-10-11', earlyMorning)).toBe(7);
      expect(daysLeft('2026-10-11', lateNight)).toBe(7);
    });

    it('returns null for an unparseable stored date', () => {
      expect(daysLeft('2026-02-31', TODAY)).toBeNull();
      expect(daysLeft('garbage', TODAY)).toBeNull();
      expect(daysLeft('', TODAY)).toBeNull();
    });

    it('never produces an ISO string mismatch with the local calendar date', () => {
      // Guards the rule "never store an expiry as a UTC timestamp": the string we compare
      // against is built from local components, not toISOString().
      expect(inDays(0)).toBe(isoOfLocalMidnight(TODAY));
    });
  });

  describe('addMonths', () => {
    it('clamps to month end: Jan 31 + 1 month is Feb 28', () => {
      expect(toDateOnlyString(addMonths(new Date(2026, 0, 31), 1))).toBe('2026-02-28');
    });

    it('clamps to Feb 29 in a leap year', () => {
      expect(toDateOnlyString(addMonths(new Date(2028, 0, 31), 1))).toBe('2028-02-29');
    });

    it('clamps a leap day forward into a non-leap year', () => {
      expect(toDateOnlyString(addMonths(new Date(2028, 1, 29), 12))).toBe('2029-02-28');
    });

    it('lands back on the leap day four years later', () => {
      expect(toDateOnlyString(addMonths(new Date(2028, 1, 29), 48))).toBe('2032-02-29');
    });

    it('clamps other short months', () => {
      expect(toDateOnlyString(addMonths(new Date(2026, 4, 31), 6))).toBe('2026-11-30');
      expect(toDateOnlyString(addMonths(new Date(2026, 7, 31), 1))).toBe('2026-09-30');
      expect(toDateOnlyString(addMonths(new Date(2026, 9, 31), 18))).toBe('2028-04-30');
    });

    it('rolls December over into January', () => {
      expect(toDateOnlyString(addMonths(new Date(2026, 11, 31), 1))).toBe('2027-01-31');
      expect(toDateOnlyString(addMonths(new Date(2026, 11, 15), 1))).toBe('2027-01-15');
    });

    it('rolls January back into December', () => {
      expect(toDateOnlyString(addMonths(new Date(2026, 0, 15), -1))).toBe('2025-12-15');
      expect(toDateOnlyString(addMonths(new Date(2026, 0, 31), -1))).toBe('2025-12-31');
    });

    it('clamps when subtracting into February', () => {
      expect(toDateOnlyString(addMonths(new Date(2026, 2, 31), -1))).toBe('2026-02-28');
      expect(toDateOnlyString(addMonths(new Date(2028, 2, 31), -1))).toBe('2028-02-29');
    });

    it('is stable for +0 and for whole years that do not cross a leap boundary', () => {
      expect(toDateOnlyString(addMonths(new Date(2026, 9, 4), 0))).toBe('2026-10-04');
      expect(toDateOnlyString(addMonths(new Date(2026, 7, 31), 12))).toBe('2027-08-31');
    });

    it('normalizes to local midnight, because every caller works with date-only values', () => {
      const result = addMonths(new Date(2026, 0, 31, 14, 30, 15), 1);
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
    });
  });

  describe('addDays', () => {
    it('rolls over a month end', () => {
      expect(toDateOnlyString(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
      expect(toDateOnlyString(addDays(new Date(2026, 1, 28), 1))).toBe('2026-03-01');
      expect(toDateOnlyString(addDays(new Date(2028, 1, 28), 1))).toBe('2028-02-29'); // leap year
    });

    it('rolls over a year end', () => {
      expect(toDateOnlyString(addDays(new Date(2026, 11, 31), 1))).toBe('2027-01-01');
      expect(toDateOnlyString(addDays(new Date(2027, 0, 1), -1))).toBe('2026-12-31');
    });

    it('subtracts back through a leap day', () => {
      expect(toDateOnlyString(addDays(new Date(2028, 2, 1), -1))).toBe('2028-02-29');
      expect(toDateOnlyString(addDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28');
    });

    it('handles +0 and a full year', () => {
      expect(toDateOnlyString(addDays(new Date(2026, 9, 4), 0))).toBe('2026-10-04');
      expect(toDateOnlyString(addDays(new Date(2026, 9, 4), 365))).toBe('2027-10-04');
    });
  });

  describe('formatDate', () => {
    it('uses the supplied month names and no Intl data', () => {
      expect(formatDate(new Date(2028, 2, 15), EN_MONTHS)).toBe('15 Mar 2028');
      expect(formatDate(new Date(2026, 0, 5), EN_MONTHS)).toBe('5 Jan 2026');
    });

    it('renders Bangla month names in the same shape', () => {
      const bnMonths = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর',
      ];
      expect(formatDate(new Date(2028, 2, 15), bnMonths)).toBe('15 মার্চ 2028');
    });
  });
}
