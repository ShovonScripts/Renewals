/**
 * Local scheduled notifications only. Read the exact trigger and channel shapes from
 * node_modules/expo-notifications type definitions before writing any call — the API
 * changes between SDK versions (docs/ARCHITECTURE.md).
 *
 *  - Android channel id `renewals`, created at startup.
 *  - For each active item and each reminderDays value: fire at expiresOn - N days,
 *    at settings.notifyHour:notifyMinute local time. Skip any moment not in the future.
 *  - Scheduled ids live in memory only. The items are the source of truth.
 *  - reconcileNotifications() is the single entry point: cancel all, compute every
 *    future reminder, sort by fire time, schedule the nearest 60.
 *  - Called after any item or settings change, and on app start and foreground.
 */
export {};
