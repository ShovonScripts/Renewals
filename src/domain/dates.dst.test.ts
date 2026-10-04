/**
 * @jest-environment ./jest.sydney-env.js
 *
 * Daylight-saving coverage for daysLeft, isolated in its own file because it runs in a
 * different timezone from every other suite (see jest.sydney-env.js for why that has to be
 * an environment rather than an assignment inside this file).
 *
 * docs/DATA_MODEL.md rule 3: "Daylight-saving shifts do not apply in Bangladesh today, but
 * keep the rounding so the function stays correct elsewhere."
 *
 * The transition dates below were measured, not assumed. In Australia/Sydney for 2026 the only
 * local-midnight-to-local-midnight spans that are not exactly 24 hours are:
 *   2026-10-04 -> 2026-10-05  = 23 hours  (DST starts, offset 10 -> 11)
 *   2026-04-05 -> 2026-04-06  = 25 hours  (DST ends,   offset 11 -> 10)
 * so a 7-day span starting 2026-09-28 is 167 hours = 6.9583 days, and one starting
 * 2026-03-30 is 169 hours = 7.0417 days. Truncating instead of rounding would report 6 for
 * the first of those, which is the bug this file exists to catch.
 *
 * The first two tests below assert the timezone and the short/long days themselves, so a future
 * change to the transition rules fails loudly here instead of silently weakening the rest.
 */

import { daysLeft } from '@/domain/dates';

const TZ_FOR_TESTS = 'Australia/Sydney';

it('is running in the timezone this file expects', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe(TZ_FOR_TESTS);
});

it('really does have a short day and a long day in 2026', () => {
  const hours = (from: Date, to: Date) => (to.getTime() - from.getTime()) / 3_600_000;
  expect(hours(new Date(2026, 9, 4), new Date(2026, 9, 5))).toBe(23);
  expect(hours(new Date(2026, 3, 5), new Date(2026, 3, 6))).toBe(25);
});

describe('daysLeft across a daylight-saving shift', () => {
  it('rounds a 23-hour day up to 1 day', () => {
    expect(daysLeft('2026-10-05', new Date(2026, 9, 4))).toBe(1);
  });

  it('rounds a 25-hour day down to 1 day', () => {
    expect(daysLeft('2026-04-06', new Date(2026, 3, 5))).toBe(1);
  });

  it('reports 7 days for a 167-hour week (6.9583 days)', () => {
    // Truncating the division would give 6 here.
    expect(daysLeft('2026-10-05', new Date(2026, 8, 28))).toBe(7);
  });

  it('reports 7 days for a 169-hour week (7.0417 days)', () => {
    expect(daysLeft('2026-04-06', new Date(2026, 2, 30))).toBe(7);
  });

  it('keeps the 30-day bucket boundary correct across the transition', () => {
    // 2026-09-05 -> 2026-10-05 is 30 calendar days spanning the DST start.
    expect(daysLeft('2026-10-05', new Date(2026, 8, 5))).toBe(30);
  });
});
