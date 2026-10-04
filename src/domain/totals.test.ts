import { activeSubscriptions, monthlyEquivalent, subscriptionTotals } from '@/domain/totals';
import { makeItem } from '@/testing/factories';
import type { RenewalItem } from '@/types';

function subscription(overrides: Partial<RenewalItem> = {}): RenewalItem {
  return makeItem({
    category: 'subscription',
    amount: 500,
    billingCycle: 'monthly',
    status: 'active',
    ...overrides,
  });
}

describe('monthlyEquivalent', () => {
  it('passes a monthly amount straight through', () => {
    expect(monthlyEquivalent(subscription({ amount: 500, billingCycle: 'monthly' }))).toBe(500);
  });

  it('normalizes weekly to monthly as amount * 52 / 12', () => {
    expect(monthlyEquivalent(subscription({ amount: 100, billingCycle: 'weekly' }))).toBeCloseTo(
      433.3333333,
      5
    );
  });

  it('normalizes yearly to monthly as amount / 12', () => {
    expect(monthlyEquivalent(subscription({ amount: 1200, billingCycle: 'yearly' }))).toBe(100);
  });

  it('excludes billingCycle "none"', () => {
    expect(monthlyEquivalent(subscription({ amount: 500, billingCycle: 'none' }))).toBeNull();
  });

  it('excludes archived items', () => {
    expect(monthlyEquivalent(subscription({ status: 'archived' }))).toBeNull();
  });

  it('excludes items with no cost', () => {
    expect(monthlyEquivalent(subscription({ amount: null }))).toBeNull();
    expect(monthlyEquivalent(subscription({ amount: 0 }))).toBeNull();
  });

  it('excludes nonsensical amounts rather than producing a negative total', () => {
    // Not reachable through the sanitizer, but the guard must not trust its input.
    expect(monthlyEquivalent(subscription({ amount: -5 }))).toBeNull();
    expect(monthlyEquivalent(subscription({ amount: Number.NaN }))).toBeNull();
    expect(monthlyEquivalent(subscription({ amount: Number.POSITIVE_INFINITY }))).toBeNull();
  });

  it('excludes a document that happens to carry an amount', () => {
    expect(
      monthlyEquivalent(
        makeItem({ category: 'passport', amount: 4000, billingCycle: 'none' })
      )
    ).toBeNull();
  });
});

describe('subscriptionTotals', () => {
  it('sums monthly equivalents and derives the yearly total as monthly * 12', () => {
    const totals = subscriptionTotals([
      subscription({ id: 'a', amount: 500, billingCycle: 'monthly' }),
      subscription({ id: 'b', amount: 1200, billingCycle: 'yearly' }), // 100/month
      subscription({ id: 'c', amount: 100, billingCycle: 'weekly' }), // 433.33/month
    ]);
    expect(totals.monthly).toBeCloseTo(1033.3333333, 5);
    expect(totals.yearly).toBeCloseTo(12400, 4);
    expect(totals.count).toBe(3);
  });

  it('ignores archived and cost-free items', () => {
    const totals = subscriptionTotals([
      subscription({ id: 'a', amount: 500, billingCycle: 'monthly' }),
      subscription({ id: 'b', amount: 900, billingCycle: 'monthly', status: 'archived' }),
      subscription({ id: 'c', amount: null, billingCycle: 'monthly' }),
      subscription({ id: 'd', amount: 700, billingCycle: 'none' }),
      makeItem({ id: 'e', category: 'warranty', amount: null, billingCycle: 'none' }),
    ]);
    expect(totals.monthly).toBe(500);
    expect(totals.yearly).toBe(6000);
    expect(totals.count).toBe(1);
  });

  it('returns zeros for an empty list', () => {
    expect(subscriptionTotals([])).toEqual({ monthly: 0, yearly: 0, count: 0 });
  });

  it('returns zeros when nothing qualifies', () => {
    expect(
      subscriptionTotals([makeItem({ amount: null, billingCycle: 'none' })])
    ).toEqual({ monthly: 0, yearly: 0, count: 0 });
  });
});

describe('activeSubscriptions', () => {
  it('sorts by next due date, soonest first', () => {
    const result = activeSubscriptions([
      subscription({ id: 'c', expiresOn: '2027-03-01' }),
      subscription({ id: 'a', expiresOn: '2026-11-01' }),
      subscription({ id: 'b', expiresOn: '2027-01-15' }),
    ]);
    expect(result.map((item) => item.id)).toEqual(['a', 'b', 'c']);
  });

  it('breaks a date tie on title', () => {
    const result = activeSubscriptions([
      subscription({ id: 'z', expiresOn: '2026-11-01', title: 'Zebra' }),
      subscription({ id: 'a', expiresOn: '2026-11-01', title: 'Apple' }),
    ]);
    expect(result.map((item) => item.title)).toEqual(['Apple', 'Zebra']);
  });

  it('excludes archived and cost-free items', () => {
    const result = activeSubscriptions([
      subscription({ id: 'keep' }),
      subscription({ id: 'archived', status: 'archived' }),
      subscription({ id: 'nocost', amount: null }),
    ]);
    expect(result.map((item) => item.id)).toEqual(['keep']);
  });

  it('does not mutate the array it is given', () => {
    const input = [
      subscription({ id: 'b', expiresOn: '2027-01-01' }),
      subscription({ id: 'a', expiresOn: '2026-01-01' }),
    ];
    const snapshot = [...input];
    activeSubscriptions(input);
    expect(input).toEqual(snapshot);
  });
});
