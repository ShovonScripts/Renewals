# Renewals

One app to track every expiry date and renewal in your life: passports, visas, licenses,
insurance, subscriptions, warranties, domains and hosting. Works offline. No account.
Reminders before it is too late. Bangla and English.

> **Working title.** The final name and the package id `com.shovon.renewals` are placeholders —
> the package id cannot be changed after the app is published on Play.

## Status

Phase 0 (project setup) is complete. Phases 1–5 are specified in
[`docs/BUILD_PROMPT.md`](docs/BUILD_PROMPT.md) and are not started.

## Docs

Everything about the product and the build lives in [`docs/`](docs/):

| File | Purpose |
|---|---|
| [`PRD.md`](docs/PRD.md) | Problem, users, scope, success targets, risks |
| [`FEATURES.md`](docs/FEATURES.md) | F-01 → F-13 with acceptance criteria |
| [`DATA_MODEL.md`](docs/DATA_MODEL.md) | Types, storage layout, date rules, backup format |
| [`SCREENS.md`](docs/SCREENS.md) | Route tree and per-screen spec |
| [`ARCHITECTURE.md`](docs/ARCHITECTURE.md) | Stack, folder structure, notifications, i18n |
| [`BUILD_PROMPT.md`](docs/BUILD_PROMPT.md) | The phased build plan |
| [`APK_SIZE_CHECKLIST.md`](docs/APK_SIZE_CHECKLIST.md) | Size rules and the size log |
| [`TESTING.md`](docs/TESTING.md) | Unit, notification, data and UI test plan |
| [`PLAY_STORE_CHECKLIST.md`](docs/PLAY_STORE_CHECKLIST.md) | First build → production release |
| [`STORE_LISTING.md`](docs/STORE_LISTING.md) | Store text (EN/BN) and screenshot plan |
| [`PRIVACY_POLICY.md`](docs/PRIVACY_POLICY.md) | Privacy policy template |

## Layout

```
src/
├── app/          # Expo Router routes (src/app routing)
├── components/   # reusable UI
├── constants/    # categories, theme tokens, default reminders
├── domain/       # PURE functions, no React, unit-tested
├── store/        # Zustand + persist (single source of truth)
├── services/     # notifications, attachments, backup
├── i18n/         # typed bn/en dictionaries
└── types/        # shared type declarations
```

Screens never touch AsyncStorage or the notifications API directly — they call store
actions and services.

## Commands

```bash
npm start            # Expo dev server
npm run android      # dev server targeting Android
npm run lint         # expo lint
npx tsc --noEmit     # typecheck
npx expo-doctor      # dependency and config diagnosis
```

Builds are done with EAS, never locally:

```bash
npx eas-cli build -p android --profile preview     # test APK (arm64-v8a only)
npx eas-cli build -p android --profile production  # Play Store AAB
```

## Rules this repo follows

- Android first, offline, no accounts, no analytics, no network calls in app code.
- One persisted store. No SQLite, no second storage system.
- Expiry dates are `YYYY-MM-DD` local calendar dates, never UTC timestamps.
- Ionicons only, imported per set: `import Ionicons from '@expo/vector-icons/Ionicons'`.
- No `expo-sqlite`, no extra icon sets, no custom font files.
- Install packages with `npx expo install <name>` so versions match the SDK.
