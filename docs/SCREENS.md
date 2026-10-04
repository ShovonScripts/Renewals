# Screens and Navigation

## Route tree (Expo Router, `src/app/`)

```
src/app/
├── _layout.tsx              # providers, hydration gate, theme, splash handling
├── (tabs)/
│   ├── _layout.tsx          # bottom tabs: Upcoming, All, Subscriptions, Settings
│   ├── index.tsx            # Upcoming (Home)
│   ├── all.tsx              # All items (search, filter)
│   ├── subscriptions.tsx    # Subscription summary
│   └── settings.tsx         # Settings
├── item/
│   ├── new.tsx              # Add item (modal)
│   ├── [id].tsx             # Item detail
│   └── [id]/edit.tsx        # Edit item
├── renew/[id].tsx           # Mark as renewed (modal)
├── backup.tsx               # Backup and restore
├── help-reminders.tsx       # "Not getting reminders?"
└── onboarding.tsx           # 3-slide intro
```

Use Expo Router's built-in `Tabs`. Do not add separate `@react-navigation/*` packages unless `npx expo install --check` asks for them.

## Global states every screen handles

- **Loading:** the root layout holds the splash/loading screen until the store has hydrated.
- **Empty:** a clear message and one primary action.
- **Error:** inline message and a retry or back action. No raw error text.

## Screens

### Upcoming (Home)
- Header: greeting-free, just the app name and a count of overdue items if any.
- Notification-permission banner when permission is denied (dismissible).
- Grouped list: Overdue, Today, Next 7 days, Next 30 days, Later.
- Floating "+" button opens Add item.
- Empty state: "Add your first item".

### All items
- Search field (title and notes), category chips, Active/Archived toggle.
- Row opens the detail screen.

### Subscriptions
- Summary card: monthly total, yearly total.
- List of active items with a cost, sorted by next date.
- Empty state explains how to add a subscription (category plus cost).

### Settings
- Language, currency, default reminders, notification time, theme.
- Links: Backup and restore, Not getting reminders?, About (app version, privacy policy link).
- Dev-only row (hidden in release): "Send test notification in 10 seconds".

### Add / Edit item
- Fields in order: title, category (grid of icons), expiry date picker, reminder day chips, "This costs money" toggle revealing amount and billing cycle and auto-renews, notes, attachments.
- Save disabled until title and date are valid, with inline validation messages.
- Cancel with unsaved changes asks for confirmation.
- First successful save: if permission has not been asked yet, show a short explanation and then the system permission prompt.

### Item detail
- Large days-left indicator, title, category, date, cost info, notes, attachment thumbnails, history list.
- Actions: Mark as renewed, Edit, Archive/Restore, Delete (confirm).

### Mark as renewed (modal)
- New expiry date (pre-filled for subscriptions using the billing cycle), optional new amount.
- Confirm adds the history entry and reschedules reminders.

### Backup and restore
- Export button (share sheet), Import button (file picker, validate, summary, Replace or Merge).
- Visible note that photos are not included.

### Not getting reminders?
- Checklist with live status: permission granted or not, button to open system settings, battery-optimization guidance text, "Send test in 10 seconds" button.

### Onboarding
- Slide 1: what the app does. Slide 2: offline and private. Slide 3: how reminders work. Skip button on every slide.

## Accessibility baseline

- Touch targets at least 44 by 44.
- Every icon-only button has `accessibilityLabel`.
- Layouts survive 200% system font scale.
- Never rely on color alone: overdue also shows text.
