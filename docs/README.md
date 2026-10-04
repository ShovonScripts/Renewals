# Renewals (working title): Project Docs

One app to track every expiry date and renewal in your life: passports, visas, licenses, insurance, subscriptions, warranties, domains. Works offline. No account. Reminders before it is too late.

> **Working title only.** Check Play Store name availability before committing. A Bangla-flavored alternative: **Meyad (মেয়াদ)**.

## Documents

| File | Purpose |
|---|---|
| `PRD.md` | Problem, users, scope, success targets, validation plan, risks |
| `FEATURES.md` | Feature list by version with acceptance criteria |
| `DATA_MODEL.md` | Types, storage layout, date rules, migrations, example data |
| `SCREENS.md` | Route tree and per-screen spec |
| `ARCHITECTURE.md` | Stack, folder structure, notification design, i18n, error handling |
| `BUILD_PROMPT.md` | Phased prompt to hand to the AI coding agent |
| `APK_SIZE_CHECKLIST.md` | Size rules learned from Costly and Home Manager |
| `TESTING.md` | Manual and unit test plan |
| `PLAY_STORE_CHECKLIST.md` | Steps from first build to production release |
| `STORE_LISTING.md` | Store text drafts (English and Bangla) and screenshot plan |
| `PRIVACY_POLICY.md` | Template to adapt and host |

## Decisions already made

- **Platform:** Android first. iOS later (needs `ios.bundleIdentifier` and an Apple Developer account).
- **Stack:** Expo SDK 57, React Native, Expo Router, strict TypeScript, same family as Costly and Home Manager.
- **Storage:** one persisted store (Zustand + AsyncStorage). No SQLite, so there is no dual-storage confusion.
- **Dates:** expiry stored as date-only strings (`YYYY-MM-DD`), never as UTC timestamps.
- **Languages:** Bangla and English from v1.
- **Privacy:** no accounts, no analytics, no network calls in app code.
- **Package id (placeholder):** `com.shovon.renewals`. It cannot be changed after publishing, so confirm it first.

## Open decisions

1. Final app name and package id.
2. Whether biometric app lock goes into v1 or v1.1 (currently v1.1).
3. Monetization (currently none). Check whether paid apps are supported for your Play merchant country before planning any.

## How to use these with the AI agent

1. Copy the files into a `docs/` folder in the project repo.
2. Give the agent `README.md` and `BUILD_PROMPT.md`. It reads the other files when each phase says so.
3. Approve one phase at a time. Paste each phase report into chat for review before replying "approved".
