/**
 * @jest-environment ./jest.dhaka-env.js
 *
 * The full date suite running in Asia/Dhaka — the app's production timezone. Bangladesh has
 * never observed daylight saving, so every span here is an exact multiple of 24 hours; the
 * Sydney run of the same suite is what exercises the rounding under DST.
 */

import { defineDateSuites } from '@/domain/dates.suite';

it('is running in Asia/Dhaka', () => {
  expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Dhaka');
  expect(new Date(2026, 9, 4).getTimezoneOffset()).toBe(-360); // UTC+6, all year
});

defineDateSuites();
