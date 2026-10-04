# PRD: Renewals

## 1. Problem

People have many things that expire, and the dates are scattered across paper, photos, emails and memory:

- passport, visa, driving license, vehicle papers (fitness, tax token)
- insurance policies
- subscriptions that renew automatically
- product warranties and receipts
- domain and hosting renewals

Missing a date costs money (fines, late fees, lost warranty, surprise charges) or causes real trouble (an expired visa or passport).

## 2. Target users

| Segment | Example | Why they care |
|---|---|---|
| Students and travelers | Visa and passport applicants | Strict deadlines, high stakes |
| Freelancers and small business owners | Domain, hosting, tool subscriptions | Forgotten renewals cause outages or extra charges |
| Families | Insurance, vehicle papers, appliance warranties | Many dates, one person remembers them all |

Primary first users: students and staff around EETC, who are easy to reach and can serve as closed testers.

## 3. Positioning

- **Offline and private.** No account, no bank linking, data stays on the phone.
- **Covers documents, subscriptions and warranties in one place.** Most competitors cover only one.
- **Bangla and English** from the first release.

Many subscription trackers already exist. This is a crowded category, so the pitch must be concrete: "documents plus subscriptions plus warranties, offline, in Bangla."

## 4. Goals and non-goals

**Goals (v1):**
- Add an item with an expiry date in under 20 seconds.
- Get reminders at chosen intervals before the date.
- See at a glance what is overdue and what is coming.
- Back up and restore data without any account.

**Non-goals (v1):**
- Cloud sync, accounts, family sharing.
- Reading emails or bank messages to detect subscriptions.
- Storing ID or passport numbers.
- Home-screen widgets, iOS release, payments or in-app purchases.

## 5. MVP scope

See `FEATURES.md`, items F-01 to F-13.

## 6. Success targets (suggested, adjust to taste)

- 12 or more closed testers stay opted in for 14 continuous days (Play requirement for new personal accounts, see `PLAY_STORE_CHECKLIST.md`).
- At least 70% of testers add 3 or more items in the first week.
- At least 50% grant notification permission.
- At least 3 testers confirm a reminder arrived on time.
- No crash on a release build on a low-end Android phone.

## 7. Validate before building

Talk to 5 real people (different segments). Ask:

1. What expiry dates do you have to track right now?
2. How do you remember them today?
3. Tell me about the last time you missed one. What happened?
4. Would you trust an app with this information? What would worry you?
5. What apps have you tried, and why did you stop?
6. What would make you open this app every month?

Proceed only if at least 3 of 5 describe a real, recent pain. If most already have a working habit, reconsider.

## 8. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Crowded category | Narrow angle (offline, Bangla, documents plus subscriptions); validate first |
| Reminders delayed or blocked by phone battery settings (some Android makers are aggressive) | In-app "Not getting reminders?" help screen; test on low-end phones; do not promise exact-minute delivery |
| Users store sensitive data | Do not ask for ID numbers; add a hint in the notes field; app lock in v1.1 |
| Data loss if the phone is lost or reset | Backup/restore in v1; clear warning that image attachments are not in the JSON backup |
| Play account testing requirement delays launch | Recruit 15 to 20 testers early |

## 9. Monetization

None for v1. Decide after launch. Check merchant support for your country in Play Console before planning paid features.
