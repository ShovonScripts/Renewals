/**
 * The single source of truth: Zustand + `persist` on AsyncStorage.
 *
 * docs/DATA_MODEL.md ("Storage layout"):
 *  - Key `@renewals/state`, shape `{ version, items, settings }`, `version` starts at 1.
 *  - One key holds everything so a crash can never desync items and settings.
 *  - No second storage system. No SQLite.
 *
 * Intended actions (Phase 1): add, update, delete, archive, restore, markRenewed,
 * updateSettings — plus a `migrate` function for future version steps.
 */
export {};
