# Features

Legend: **MVP** = v1.0, **v1.1** = first update, **Later** = only if users ask.

## MVP

### F-01 Add, edit, delete item
- Fields: title, category, expiry date, reminder days, optional cost and billing cycle, auto-renews flag, notes, attachments.
- Required: title (1 to 60 chars) and expiry date. Everything else optional.
- Delete asks for confirmation and removes the item's scheduled reminders and attachment files.
- Accept: a new item appears on Home within one second, with reminders scheduled.

### F-02 Categories
- Built-in: passport, visa, license, id_card, vehicle, insurance, subscription, warranty, domain_hosting, other.
- Each has an icon (Ionicons only) and a color.
- Accept: picking a category sets sensible default reminder days (see F-03).

### F-03 Reminders
- Default reminder days: documents `[90, 30, 7, 1]`, subscriptions `[7, 1]`, warranties `[30, 7]`. User can change per item (max 5 values, 0 to 365).
- Notification time of day set in Settings (default 09:00).
- A reminder whose time is already in the past is skipped, not fired immediately.
- Accept: editing an item cancels its old reminders and schedules the new ones.

### F-04 Home: Upcoming
- Groups: Overdue, Today, Next 7 days, Next 30 days, Later.
- Each row: icon, title, days left (or "X days overdue"), date.
- Empty state with a clear "Add your first item" action.
- Accept: grouping matches `DATA_MODEL.md` day rules, including the boundaries (0, 7, 30 days).

### F-05 Mark as renewed
- Action on item detail: choose a new expiry date (suggest next cycle for subscriptions), optionally new cost.
- Adds a history entry (previous expiry, new expiry, date renewed) and reschedules reminders.
- Accept: item leaves Overdue and history shows the event.

### F-06 Archive and restore
- Archived items disappear from Home and totals, remain in All items under an "Archived" filter.
- Archiving cancels reminders; restoring reschedules them.

### F-07 Attachments
- Add up to 3 photos per item (camera or gallery) for documents or receipts.
- Stored inside the app's own folder, referenced by relative path.
- Accept: deleting an item or attachment removes the file. Photos are not added to the phone gallery.

### F-08 Subscription summary
- Screen listing active items with a cost and billing cycle.
- Shows monthly total and yearly total in the user's currency (weekly and yearly normalized to monthly).
- Accept: totals match the normalization rules in `DATA_MODEL.md`.

### F-09 Search and filter
- Search by title and notes. Filter by category and status (Active, Archived).

### F-10 Backup and restore (JSON)
- Export: share a JSON file through the system share sheet.
- Import: pick a JSON file, validate it, show a summary (items found), then choose Replace or Merge.
- The screen states plainly that attachment photos are not included in v1.
- Accept: export then import into a fresh install restores all items and settings; invalid files are rejected with a clear message and nothing is changed.

### F-11 Settings
- Language (Bangla or English), currency, default reminder days, notification time, theme (system, light, dark).

### F-12 Onboarding
- 3 short slides, then the home screen.
- Notification permission is requested in context (after the first item is saved), not at first launch.
- If permission is denied, Home shows a dismissible banner with a button that opens system settings.

### F-13 "Not getting reminders?" help
- Static screen: check notification permission, check battery optimization, check that the notification time is correct, send a test notification in 10 seconds.
- Accept: the test notification arrives on a physical device.

## v1.1

- Biometric or PIN app lock.
- Custom categories.
- Auto-roll for auto-renewing subscriptions (suggest the next date when one passes).
- CSV export and PDF summary (reuse the pattern from Costly).
- Calendar (.ics) export of upcoming items.

## Later (only on demand)

- Optional encrypted cloud backup.
- Family sharing.
- iOS release.
- Widgets.
