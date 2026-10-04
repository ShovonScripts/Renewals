# Google Play Release Checklist

Rules change. Where a number or requirement appears here, confirm it in Play Console before you rely on it.

## 1. Developer account

- [ ] Create a Google Play developer account. One-time registration fee (about $25, as far as I know; confirm at sign-up).
- [ ] Pay with a Visa or Mastercard that has international transactions enabled.
- [ ] Complete identity verification (government ID and address).
- [ ] Decide **personal vs organization**:
  - Personal accounts created after 13 November 2023 must run a closed test with **at least 12 testers opted in for 14 continuous days** before applying for production access (per Google Play Help; the original number was 20).
  - Organization accounts are exempt from that requirement but need business verification, which can take longer.
  - On a personal account, every new app needs its own closed test.

## 2. Before the first production build

- [ ] Final app name (up to 30 characters in the store title) and package id. **The package id cannot change after publishing.**
- [ ] `app.json`: `version`, Android `package`, icons, splash.
- [ ] Set `buildArchs` to `["armeabi-v7a", "arm64-v8a"]` for the production AAB (see `APK_SIZE_CHECKLIST.md`).
- [ ] Privacy policy hosted at a public URL (see `PRIVACY_POLICY.md`).
- [ ] Commit everything to git (EAS builds from the committed state). Run `git status` first and add only intended files, not stray folders like `.artifacts/`.

## 3. Build

```powershell
npx eas-cli build -p android --profile production
```

- [ ] Download the `.aab` from the EAS build page.
- [ ] Back up the keystore: `npx eas-cli credentials -p android`.
- [ ] Install a **preview APK** on a real phone and run `TESTING.md` first. Do not upload an untested build.

## 4. Create the app in Play Console

- [ ] Create app: name, default language, App or Game, Free.
- [ ] **App content** section, all items:
  - [ ] Privacy policy URL
  - [ ] App access (no login needed)
  - [ ] Ads: none
  - [ ] Content rating questionnaire
  - [ ] Target audience (adults; if you choose to include under-18, extra rules apply)
  - [ ] Data safety form: answer truthfully. If the app collects nothing and sends nothing off the device, declare that. Re-check this if you ever add analytics, ads or cloud features.
  - [ ] Financial features declaration, if shown: this app tracks dates and subscription costs only, it does not provide loans, payments or banking. Answer accordingly.
- [ ] Store listing (see `STORE_LISTING.md`): icon, feature graphic, screenshots, short and full description.

## 5. Testing tracks

1. **Internal testing** (up to 100 testers, no review): upload the first `.aab` here to check the install flow. It does not count toward the 12-tester requirement.
2. **Closed testing** (personal accounts):
   - [ ] Create a closed track and upload the `.aab`.
   - [ ] Add 15 to 20 testers by Google account email (a buffer in case someone opts out).
   - [ ] Testers must follow the opt-in link and stay opted in for 14 continuous days. An invite alone does not count.
   - [ ] Keep the build live and collect feedback.
3. After 14 days, **apply for production access** in the dashboard. Google reviews the application.
4. **Production**: create a release, add release notes, roll out.

Budget about three weeks for a first launch on a new personal account: 14 days of testing, the access application, and the app review itself.

## 6. First release manually

Upload the first `.aab` through the Console yourself. Automated submission (`eas submit`) needs a Google service account key and, as far as I know, only works after the app already has a first manually uploaded release.

## 7. After launch

- [ ] Watch crashes and ANRs in Play Console (Android vitals).
- [ ] Reply to reviews.
- [ ] Each update: bump the version, build `production`, upload to a track, roll out gradually.

## iOS later

Needs `ios.bundleIdentifier` in `app.json`, an Apple Developer Program membership (about $99 per year, as far as I know), then `npx eas-cli build -p ios --profile production` and `npx eas-cli submit -p ios`.
