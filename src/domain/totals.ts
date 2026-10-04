/**
 * PURE subscription cost normalization. No React, no I/O.
 *
 * docs/DATA_MODEL.md ("Cost normalization") — only items with
 * status === 'active', amount > 0 and billingCycle !== 'none':
 *  - monthly equivalent = weekly: amount * 52 / 12 | monthly: amount | yearly: amount / 12
 *  - yearly equivalent  = monthly equivalent * 12
 * One currency only (Settings.currencyCode); mixed currencies are out of scope for v1.
 *
 * Intended exports (Phase 1): monthlyEquivalent, subscriptionTotals.
 */
export {};
