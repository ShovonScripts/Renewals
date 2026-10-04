/**
 * PURE type guards and sanitizers. No React, no I/O.
 *
 * docs/DATA_MODEL.md ("Validation"):
 *  - Every storage read and every imported backup passes through these guards.
 *  - Invalid items are dropped and counted, never thrown on.
 *  - An unreadable blob is copied to `@renewals/corrupt-<timestamp>` and the app starts empty.
 *  - Sanitize on write: trim strings, clamp lengths (title 60, notes 300),
 *    de-duplicate and sort reminderDays descending (max 5, 0..365), drop attachments beyond 3.
 *
 * Intended exports (Phase 1): isRenewalItem, isSettings, sanitizeItem, validateBackup.
 */
export {};
