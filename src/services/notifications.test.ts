/**
 * The scheduling calls themselves need a real phone — see the Phase 2 report for the N1-N10
 * script. What CAN be checked here is that `reconcileNotifications()` actually applies what
 * `planReminders` computed: that it cancels first, that it refuses to schedule without
 * permission, that it honours the 60-notification cap, and that the trigger it builds is the
 * DATE trigger with the channel id attached.
 *
 * expo-notifications is mocked, so nothing here proves a notification is ever delivered.
 */

import { Platform } from 'react-native';

import * as Notifications from 'expo-notifications';
import type { NotificationRequestInput } from 'expo-notifications';

import {
  NOTIFICATION_CHANNEL_ID,
  TEST_NOTIFICATION_DELAY_SECONDS,
  configureForegroundNotificationHandler,
  readPermissionAsync,
  reconcileNotifications,
  sendTestNotificationAsync,
} from '@/services/notifications';
import { useRenewalsStore } from '@/store/store';
import { addDays, toDateOnlyString } from '@/domain/dates';
import { makeItem } from '@/testing/factories';
import type { RenewalItem } from '@/types';

// jest.mock is hoisted above the imports, so anything the factory closes over has to be
// prefixed with `mock`.
const mockScheduled: NotificationRequestInput[] = [];
const mockCancels: number[] = [];
let mockPermission: { granted: boolean; canAskAgain: boolean } = { granted: true, canAskAgain: false };

jest.mock('expo-notifications', () => ({
  AndroidImportance: { DEFAULT: 5 },
  SchedulableTriggerInputTypes: { DATE: 'date', TIME_INTERVAL: 'timeInterval' },
  setNotificationChannelAsync: jest.fn(async () => null),
  setNotificationHandler: jest.fn(),
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {
    mockCancels.push(mockScheduled.length);
    mockScheduled.length = 0;
  }),
  getPermissionsAsync: jest.fn(async () => mockPermission),
  requestPermissionsAsync: jest.fn(async () => mockPermission),
  scheduleNotificationAsync: jest.fn(async (request: NotificationRequestInput) => {
    mockScheduled.push(request);
    return `scheduled_${mockScheduled.length}`;
  }),
}));


function inDays(days: number): string {
  return toDateOnlyString(addDays(new Date(2026, 9, 4), days));
}

function setItems(items: RenewalItem[]): void {
  useRenewalsStore.setState({ items });
}

beforeEach(() => {
  // Keeps `not.toHaveBeenCalled()` assertions honest across tests. clearAllMocks drops call
  // records but keeps the implementations the factory installed.
  jest.clearAllMocks();
  mockScheduled.length = 0;
  mockCancels.length = 0;
  mockPermission = { granted: true, canAskAgain: false };
  setItems([]);
});

describe('reconcileNotifications', () => {
  it('schedules one notification per planned reminder, soonest first', async () => {
    setItems([
      makeItem({ id: 'itm_far', title: 'Far', expiresOn: inDays(40), reminderDays: [30] }),
      makeItem({ id: 'itm_near', title: 'Near', expiresOn: inDays(10), reminderDays: [7] }),
    ]);

    const count = await reconcileNotifications();

    expect(count).toBe(2);
    expect(mockScheduled).toHaveLength(2);
    expect(mockScheduled[0]?.content.title).toBe('Near');
    expect(mockScheduled[1]?.content.title).toBe('Far');
  });

  it('cancels everything already scheduled before scheduling again', async () => {
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7] })]);

    await reconcileNotifications();
    expect(mockScheduled).toHaveLength(1);

    // Editing the item to a later date must not leave the old reminder behind.
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(60), reminderDays: [7] })]);
    const count = await reconcileNotifications();

    expect(mockCancels).toHaveLength(2);
    expect(count).toBe(1);
    expect(mockScheduled).toHaveLength(1);
  });

  it('builds a DATE trigger carrying the channel id', async () => {
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7] })]);

    await reconcileNotifications();

    expect(mockScheduled[0]?.trigger).toMatchObject({
      type: 'date',
      channelId: NOTIFICATION_CHANNEL_ID,
    });
    expect(NOTIFICATION_CHANNEL_ID).toBe('renewals');
  });

  it('puts the item id and offset in the payload so a tap can open the item', async () => {
    setItems([makeItem({ id: 'itm_passport', expiresOn: inDays(10), reminderDays: [7] })]);

    await reconcileNotifications();

    expect(mockScheduled[0]?.content.data).toEqual({ itemId: 'itm_passport', daysBefore: 7 });
  });

  it('schedules nothing and still cancels when permission is not granted', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7, 1] })]);

    const count = await reconcileNotifications();

    expect(count).toBe(0);
    expect(mockScheduled).toEqual([]);
    expect(mockCancels).toHaveLength(1);
  });

  it('never exceeds the 60-notification cap', async () => {
    setItems(
      Array.from({ length: 100 }, (_, index) =>
        makeItem({ id: `itm_${index}`, expiresOn: inDays(index + 10), reminderDays: [7] })
      )
    );

    const count = await reconcileNotifications();

    expect(count).toBe(60);
    expect(mockScheduled).toHaveLength(60);
  });

  it('is idempotent: reconciling twice with no change schedules the same set', async () => {
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7, 1] })]);

    await reconcileNotifications();
    const first = mockScheduled.map((request) => request.content.data);

    await reconcileNotifications();
    const second = mockScheduled.map((request) => request.content.data);

    expect(second).toEqual(first);
  });
});

describe('permission helpers', () => {
  it('maps a granted status', async () => {
    mockPermission = { granted: true, canAskAgain: true };
    expect(await readPermissionAsync()).toEqual({ permission: 'granted', canAskAgain: true });
  });

  it('maps a refusal the system will not ask about again as denied', async () => {
    mockPermission = { granted: false, canAskAgain: false };
    expect(await readPermissionAsync()).toEqual({ permission: 'denied', canAskAgain: false });
  });

  it('maps "not asked yet" as undetermined', async () => {
    mockPermission = { granted: false, canAskAgain: true };
    expect(await readPermissionAsync()).toEqual({ permission: 'undetermined', canAskAgain: true });
  });
});

describe('foreground handler and test notification', () => {
  it('registers a handler that shows the notification while the app is open', () => {
    // Without this, expo-notifications discards notifications that arrive in the foreground.
    expect(() => configureForegroundNotificationHandler()).not.toThrow();
  });

  it('schedules the test notification 10 seconds out, in development builds only', async () => {
    expect(__DEV__).toBe(true);
    expect(TEST_NOTIFICATION_DELAY_SECONDS).toBe(10);

    const id = await sendTestNotificationAsync();

    expect(id).not.toBeNull();
    expect(mockScheduled[0]?.trigger).toMatchObject({
      type: 'timeInterval',
      seconds: 10,
      channelId: NOTIFICATION_CHANNEL_ID,
    });
  });
});

describe('Android notification channel', () => {
  // The default jest-expo preset reports Platform.OS === 'ios', which would leave the one
  // Android-specific code path in this service completely untested. `OS` is a plain
  // configurable data property on the mocked Platform, so it can be replaced per test.
  it('creates the "renewals" channel with default importance', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7] })]);

    await reconcileNotifications();

    expect(jest.mocked(Notifications.setNotificationChannelAsync)).toHaveBeenCalledWith(
      NOTIFICATION_CHANNEL_ID,
      expect.objectContaining({
        name: expect.any(String),
        importance: Notifications.AndroidImportance.DEFAULT,
      })
    );
    expect(Platform.OS).toBe('android');
  });

  it('skips channel creation on other platforms', async () => {
    jest.replaceProperty(Platform, 'OS', 'ios');
    setItems([makeItem({ id: 'itm_a', expiresOn: inDays(10), reminderDays: [7] })]);

    await reconcileNotifications();

    expect(jest.mocked(Notifications.setNotificationChannelAsync)).not.toHaveBeenCalled();
    // Scheduling still happens; only the channel step is Android-specific.
    expect(mockScheduled).toHaveLength(1);
  });
});
