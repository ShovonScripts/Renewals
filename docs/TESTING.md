# Testing Plan

Type-check, lint and export passing do **not** prove the app works on a phone. Test on a real device, using the release-style build, because minification is enabled.

## 1. Unit tests (automated, pure logic)

Run with jest-expo (devDependency only). Cover:

- `daysLeft`: today (0), tomorrow (1), yesterday (-1), exactly 7 and 30 days, far future.
- Bucket boundaries: 0, 1, 7, 8, 30, 31 days.
- `addMonths` clamping: Jan 31 + 1 month, Feb 29 in a leap year, Dec to Jan rollover.
- Reminder computation: past reminders skipped, nearest-60 cap, correct fire time.
- Cost normalization: weekly, monthly, yearly, ignores archived and no-cost items.
- Validation: bad dates ("2026-02-31"), empty title, too many reminders, duplicate reminder days, over-long notes.
- Corrupt state recovery: invalid JSON, wrong shape, mixed valid and invalid items.
- Backup import: wrong `app` value, wrong version, one bad item among good ones, Merge vs Replace.
- Migrations: each step from version N to N+1.

## 2. Notification tests (physical phone only)

| # | Test | Expected |
|---|---|---|
| N1 | Add an item due tomorrow with reminder day 1 | A notification is scheduled for the notify time today or tomorrow, not fired instantly |
| N2 | Settings test button ("in 10 seconds") | Notification arrives in the status bar |
| N3 | Edit expiry date | Old reminders gone, new ones scheduled |
| N4 | Archive an item | Its reminders are cancelled |
| N5 | Delete an item | Its reminders and attachment files are removed |
| N6 | Deny notification permission | Banner appears, button opens system settings, app still works |
| N7 | Restart the phone | Reminders still fire (if not, the help screen must explain what to check) |
| N8 | Force-stop the app, wait for a reminder | Record whether it still arrives, on which phone brand |
| N9 | Turn on aggressive battery saving | Record the result and update the help text |
| N10 | Change notify time in Settings | All reminders reschedule |

Use a low-end phone and, if you can borrow one, a different brand from your own. Reminder behavior varies between makers.

## 3. Data and flow tests

- Add 300 items: lists stay smooth, startup stays fast.
- Kill the app mid-save: no corrupt state on relaunch.
- Export, uninstall, reinstall, import: everything restored (photos excluded, note shown).
- Import a hand-edited broken JSON: rejected with a clear message, nothing changed.
- Mark as renewed: history entry added, item leaves Overdue.
- Attachments: add 3, try a 4th (blocked), delete one, delete the item (files gone).

## 4. UI tests

- Bangla and English: switch live, no untranslated keys, digits convert correctly.
- Long Bangla titles and long notes: no clipped buttons or overlapping text.
- Dark and light themes: all screens readable.
- System font scale at 200%: layouts survive.
- Small screen (about 360 dp wide) and a tall phone.
- TalkBack on: icon buttons have labels, focus order makes sense.

## 5. Release build checks

Because `enableMinifyInReleaseBuilds` is on, run all of sections 2 and 3 on the **preview APK**, not only in development. Minification can break things that work in development.

Install the production AAB's 32-bit path too: if you can, test on a 32-bit-only phone.

## 6. Before each store submission

- [ ] Fresh install, full onboarding, add 3 items of different categories
- [ ] Reminder received on a physical phone
- [ ] Backup export and import round trip
- [ ] No crash on cold start, resume, rotation (portrait locked, so just resume)
- [ ] Version number and version code correct
- [ ] Privacy policy URL opens
