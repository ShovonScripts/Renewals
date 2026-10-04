# Data Model

## Storage layout

One persisted key holds everything, so a crash can never leave items and settings out of sync:

- Key: `@renewals/state`
- Shape: `{ version: number, items: RenewalItem[], settings: Settings }`
- Implementation: Zustand `persist` middleware with AsyncStorage, `version` plus a `migrate` function.
- Attachments are files in the app's document folder. Items store **relative** paths only.

## Types

```ts
export type CategoryId =
  | 'passport' | 'visa' | 'license' | 'id_card' | 'vehicle'
  | 'insurance' | 'subscription' | 'warranty' | 'domain_hosting' | 'other';

export type BillingCycle = 'none' | 'weekly' | 'monthly' | 'yearly';

export interface Attachment {
  id: string;
  path: string;        // relative to the app document folder, e.g. "attachments/itm_x/photo1.jpg"
  createdAt: string;   // ISO timestamp
}

export interface RenewalEvent {
  id: string;
  renewedAt: string;       // ISO timestamp
  previousExpiresOn: string; // 'YYYY-MM-DD'
  newExpiresOn: string;      // 'YYYY-MM-DD'
  amount?: number | null;
}

export interface RenewalItem {
  id: string;
  title: string;               // 1..60 chars
  category: CategoryId;
  expiresOn: string;           // 'YYYY-MM-DD' (local calendar date)
  reminderDays: number[];      // unique, integers 0..365, sorted descending, max 5
  amount: number | null;       // > 0 when set
  billingCycle: BillingCycle;
  autoRenews: boolean;
  notes: string;               // max 300 chars
  attachments: Attachment[];   // max 3
  status: 'active' | 'archived';
  history: RenewalEvent[];
  createdAt: string;           // ISO timestamp
  updatedAt: string;           // ISO timestamp
}

export interface Settings {
  language: 'bn' | 'en';
  currencyCode: string;        // e.g. 'BDT'
  currencySymbol: string;      // e.g. '৳'
  notifyHour: number;          // 0..23, default 9
  notifyMinute: number;        // 0..59, default 0
  defaultReminderDays: number[]; // used when a category has no specific default
  theme: 'system' | 'light' | 'dark';
  hasCompletedOnboarding: boolean;
  notificationPermissionAsked: boolean;
}
```

## IDs

`itm_<Date.now() in base36>_<random 4 chars base36>`. No extra dependency needed.

## Date rules (the usual source of bugs)

1. Store expiry as `YYYY-MM-DD`. Never store an expiry as a UTC timestamp.
2. Parse manually: `new Date(year, month - 1, day)` (local midnight). Do **not** call `new Date('YYYY-MM-DD')`, which parses as UTC.
3. `daysLeft = round((expiryLocalMidnight - todayLocalMidnight) / 86_400_000)`. Daylight-saving shifts do not apply in Bangladesh today, but keep the rounding so the function stays correct elsewhere.
4. Buckets: `overdue` if daysLeft < 0, `today` if 0, `week` if 1 to 7, `month` if 8 to 30, `later` if more than 30.
5. Adding months clamps to month end: Jan 31 plus 1 month is Feb 28 (or 29 in a leap year).
6. Reminder fire time for offset N: expiry date minus N days, at `notifyHour:notifyMinute` local time. If that moment is not in the future, skip it.

## Cost normalization (subscription summary)

Only items with `status === 'active'`, `amount > 0` and `billingCycle !== 'none'`:

- monthly equivalent = weekly: `amount * 52 / 12`, monthly: `amount`, yearly: `amount / 12`
- yearly equivalent = monthly equivalent * 12
- Totals use one currency (the one in Settings). Mixed currencies are out of scope for v1.

## Validation

Every read from storage and every imported backup passes through type guards (as in Costly's `isExpense`). Invalid items are dropped and counted. If the whole blob is unreadable, keep a copy under `@renewals/corrupt-<timestamp>`, then start empty. Never crash on bad data.

Sanitize on write: trim strings, clamp lengths, de-duplicate and sort `reminderDays`, drop attachments beyond 3.

## Migrations

`version` starts at 1. Each future change adds a step `migrate(v -> v+1)`. Keep migrations pure and tested.

## Sensitive data

Do not add fields for passport, license or ID numbers. The notes field shows a hint: "Avoid entering ID numbers."

## Backup file format

```json
{
  "app": "renewals",
  "backupVersion": 1,
  "exportedAt": "2026-10-04T08:00:00.000Z",
  "settings": { "language": "bn", "currencyCode": "BDT" },
  "items": []
}
```

Attachments are not included in v1. Import validates `app` and `backupVersion`, then every item.

## Example item

```json
{
  "id": "itm_m1abc2_x7k2",
  "title": "Passport",
  "category": "passport",
  "expiresOn": "2028-03-15",
  "reminderDays": [90, 30, 7, 1],
  "amount": null,
  "billingCycle": "none",
  "autoRenews": false,
  "notes": "Renew at least 6 months before expiry for visa applications",
  "attachments": [],
  "status": "active",
  "history": [],
  "createdAt": "2026-10-04T08:00:00.000Z",
  "updatedAt": "2026-10-04T08:00:00.000Z"
}
```
