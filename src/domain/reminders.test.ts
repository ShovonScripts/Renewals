/**
 * @jest-environment ./jest.dhaka-env.js
 *
 * Runs in Asia/Dhaka, the production timezone, so the local-time arithmetic below is
 * deterministic rather than dependent on whatever timezone the machine happens to be in.
 */

import {
  MAX_SCHEDULED_REMINDERS,
  describeReminder,
  planReminders,
  reminderFireDate,
  type PlannedReminder,
} from '@/domain/reminders';
import { addDays, toDateOnlyString } from '@/domain/dates';
import { makeItem } from '@/testing/factories';
import type { RenewalItem } from '@/types';

/** 4 Oct 2026, 08:00 local — one hour before the default 09:00 notify time. */
const NOW = new Date(2026, 9, 4, 8, 0, 0);
const SETTINGS = { notifyHour: 9, notifyMinute: 0 };

/** The 'YYYY-MM-DD' string for TODAY + n days. */
function inDays(days: number): string {
  return toDateOnlyString(addDays(new Date(2026, 9, 4), days));
}

describe('reminderFireDate', () => {
  it('fires N days before expiry at the configured local time', () => {
    const fireAt = reminderFireDate('2026-10-11', 7, 9, 0);
    expect(fireAt).not.toBeNull();
    expect(fireAt?.getFullYear()).toBe(2026);
    expect(fireAt?.getMonth()).toBe(9);
    expect(fireAt?.getDate()).toBe(4);
    expect(fireAt?.getHours()).toBe(9);
    expect(fireAt?.getMinutes()).toBe(0);
    expect(fireAt?.getSeconds()).toBe(0);
  });

  it('honours a non-default notify time', () => {
    const fireAt = reminderFireDate('2026-10-11', 7, 21, 45);
    expect(fireAt?.getHours()).toBe(21);
    expect(fireAt?.getMinutes()).toBe(45);
  });

  it('supports a 0 offset, meaning the expiry day itself', () => {
    const fireAt = reminderFireDate('2026-10-11', 0, 9, 0);
    expect(toDateOnlyString(fireAt as Date)).toBe('2026-10-11');
  });

  it('crosses month and year boundaries backwards', () => {
    expect(toDateOnlyString(reminderFireDate('2026-10-01', 7, 9, 0) as Date)).toBe('2026-09-24');
    expect(toDateOnlyString(reminderFireDate('2027-01-01', 90, 9, 0) as Date)).toBe('2026-10-03');
  });

  it('clamps correctly for a reminder 90 days before a March expiry in a leap year', () => {
    // 2028-03-01 minus 90 days crosses 29 Feb 2028.
    expect(toDateOnlyString(reminderFireDate('2028-03-01', 90, 9, 0) as Date)).toBe('2027-12-02');
  });

  it('returns null for an impossible expiry date', () => {
    expect(reminderFireDate('2026-02-31', 7, 9, 0)).toBeNull();
    expect(reminderFireDate('garbage', 7, 9, 0)).toBeNull();
  });
});

describe('planReminders', () => {
  it('returns nothing for an empty list', () => {
    expect(planReminders([], SETTINGS, NOW)).toEqual([]);
  });

  it('produces one reminder per offset', () => {
    const planned = planReminders(
      [makeItem({ expiresOn: '2026-10-11', reminderDays: [7, 1] })],
      SETTINGS,
      NOW
    );

    expect(planned).toHaveLength(2);
    expect(planned.map((entry) => entry.daysBefore)).toEqual([7, 1]);
    expect(planned[0]?.fireAt.getTime()).toBe(new Date(2026, 9, 4, 9, 0).getTime());
    expect(planned[1]?.fireAt.getTime()).toBe(new Date(2026, 9, 10, 9, 0).getTime());
  });

  it('skips a reminder whose time has already passed instead of firing it now', () => {
    // Expiry 5 Oct: the 7-day reminder was 28 Sep (past), the 1-day one is today at 09:00.
    const planned = planReminders(
      [makeItem({ expiresOn: '2026-10-05', reminderDays: [7, 1] })],
      SETTINGS,
      NOW
    );

    expect(planned.map((entry) => entry.daysBefore)).toEqual([1]);
  });

  it('skips every reminder of an item that is already overdue', () => {
    const planned = planReminders(
      [makeItem({ expiresOn: '2026-09-01', reminderDays: [90, 30, 7, 1] })],
      SETTINGS,
      NOW
    );
    expect(planned).toEqual([]);
  });

  it('treats a reminder exactly at `now` as already passed', () => {
    const atNow = new Date(2026, 9, 4, 9, 0, 0);
    const planned = planReminders(
      [makeItem({ expiresOn: '2026-10-11', reminderDays: [7] })],
      SETTINGS,
      atNow
    );
    expect(planned).toEqual([]);
  });

  it('excludes archived items', () => {
    const planned = planReminders(
      [
        makeItem({ id: 'active', expiresOn: '2026-10-11', reminderDays: [7] }),
        makeItem({ id: 'archived', expiresOn: '2026-10-11', reminderDays: [7], status: 'archived' }),
      ],
      SETTINGS,
      NOW
    );
    expect(planned.map((entry) => entry.itemId)).toEqual(['active']);
  });

  it('skips an item whose stored date cannot be parsed', () => {
    const planned = planReminders(
      [
        makeItem({ id: 'ok', expiresOn: '2026-10-11', reminderDays: [7] }),
        makeItem({ id: 'bad', expiresOn: '2026-02-31', reminderDays: [7] }),
      ],
      SETTINGS,
      NOW
    );
    expect(planned.map((entry) => entry.itemId)).toEqual(['ok']);
  });

  it('sorts soonest first across items', () => {
    const planned = planReminders(
      [
        makeItem({ id: 'far', expiresOn: inDays(60), reminderDays: [30] }),
        makeItem({ id: 'near', expiresOn: inDays(10), reminderDays: [7] }),
        makeItem({ id: 'mid', expiresOn: inDays(30), reminderDays: [7] }),
      ],
      SETTINGS,
      NOW
    );
    expect(planned.map((entry) => entry.itemId)).toEqual(['near', 'mid', 'far']);
  });

  it('orders reminders that land in the same minute deterministically', () => {
    const planned = planReminders(
      [
        makeItem({ id: 'itm_b', expiresOn: inDays(10), reminderDays: [7] }),
        makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7] }),
      ],
      SETTINGS,
      NOW
    );
    expect(planned.map((entry) => entry.itemId)).toEqual(['itm_a', 'itm_b']);
  });

  it('uses the notify time from settings, so changing it moves every reminder', () => {
    const items: RenewalItem[] = [makeItem({ expiresOn: '2026-10-11', reminderDays: [7, 1] })];

    const morning = planReminders(items, { notifyHour: 9, notifyMinute: 0 }, NOW);
    const evening = planReminders(items, { notifyHour: 20, notifyMinute: 30 }, NOW);

    expect(morning[0]?.fireAt.getHours()).toBe(9);
    expect(evening[0]?.fireAt.getHours()).toBe(20);
    expect(evening[0]?.fireAt.getMinutes()).toBe(30);
  });

  it('caps at the nearest 60 and keeps the soonest ones', () => {
    expect(MAX_SCHEDULED_REMINDERS).toBe(60);

    // 80 items, one reminder each, spread one day apart starting tomorrow.
    const items = Array.from({ length: 80 }, (_, index) =>
      makeItem({ id: `itm_${String(index).padStart(3, '0')}`, expiresOn: inDays(index + 8), reminderDays: [7] })
    );

    const planned = planReminders(items, SETTINGS, NOW);

    expect(planned).toHaveLength(MAX_SCHEDULED_REMINDERS);
    expect(planned[0]?.itemId).toBe('itm_000');
    expect(planned[59]?.itemId).toBe('itm_059');
    expect(planned.some((entry) => entry.itemId === 'itm_060')).toBe(false);
  });

  it('counts several offsets from one item towards the cap', () => {
    const items = Array.from({ length: 40 }, (_, index) =>
      makeItem({ id: `itm_${index}`, expiresOn: inDays(400 - index), reminderDays: [90, 30, 7] })
    );

    // 40 items x 3 offsets = 120 candidates, capped to 60.
    expect(planReminders(items, SETTINGS, NOW)).toHaveLength(MAX_SCHEDULED_REMINDERS);
  });

  it('accepts an explicit limit', () => {
    const items = Array.from({ length: 10 }, (_, index) =>
      makeItem({ id: `itm_${index}`, expiresOn: inDays(index + 8), reminderDays: [7] })
    );
    expect(planReminders(items, SETTINGS, NOW, 3)).toHaveLength(3);
  });

  it('carries the title and offset through for the caller', () => {
    const planned = planReminders(
      [makeItem({ id: 'itm_x', title: 'Passport', expiresOn: '2026-10-11', reminderDays: [7] })],
      SETTINGS,
      NOW
    );
    expect(planned[0]).toEqual({
      itemId: 'itm_x',
      title: 'Passport',
      daysBefore: 7,
      fireAt: new Date(2026, 9, 4, 9, 0, 0, 0),
    });
  });

  it('does not mutate the items it is given', () => {
    const items = [makeItem({ expiresOn: '2026-10-11', reminderDays: [7, 1] })];
    const snapshot = JSON.parse(JSON.stringify(items)) as RenewalItem[];
    planReminders(items, SETTINGS, NOW);
    expect(items).toEqual(snapshot);
  });
});

describe('describeReminder', () => {
  const at = (daysBefore: number): PlannedReminder => ({
    itemId: 'itm_x',
    title: 'Passport',
    daysBefore,
    fireAt: new Date(2026, 9, 4, 9, 0, 0),
  });

  it('labels the expiry day itself', () => {
    expect(describeReminder(at(0))).toEqual({ kind: 'today', itemId: 'itm_x' });
  });

  it('labels one day out', () => {
    expect(describeReminder(at(1))).toEqual({ kind: 'tomorrow', itemId: 'itm_x' });
  });

  it('labels anything further out with the day count', () => {
    expect(describeReminder(at(2))).toEqual({ kind: 'inDays', itemId: 'itm_x', days: 2 });
    expect(describeReminder(at(365))).toEqual({ kind: 'inDays', itemId: 'itm_x', days: 365 });
  });
});
