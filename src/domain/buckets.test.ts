import { groupItems, bucketOf, BUCKET_ORDER } from '@/domain/buckets';
import { addDays, toDateOnlyString } from '@/domain/dates';
import { makeItem } from '@/testing/factories';
import type { RenewalItem } from '@/types';

const TODAY = new Date(2026, 9, 4);

function itemDueIn(days: number, overrides: Partial<RenewalItem> = {}): RenewalItem {
  return makeItem({
    id: `itm_due_${days}`,
    expiresOn: toDateOnlyString(addDays(TODAY, days)),
    ...overrides,
  });
}

describe('bucketOf', () => {
  it('puts anything negative in overdue', () => {
    expect(bucketOf(-1)).toBe('overdue');
    expect(bucketOf(-7)).toBe('overdue');
    expect(bucketOf(-365)).toBe('overdue');
  });

  it('puts exactly 0 in today', () => {
    expect(bucketOf(0)).toBe('today');
  });

  it('puts 1 to 7 in week, including the 7 boundary', () => {
    expect(bucketOf(1)).toBe('week');
    expect(bucketOf(3)).toBe('week');
    expect(bucketOf(7)).toBe('week');
  });

  it('puts 8 to 30 in month, including both boundaries', () => {
    expect(bucketOf(8)).toBe('month');
    expect(bucketOf(30)).toBe('month');
  });

  it('puts 31 and above in later', () => {
    expect(bucketOf(31)).toBe('later');
    expect(bucketOf(365)).toBe('later');
    expect(bucketOf(10000)).toBe('later');
  });

  it('covers every integer across the boundaries without a gap', () => {
    const expected: Record<number, string> = {
      [-2]: 'overdue',
      [-1]: 'overdue',
      0: 'today',
      1: 'week',
      6: 'week',
      7: 'week',
      8: 'month',
      29: 'month',
      30: 'month',
      31: 'later',
      32: 'later',
    };
    for (const [days, bucket] of Object.entries(expected)) {
      expect(bucketOf(Number(days))).toBe(bucket);
    }
  });
});

describe('groupItems', () => {
  it('returns groups in display order', () => {
    const groups = groupItems(
      [itemDueIn(100), itemDueIn(20), itemDueIn(3), itemDueIn(0), itemDueIn(-5)],
      TODAY
    );
    expect(groups.map((group) => group.bucket)).toEqual([
      'overdue',
      'today',
      'week',
      'month',
      'later',
    ]);
    expect(BUCKET_ORDER).toEqual(['overdue', 'today', 'week', 'month', 'later']);
  });

  it('omits empty buckets', () => {
    const groups = groupItems([itemDueIn(3), itemDueIn(5)], TODAY);
    expect(groups.map((group) => group.bucket)).toEqual(['week']);
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('returns no groups for an empty list', () => {
    expect(groupItems([], TODAY)).toEqual([]);
  });

  it('sorts soonest first within a bucket', () => {
    const groups = groupItems([itemDueIn(6), itemDueIn(2), itemDueIn(4)], TODAY);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['itm_due_2', 'itm_due_4', 'itm_due_6']);
  });

  it('sorts the most overdue first', () => {
    const groups = groupItems([itemDueIn(-2), itemDueIn(-40), itemDueIn(-9)], TODAY);
    expect(groups[0]?.items.map((item) => item.id)).toEqual([
      'itm_due_-40',
      'itm_due_-9',
      'itm_due_-2',
    ]);
  });

  it('breaks ties on title so the list order is stable', () => {
    const groups = groupItems(
      [
        itemDueIn(3, { id: 'itm_b', title: 'Zebra' }),
        itemDueIn(3, { id: 'itm_a', title: 'Apple' }),
        itemDueIn(3, { id: 'itm_c', title: 'Mango' }),
      ],
      TODAY
    );
    expect(groups[0]?.items.map((item) => item.title)).toEqual(['Apple', 'Mango', 'Zebra']);
  });

  it('skips an item whose stored date cannot be parsed', () => {
    const groups = groupItems(
      [itemDueIn(3), makeItem({ id: 'itm_bad', expiresOn: '2026-02-31' })],
      TODAY
    );
    expect(groups).toHaveLength(1);
    expect(groups[0]?.items.map((item) => item.id)).toEqual(['itm_due_3']);
  });

  it('does not filter by status — that is the selector\'s job', () => {
    const groups = groupItems(
      [itemDueIn(3), itemDueIn(4, { id: 'itm_archived', status: 'archived' })],
      TODAY
    );
    expect(groups[0]?.items).toHaveLength(2);
  });

  it('does not mutate the array it is given', () => {
    const input = [itemDueIn(6), itemDueIn(2)];
    const snapshot = [...input];
    groupItems(input, TODAY);
    expect(input).toEqual(snapshot);
  });
});
