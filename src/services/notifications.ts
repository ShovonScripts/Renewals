/**
 * Local scheduled notifications only. No push, no server, no network.
 * Gracefully handles Expo Go / web environments where native notification modules are restricted.
 */

import { AppState, Linking, Platform } from 'react-native';
import Constants from 'expo-constants';

import { describeReminder, planReminders, type PlannedReminder } from '@/domain/reminders';
import { useRenewalsStore } from '@/store/store';

let Notifications: Record<string, any> | null = null;
if (Constants.appOwnership !== 'expo' && Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    Notifications = require('expo-notifications');
  } catch {
    // Fallback when native module is unavailable (e.g. Expo Go)
  }
}

export const NOTIFICATION_CHANNEL_ID = 'renewals';

const RECONCILE_DEBOUNCE_MS = 250;
export const TEST_NOTIFICATION_DELAY_SECONDS = 10;

const CHANNEL_NAME = 'Renewal reminders';
const CHANNEL_DESCRIPTION = 'Reminders before a document, subscription or warranty expires.';

export type NotificationPermission = 'granted' | 'denied' | 'undetermined';

export interface NotificationPermissionState {
  permission: NotificationPermission;
  canAskAgain: boolean;
}

function toPermissionState(status: { granted?: boolean; canAskAgain?: boolean }): NotificationPermissionState {
  if (!status) {
    return { permission: 'granted', canAskAgain: true };
  }
  const canAskAgain = status.canAskAgain ?? true;
  if (status.granted) {
    return { permission: 'granted', canAskAgain };
  }
  return { permission: canAskAgain ? 'undetermined' : 'denied', canAskAgain };
}

export function configureForegroundNotificationHandler(): void {
  if (Platform.OS === 'web' || !Notifications) {
    return;
  }
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (e) {
    console.warn('Failed to set notification handler:', e);
  }
}

export async function ensureNotificationChannelAsync(): Promise<void> {
  if (Platform.OS !== 'android' || !Notifications) {
    return;
  }
  try {
    await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
      name: CHANNEL_NAME,
      description: CHANNEL_DESCRIPTION,
      importance: Notifications.AndroidImportance?.DEFAULT ?? 3,
      showBadge: false,
      enableVibrate: true,
      enableLights: false,
    });
  } catch (e) {
    console.warn('Failed to set notification channel:', e);
  }
}

export async function readPermissionAsync(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web' || !Notifications) {
    return { permission: 'granted', canAskAgain: true };
  }
  try {
    const status = await Notifications.getPermissionsAsync();
    return toPermissionState(status);
  } catch {
    return { permission: 'granted', canAskAgain: true };
  }
}

export async function requestPermissionAsync(): Promise<NotificationPermissionState> {
  if (Platform.OS === 'web' || !Notifications) {
    return { permission: 'granted', canAskAgain: true };
  }
  try {
    const status = await Notifications.requestPermissionsAsync();
    return toPermissionState(status);
  } catch {
    return { permission: 'granted', canAskAgain: true };
  }
}

export async function openSystemNotificationSettingsAsync(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }
  await Linking.openSettings();
}

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

export async function reconcileNotifications(): Promise<number> {
  if (Platform.OS === 'web' || !Notifications) {
    return 0;
  }

  if (inFlight !== null) {
    return inFlight;
  }

  const run = (async (): Promise<number> => {
    try {
      await ensureNotificationChannelAsync();
      await Notifications.cancelAllScheduledNotificationsAsync();

      const { permission } = await readPermissionAsync();
      if (permission !== 'granted') {
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
            type: Notifications.SchedulableTriggerInputTypes?.DATE ?? 'date',
            date: reminder.fireAt,
            channelId: NOTIFICATION_CHANNEL_ID,
          },
        });
      }

      return planned.length;
    } catch (e) {
      console.warn('Reconcile notifications error:', e);
      return 0;
    }
  })();

  inFlight = run;
  try {
    return await run;
  } finally {
    inFlight = null;
  }
}

export function scheduleReconcile(): void {
  if (Platform.OS === 'web' || !Notifications) {
    return;
  }
  if (debounceTimer !== null) {
    clearTimeout(debounceTimer);
  }
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void reconcileNotifications();
  }, RECONCILE_DEBOUNCE_MS);
}

export async function sendTestNotificationAsync(): Promise<string | null> {
  if (!__DEV__ || Platform.OS === 'web' || !Notifications) {
    return null;
  }
  try {
    await ensureNotificationChannelAsync();
    return await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test reminder',
        body: 'If you can see this, reminders are working on this device.',
        data: { test: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes?.TIME_INTERVAL ?? 'timeInterval',
        seconds: TEST_NOTIFICATION_DELAY_SECONDS,
        channelId: NOTIFICATION_CHANNEL_ID,
      },
    });
  } catch (e) {
    console.warn('Send test notification error:', e);
    return null;
  }
}

export function startNotificationSync(): () => void {
  configureForegroundNotificationHandler();

  if (Platform.OS === 'web' || !Notifications) {
    return () => {};
  }

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
