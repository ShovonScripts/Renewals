/**
 * @jest-environment ./jest.sydney-env.js
 *
 * The same date suite as dates.test.ts, running in Australia/Sydney — a timezone that observes
 * daylight saving. Any assertion that quietly depended on a fixed UTC offset, or on every day
 * being exactly 24 hours, fails here while passing in Dhaka.
 */

import { defineDateSuites } from '@/domain/dates.suite';

it('is running in Australia/Sydney', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Australia/Sydney');
  // UTC+10 in early October 2026, before the DST start on 4 October takes effect at 02:00.
  expect(new Date(2026, 9, 4).getTimezoneOffset()).toBe(-600);
});

defineDateSuites();
