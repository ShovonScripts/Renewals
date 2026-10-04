/**
 * The single source of truth: Zustand + `persist` on AsyncStorage.
 *
 * docs/DATA_MODEL.md ("Storage layout"):
 *  - Key `@renewals/state`. One key holds items and settings together, so a crash can never
 *    leave them out of sync. No second storage system, no SQLite.
 *  - `version` starts at 1; each future change adds a pure, tested migrate step.
 *  - An unreadable blob is copied to `@renewals/corrupt-<timestamp>` and the app starts empty.
 *
 * Screens never touch AsyncStorage — they call these actions (docs/ARCHITECTURE.md).
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import { defaultReminderDaysFor } from '@/constants/reminders';
import { parseDateOnly } from '@/domain/dates';
import { parsePersistedBlob, sanitizeItem, sanitizeSettings } from '@/domain/validate';
import type {
  Attachment,
  BillingCycle,
  CategoryId,
  RenewalEvent,
  RenewalItem,
  Settings,
} from '@/types';

export const STORAGE_KEY = '@renewals/state';
export const CORRUPT_KEY_PREFIX = '@renewals/corrupt-';

/** Bump this and add a step to `migrations` whenever the persisted shape changes. */
export const STATE_VERSION = 1;

export const DEFAULT_SETTINGS: Settings = {
  language: 'en',
  currencyCode: 'USD',
  currencySymbol: '$',
  notifyHour: 9,
  notifyMinute: 0,
  defaultReminderDays: [30, 7, 1],
  theme: 'system',
  hasCompletedOnboarding: false,
  notificationPermissionAsked: false,
};

// --------------------------------------------------------------------------- ids

let sequence = 0;

function randomBase36(length: number): string {
  sequence = (sequence + 1) % 1679616;
  return sequence.toString(36).padStart(length, '0');
}

/** `itm_<Date.now() in base36>_<random 4 chars base36>` — docs/DATA_MODEL.md ("IDs"). */
export function newItemId(now: number = Date.now()): string {
  return `itm_${now.toString(36)}_${randomBase36(4)}`;
}

/** History entries use the same scheme with an `evt_` prefix. */
export function newEventId(now: number = Date.now()): string {
  return `evt_${now.toString(36)}_${randomBase36(4)}`;
}

// --------------------------------------------------------------------------- migrations

export type Migration = (state: unknown) => unknown;

/**
 * Step table, keyed by the version a step migrates FROM.
 * Empty at version 1. A step from version 1 to 2 is written as `1: (state) => ...`.
 */
export const migrations: Readonly<Record<number, Migration>> = {};

/**
 * Apply every step from `fromVersion` up to `toVersion`, in order. A missing step is skipped
 * rather than throwing, so an app downgraded by one release still reads its own data.
 */
export function applyMigrations(
  state: unknown,
  fromVersion: number,
  toVersion: number,
  table: Readonly<Record<number, Migration>> = migrations
): unknown {
  let current = state;
  for (let version = fromVersion; version < toVersion; version += 1) {
    const step = table[version];
    if (step !== undefined) {
      current = step(current);
    }
  }
  return current;
}

// --------------------------------------------------------------------------- recovery state

/**
 * What had to be repaired on the last hydration. This lives in the store rather than in a
 * module-level list so a screen can render a notice from it, and so every store instance —
 * including the ones tests create — has its own counters.
 */
export interface RecoveryState {
  /** Items that failed validation and were dropped from the stored blob. */
  droppedCount: number;
  /** True when the stored settings were invalid and were replaced with the defaults. */
  settingsWereReset: boolean;
  /** True when the whole blob was unreadable, so the app started empty. */
  storageWasCorrupt: boolean;
}

export const NO_RECOVERY: RecoveryState = {
  droppedCount: 0,
  settingsWereReset: false,
  storageWasCorrupt: false,
};

// --------------------------------------------------------------------------- store shape

export interface NewItemInput {
  title: string;
  category: CategoryId;
  /** 'YYYY-MM-DD'. */
  expiresOn: string;
  /** Falls back to the category default, then to Settings.defaultReminderDays. */
  reminderDays?: readonly number[];
  amount?: number | null;
  billingCycle?: BillingCycle;
  autoRenews?: boolean;
  notes?: string;
  attachments?: Attachment[];
}

export type ItemPatch = Partial<Omit<RenewalItem, 'id' | 'createdAt' | 'history'>>;

export interface RenewInput {
  /** 'YYYY-MM-DD'. */
  expiresOn: string;
  /** Optional new cost. Omit or pass null to keep the existing amount. */
  amount?: number | null;
}

export interface RenewalsData {
  items: RenewalItem[];
  settings: Settings;
}

export interface RenewalsActions {
  add: (input: NewItemInput) => RenewalItem;
  update: (id: string, patch: ItemPatch) => void;
  remove: (id: string) => void;
  archive: (id: string) => void;
  restore: (id: string) => void;
  markRenewed: (id: string, input: RenewInput) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setHasHydrated: (value: boolean) => void;
  applyRecovery: (recovery: RecoveryState) => void;
}

export type RenewalsState = RenewalsData &
  RecoveryState & { hasHydrated: boolean } & RenewalsActions;

// --------------------------------------------------------------------------- storage

/**
 * The raw key/value store underneath the validating layer. AsyncStorage satisfies this, and so
 * does zustand's own StateStorage. The write methods return `unknown` because StateStorage types
 * them as `void | Promise<unknown>` and the results are never read.
 */
export interface StorageBacking {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<unknown>;
  removeItem: (name: string) => void | Promise<unknown>;
}

export interface StoreOptions {
  /**
   * The raw backing store. Injectable for tests. Defaults to AsyncStorage.
   * Whatever is supplied here is ALWAYS wrapped by `createValidatingStorage`, so the
   * corrupt-blob recovery path applies in tests exactly as it does on a phone.
   */
  backing?: StorageBacking;
  /** Injectable for tests. */
  now?: () => Date;
}

function timestamp(now: () => Date): string {
  return now().toISOString();
}

/**
 * AsyncStorage wrapper that validates on read, per docs/DATA_MODEL.md.
 *  - Unreadable blob: copy the raw text to `@renewals/corrupt-<timestamp>`, return null so the
 *    store starts empty.
 *  - Readable blob with some invalid items: keep the valid ones, count the rest, and return the
 *    cleaned blob so the bad rows are gone on the next write.
 */
export function createValidatingStorage(
  backing: StorageBacking = AsyncStorage,
  now: () => Date = () => new Date(),
  recovery: RecoveryState = { ...NO_RECOVERY }
): StateStorage {
  const copyAside = (raw: string): unknown =>
    backing.setItem(`${CORRUPT_KEY_PREFIX}${now().getTime()}`, raw);

  return {
    getItem: async (name: string): Promise<string | null> => {
      const raw = await backing.getItem(name);
      if (raw === null) {
        return null;
      }

      const result = parsePersistedBlob(raw);

      // Whole-blob corruption: unparseable JSON or an unusable top-level shape. Copy the raw
      // text aside and start empty.
      if (!result.ok) {
        await copyAside(raw);
        recovery.storageWasCorrupt = true;
        return null;
      }

      const settingsWereReset = result.settings === null;

      // Anything we had to repair is worth keeping a copy of, even though the app carries on
      // with the valid parts.
      if (result.droppedItems > 0 || settingsWereReset) {
        await copyAside(raw);
      }

      recovery.droppedCount += result.droppedItems;
      recovery.settingsWereReset = recovery.settingsWereReset || settingsWereReset;

      return JSON.stringify({
        state: { items: result.items, settings: result.settings ?? DEFAULT_SETTINGS },
        version: result.version,
      });
    },
    setItem: (name: string, value: string) => backing.setItem(name, value),
    removeItem: (name: string) => backing.removeItem(name),
  };
}

// --------------------------------------------------------------------------- store factory

export function createRenewalsStore(options: StoreOptions = {}) {
  const now = options.now ?? ((): Date => new Date());
  // Filled in by the storage layer during hydration, then copied into state.
  const recovery: RecoveryState = { ...NO_RECOVERY };
  // Always validate, whatever the backing store is. Wrapping rather than substituting is what
  // keeps the corrupt-blob recovery path covered by tests instead of only reachable in production.
  const storage = createJSONStorage(() =>
    createValidatingStorage(options.backing ?? AsyncStorage, now, recovery)
  );

  return create<RenewalsState>()(
    persist(
      (set, get) => ({
        items: [],
        settings: DEFAULT_SETTINGS,
        hasHydrated: false,
        droppedCount: 0,
        settingsWereReset: false,
        storageWasCorrupt: false,

        add: (input) => {
          if (parseDateOnly(input.expiresOn) === null) {
            throw new TypeError(`add: expiresOn must be a real 'YYYY-MM-DD' date, got "${input.expiresOn}"`);
          }

          const createdAt = timestamp(now);
          const reminderDays =
            input.reminderDays ??
            defaultReminderDaysFor(input.category) ??
            get().settings.defaultReminderDays;

          const item = sanitizeItem({
            id: newItemId(now().getTime()),
            title: input.title,
            category: input.category,
            expiresOn: input.expiresOn,
            reminderDays: [...reminderDays],
            amount: input.amount ?? null,
            billingCycle: input.billingCycle ?? 'none',
            autoRenews: input.autoRenews ?? false,
            notes: input.notes ?? '',
            attachments: input.attachments ?? [],
            status: 'active',
            history: [],
            createdAt,
            updatedAt: createdAt,
          });

          set((state) => ({ items: [item, ...state.items] }));
          return item;
        },

        update: (id, patch) => {
          if (patch.expiresOn !== undefined && parseDateOnly(patch.expiresOn) === null) {
            throw new TypeError(`update: expiresOn must be a real 'YYYY-MM-DD' date, got "${patch.expiresOn}"`);
          }
          const updatedAt = timestamp(now);
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? sanitizeItem({ ...item, ...patch, id: item.id, updatedAt }) : item
            ),
          }));
        },

        remove: (id) => {
          set((state) => ({ items: state.items.filter((item) => item.id !== id) }));
        },

        archive: (id) => {
          const updatedAt = timestamp(now);
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, status: 'archived', updatedAt } : item
            ),
          }));
        },

        restore: (id) => {
          const updatedAt = timestamp(now);
          set((state) => ({
            items: state.items.map((item) =>
              item.id === id ? { ...item, status: 'active', updatedAt } : item
            ),
          }));
        },

        markRenewed: (id, input) => {
          if (parseDateOnly(input.expiresOn) === null) {
            throw new TypeError(`markRenewed: expiresOn must be a real 'YYYY-MM-DD' date, got "${input.expiresOn}"`);
          }
          const renewedAt = timestamp(now);
          set((state) => ({
            items: state.items.map((item) => {
              if (item.id !== id) {
                return item;
              }
              const event: RenewalEvent = {
                id: newEventId(now().getTime()),
                renewedAt,
                previousExpiresOn: item.expiresOn,
                newExpiresOn: input.expiresOn,
                amount: input.amount ?? null,
              };
              return sanitizeItem({
                ...item,
                expiresOn: input.expiresOn,
                amount: input.amount ?? item.amount,
                history: [...item.history, event],
                updatedAt: renewedAt,
              });
            }),
          }));
        },

        updateSettings: (patch) => {
          set((state) => ({
            settings: sanitizeSettings({ ...state.settings, ...patch }, DEFAULT_SETTINGS),
          }));
        },

        setHasHydrated: (value) => {
          set({ hasHydrated: value });
        },

        applyRecovery: (value) => {
          set({
            droppedCount: value.droppedCount,
            settingsWereReset: value.settingsWereReset,
            storageWasCorrupt: value.storageWasCorrupt,
          });
        },
      }),
      {
        name: STORAGE_KEY,
        version: STATE_VERSION,
        storage,
        migrate: (persistedState, version) =>
          applyMigrations(persistedState, version, STATE_VERSION),
        // `version` lives in the persist envelope, not in the state, so there is one copy of it.
        partialize: (state): RenewalsData => ({ items: state.items, settings: state.settings }),
        onRehydrateStorage: () => (state) => {
          state?.setHasHydrated(true);
          state?.applyRecovery(recovery);
        },
      }
    )
  );
}

export type RenewalsStore = ReturnType<typeof createRenewalsStore>;

/** The app-wide store. Screens read from this and call its actions. */
export const useRenewalsStore = createRenewalsStore();
export const useStore = useRenewalsStore;
