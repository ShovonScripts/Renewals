/**
 * PURE date helpers. No React, no I/O. Fully unit-tested in Phase 1.
 *
 * Rules from docs/DATA_MODEL.md ("Date rules"):
 *  - Expiry is a 'YYYY-MM-DD' local calendar date. Never a UTC timestamp.
 *  - Parse manually with `new Date(year, month - 1, day)`. Never `new Date('YYYY-MM-DD')`,
 *    which parses as UTC.
 *  - daysLeft = round((expiryLocalMidnight - todayLocalMidnight) / 86_400_000).
 *    The rounding keeps the function correct under daylight-saving shifts.
 *  - addMonths clamps to month end: Jan 31 + 1 month is Feb 28 (Feb 29 in a leap year).
 *
 * Intended exports (Phase 1): parseDate, formatDate, daysLeft, addMonths.
 */
export {};
