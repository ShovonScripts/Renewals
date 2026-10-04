/**
 * Local scheduled notifications only. No push, no server, no network.
 *
 * docs/ARCHITECTURE.md ("Notification design"):
 *  - Android channel id `renewals`, created at startup.
 *  - For each active item and each reminderDays value, one local notification at
 *    `expiresOn - N days` at the user's notify time. Past moments are skipped.
 *  - Scheduled ids live in memory only; the items are the source of truth.
 *  - reconcileNotifications() is the single entry point: cancel everything, recompute, then
 *    schedule the nearest 60.
 *  - Called after any item or settings change, and on app start and foreground.
 *
 * API shapes were read from node_modules/expo-notifications/build/*.d.ts for SDK 57
 * (expo-notifications 57.0.21), not from memory. Two things worth recording, because both
 * differ from older SDKs:
 *  - triggers are objects with a `type` from `SchedulableTriggerInputTypes`, and `channelId`
 *    is a field ON the trigger (Notifications.types.d.ts:232-358), not on the content
 *  - `AndroidImportance` is exported from NotificationChannelManager.types, not from
 *    Notifications.types
 */

import * as Notifications from 'expo-notifications';
import { AppState, Linking, Platform } from 'react-native';

import { describeReminder, planReminders, type PlannedReminder } from '@/domain/reminders';
import { useRenewalsStore } from '@/store/store';

export const NOTIFICATION_CHANNEL_ID = 'renewals';

/** Coalesces bursts of store writes into one reconcile. */
const RECONCILE_DEBOUNCE_MS = 250;

/** Seconds until the help screen's test notification fires (docs/FEATURES.md F-13). */
export const TEST_NOTIFICATION_DELAY_SECONDS = 10;

// TODO(Phase 4): route through t(). The channel name is shown in Android system settings.
const CHANNEL_NAME = 'Renewal reminders';
const CHANNEL_DESCRIPTION = 'Reminders before a document, subscription or warranty expires.';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  /** False once the user has refused — the system prompt will not appear again. */
  canAskAgain: boolean;
}

/**
 * Permission mapping.
 *
 * `NotificationPermissionsStatus` extends expo's `PermissionResponse`, which gives `granted`
 * and `canAskAgain` (PermissionsInterface.d.ts:22-42). `PermissionStatus` is NOT re-exported
 * from expo-notifications, so this deliberately uses the two booleans instead of the enum —
 * and `canAskAgain` is what the Home banner actually needs, because it decides whether to show
 * "allow notifications" or "open system settings" (docs/FEATURES.md F-12).
 */
function toPermissionState(status: Notifications.NotificationPermissionsStatus): NotificationPermissionState {
  const canAskAgain = status.canAskAgain;
  if (status.granted) {
    return { permission: 'granted', canAskAgain };
  }
  return { permission: canAskAgain ? 'undetermined' : 'denied', canAskAgain };
}

/**
 * Show reminders while the app is in the foreground. Without a handler, expo-notifications
 * discards notifications that arrive while the app is open.
 *
 * `shouldShowAlert` is deprecated in SDK 57 in favour of `shouldShowBanner` and
 * `shouldShowList` (Notifications.types.d.ts:611-624), so both of those are set.
 */
export function configureForegroundNotificationHandler(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

/** Create the Android channel. A no-op on other platforms. Idempotent. */
export async function ensureNotificationChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android') {
    return;
  }
  await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
    name: CHANNEL_NAME,
    description: CHANNEL_DESCRIPTION,
    importance: Notifications.AndroidImportance.DEFAULT,
    showBadge: false,
    enableVibrate: true,
    enableLights: false,
  });
}

export async function readPermissionAsync(): Promise<NotificationPermissionState> {
  return toPermissionState(await Notifications.getPermissionsAsync());
}

/**
 * Ask for permission. On Android 13+ this is a runtime permission; on older Android versions
 * it is granted implicitly and this resolves without a prompt.
 *
 * docs/FEATURES.md F-12: call this in context, after the first item is saved — not at launch.
 */
export async function requestPermissionAsync(): Promise<NotificationPermissionState> {
  return toPermissionState(await Notifications.requestPermissionsAsync());
}

/** Open the system notification settings, for when the user has already refused. */
export async function openSystemNotificationSettingsAsync(): Promise<void> {
  await Linking.openSettings();
}

// TODO(Phase 4): replace with t() lookups. English only for now.
function reminderBody(reminder: PlannedReminder): string {
  const label = describeReminder(reminder);
  switch (label.kind) {
    case 'today':
      return 'Expires today';
    case 'tomorrow':
      return 'Expires tomorrow';
    case 'inDays':
      return `Expires in ${label.days} days`;
  }
}

let inFlight: Promise<number> | null = null;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * The one entry point for scheduling.
 *
 *  1. make sure the channel exists,
 *  2. cancel everything already scheduled,
 *  3. recompute every future reminder from the items,
 *  4. schedule the nearest 60.
 *
 * Concurrent calls coalesce onto the same promise so a burst of edits cannot interleave a
 * cancel with someone else's schedule and leave notifications missing.
 *
 * @returns how many notifications were scheduled.
 */
export async function reconcileNotifications(): Promise<number> {
  if (inFlight !== null) {
    return inFlight;
  }

  const run = (async (): Promise<number> => {
    await ensureNotificationChannelAsync();
    await Notifications.cancelAllScheduledNotificationsAsync();

    const { permission } = await readPermissionAsync();
    if (permission !== 'granted') {
      // Nothing may be delivered, so do not leave stale entries behind either.
      return 0;
    }

    const { items, settings } = useRenewalsStore.getState();
    const planned = planReminders(items, settings);

    for (const reminder of planned) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: reminder.title,
          body: reminderBody(reminder),
          data: { itemId: reminder.itemId, daysBefore: reminder.daysBefore },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: reminder.fireAt,
          channelId: NOTIFICATION_CHANNEL_ID,
        },
      });
    }

    return planned.length;
  })();

  inFlight = run;
  try {
    return await run;
  } finally {
    inFlight = null;
  }
}

/** Debounced reconcile, for wiring to store writes. */
export function scheduleReconcile(): void {
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void reconcileNotifications();
  }, RECONCILE_DEBOUNCE_MS);
}

/**
 * Fire one notification 10 seconds from now, for the "Not getting reminders?" screen.
 * Development builds only — a release build has no business shipping a test button that works.
 */
export async function sendTestNotificationAsync(): Promise<string | null> {
  if (!__DEV__) {
    return null;
  }
  await ensureNotificationChannelAsync();
  return Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test reminder',
      body: 'If you can see this, reminders are working on this device.',
      data: { test: true },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: TEST_NOTIFICATION_DELAY_SECONDS,
      channelId: NOTIFICATION_CHANNEL_ID,
    },
  });
}

/**
 * Wire reconcile to store changes, app start and foreground. Returns a disposer.
 *
 * Called once from the root layout. Reminders can still be delayed or suppressed by a phone
 * maker's battery settings — that is what the help screen is for, and no copy in this app
 * should promise exact-minute delivery.
 */
export function startNotificationSync(): () => void {
  configureForegroundNotificationHandler();

  const unsubscribeStore = useRenewalsStore.subscribe((state, previousState) => {
    if (state.items !== previousState.items || state.settings !== previousState.settings) {
      scheduleReconcile();
    }
  });

  const appStateSubscription = AppState.addEventListener('change', (status) => {
    if (status === 'active') {
      scheduleReconcile();
    }
  });

  // App start.
  scheduleReconcile();

  return () => {
    unsubscribeStore();
    appStateSubscription.remove();
    if (debounceTimer !== null) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
  };
}
