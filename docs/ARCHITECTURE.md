# Architecture

## Stack

- Expo SDK 57, React Native, Expo Router, strict TypeScript (same family as Costly and Home Manager).
- State and persistence: Zustand with the `persist` middleware on AsyncStorage (single source of truth).
- Reminders: `expo-notifications` (local scheduled notifications only).
- Attachments: `expo-image-picker` plus `expo-file-system`.
- Backup: `expo-sharing` (export) and `expo-document-picker` (import).
- Build config: `expo-build-properties` (see `APK_SIZE_CHECKLIST.md`).
- Icons: Ionicons only, imported per set.

Install every package with `npx expo install <name>` so versions match the SDK.

**Do not add:** `expo-sqlite`, `@expo/ui`, other icon sets, custom font files, analytics or ads SDKs, or any networking library. Each one costs APK size or privacy.

## Folder structure

```
src/
├── app/                 # routes (see SCREENS.md)
├── components/          # small reusable UI (Card, Button, Chip, EmptyState, DaysLeftBadge ...)
├── constants/           # categories, theme tokens, default reminders
├── domain/              # PURE functions, no React, fully unit-tested
│   ├── dates.ts         # parse, daysLeft, addMonths, formatDate
│   ├── buckets.ts       # group items into Overdue/Today/Week/Month/Later
│   ├── totals.ts        # subscription normalization
│   └── validate.ts      # type guards and sanitizers
├── store/
│   ├── store.ts         # Zustand store + persist + migrations
│   └── selectors.ts
├── services/
│   ├── notifications.ts # permission, schedule, cancel, reconcile
│   ├── attachments.ts   # save, delete, resolve paths
│   └── backup.ts        # export, import, merge
├── i18n/
│   ├── index.ts         # t(key), useT(), number and date formatting
│   ├── bn.ts
│   └── en.ts
└── types/
    └── index.ts
```

Rule: screens never touch AsyncStorage or the notifications API directly. They call store actions and services.

## Notification design

- Android channel id `renewals`, created at startup.
- For each active item and each `reminderDays` value, schedule one local notification at `expiresOn - N days` at the user's notify time.
- Store scheduled ids only in memory/derived state, not as source of truth. The source of truth is the items themselves.
- `reconcileNotifications()` is the one entry point:
  1. cancel all scheduled notifications,
  2. compute every future reminder,
  3. sort by fire time and schedule the nearest 60 (a cap that also keeps iOS, which limits pending notifications to 64, safe later).
- Call `reconcileNotifications()` after any item or settings change, and on every app start and foreground. With dozens of items this is cheap and removes whole classes of drift bugs.
- Permission flow: ask in context after the first saved item (see `SCREENS.md`). On Android 13 and above the runtime notification permission is required. If denied, Home shows a banner with a button that opens system settings.
- Read the exact trigger and channel API from `node_modules/expo-notifications` type definitions. Do not write it from memory, the shape changes between SDK versions.
- Reminders can be delayed or suppressed by some phone makers' battery settings. The help screen exists for this. Do not promise exact-minute delivery in any copy.

## i18n

- A tiny dictionary approach: `bn.ts` and `en.ts` export the same typed key set. TypeScript fails the build if a key is missing in either.
- Do not rely on `Intl` locale data for Bangla. Write a small `toBanglaDigits()` util and a manual date formatter with month name arrays.
- No extra font files. Use the system font so APK size stays small and Bangla renders natively.
- Test with long Bangla strings: buttons and chips must wrap or ellipsize without clipping.

## Error handling

- Every storage read and service call is wrapped, failures surface as a short, translated message.
- A corrupt state blob is copied aside and the app starts empty (see `DATA_MODEL.md`).
- Backup import is all-or-nothing: validate everything first, then write once.

## Theming

Light and dark token sets in `constants/theme.ts`, chosen via system scheme or the user's override. No hard-coded colors in components.

## Performance and size rules

- Lists use `FlatList` with stable keys.
- Memoize selectors that group or sum.
- Follow `APK_SIZE_CHECKLIST.md` on every dependency change.

## Privacy by construction

- No network calls in app code, no analytics, no ads.
- Attachments live in the app sandbox, not in the gallery.
- No fields for ID numbers.
