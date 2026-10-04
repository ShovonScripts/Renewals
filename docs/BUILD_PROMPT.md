# Build Prompt for the AI Agent

Paste everything below the line into your agent. Replace the project path.

---

```
TASK: Build the "Renewals" Android app (Expo) in phases. Project path: <PUT PROJECT PATH HERE>

READ FIRST (in the project's docs/ folder): README.md, PRD.md, FEATURES.md, DATA_MODEL.md, SCREENS.md, ARCHITECTURE.md, APK_SIZE_CHECKLIST.md. These are the spec. If something conflicts or is missing, ask me instead of guessing.

GLOBAL RULES
- Work in phases. At the end of each phase, STOP and give a report. Do not start the next phase until I reply "approved".
- Strict TypeScript. No `any`. No unused code. No dual storage systems.
- Add a dependency only if the docs list it. Anything else needs my approval first. Install packages with `npx expo install <name>` and never edit versions by hand.
- Read exact API shapes from node_modules type definitions (especially expo-notifications). Do not write API calls from memory.
- Icons: Ionicons only, imported per set: `import Ionicons from '@expo/vector-icons/Ionicons'`. Never import from the package root.
- No network calls, analytics, ads or custom font files.
- Never run `eas build`. Give me the exact command to run instead.
- Label every size or time number "measured" or "estimate".
- Every phase report must include: files created or changed, commands run with results, anything you are unsure about, and what you did NOT do.
- The checks (tsc, lint, expo-doctor, export) do not prove the app works on a phone. Say so in every report.

LESSONS FROM MY PREVIOUS APPS (do not repeat these mistakes)
- expo-build-properties valid keys: buildArchs, enableMinifyInReleaseBuilds, enableShrinkResourcesInReleaseBuilds. Wrong keys (reactNativeArchitectures, enableProguardInReleaseBuilds) are silently ignored. Verify against node_modules/expo-build-properties/build/pluginConfig.d.ts and quote the lines.
- Do not remove packages just because they are not imported in src/. Check `npm explain <pkg>` first (expo-router needs several as dependencies or peers).
- After any package.json change: npm install, then npm ci --dry-run to confirm the lockfile agrees.

PHASE 0: PROJECT SETUP
- Create the Expo project with the default template compatible with SDK 57, src/app routing, TypeScript strict. Remove template demo screens and unused template components and assets.
- app.json: name "Renewals" (working title), slug, scheme, android.package "com.shovon.renewals" (placeholder, tell me it cannot change after publishing), userInterfaceStyle automatic, portrait.
- Install expo-build-properties and configure: buildArchs ["arm64-v8a"] for now, enableMinifyInReleaseBuilds true, enableShrinkResourcesInReleaseBuilds true.
- Create eas.json with development, preview (apk) and production (app-bundle, autoIncrement true) profiles, appVersionSource remote.
- Create the folder structure from ARCHITECTURE.md with empty placeholder modules only.
- Verify: npx expo install --check, npx expo-doctor, npx tsc --noEmit, npx expo lint.
- STOP and report.

PHASE 1: DOMAIN AND STORE (no UI yet)
- Implement domain/dates.ts, buckets.ts, totals.ts, validate.ts exactly per DATA_MODEL.md date rules.
- Add jest-expo as a devDependency ONLY for unit tests of domain/ and store migrations. Write tests for: month-end clamping, leap day, daysLeft boundaries (0, 7, 30), overdue, cost normalization, validation and sanitizing, corrupt state recovery.
- Implement the Zustand store with persist (AsyncStorage), version 1, migrate stub, actions: add, update, delete, archive, restore, markRenewed, updateSettings.
- Run the tests and report pass/fail counts. STOP.

PHASE 2: NOTIFICATIONS SERVICE
- Implement services/notifications.ts per ARCHITECTURE.md: channel, permission request and status, reconcileNotifications() with the nearest-60 cap, dev-only test notification in 10 seconds.
- Wire reconcile to store changes and app start/foreground.
- Unit-test the pure part (computing the list of future reminders). The scheduling call itself needs a real device; list exactly how I should test it.
- STOP.

PHASE 3: SCREENS
- Build screens in this order, one at a time: tabs layout and theme tokens, Upcoming, Add/Edit item, Item detail, Mark as renewed, All items, Subscriptions, Settings, Not getting reminders, Onboarding.
- Follow SCREENS.md for fields, states and accessibility. Reuse components. No hard-coded colors.
- STOP after Upcoming + Add/Edit + Detail for my first review on a phone, then continue only after "approved".

PHASE 4: I18N, ATTACHMENTS, BACKUP
- i18n with typed bn and en dictionaries, toBanglaDigits util, manual date formatter. Every user-facing string goes through t().
- services/attachments.ts: save/delete using relative paths in the app document folder, max 3 per item, cleanup on item delete.
- services/backup.ts: export/import per DATA_MODEL.md, validate-all-then-write, Replace or Merge, visible "photos not included" note.
- STOP.

PHASE 5: HARDENING AND SIZE CHECK
- Re-read APK_SIZE_CHECKLIST.md and TESTING.md. Run every automated check.
- Run `npx expo export --platform android` to a folder OUTSIDE the project. Report the asset list (flag any asset over 300 KB) and the Hermes bundle size.
- List every dependency and why it exists. Flag anything not required.
- Produce the exact preview build command and a short manual test script for my phone.
- STOP.

Begin with Phase 0.
```
