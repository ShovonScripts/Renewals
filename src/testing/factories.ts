/**
 * Test-only factories. Nothing under `src/app` imports this file, so it never reaches the
 * Metro bundle — it exists so the unit tests do not each re-declare a 15-field item literal.
 */

import type { RenewalItem, Settings } from '@/types';

/** A valid item matching the example in docs/DATA_MODEL.md. Override any field. */
export function makeItem(overrides: Partial<RenewalItem> = {}): RenewalItem {
  return {
    id: 'itm_m1abc2_x7k2',
    title: 'Passport',
    category: 'passport',
    expiresOn: '2028-03-15',
    reminderDays: [90, 30, 7, 1],
    amount: null,
    billingCycle: 'none',
    autoRenews: false,
    notes: '',
    attachments: [],
    status: 'active',
    history: [],
    createdAt: '2026-10-04T08:00:00.000Z',
    updatedAt: '2026-10-04T08:00:00.000Z',
    ...overrides,
  };
}

/** A valid Settings object. Override any field. */
export function makeSettings(overrides: Partial<Settings> = {}): Settings {
  return {
    language: 'en',
    currencyCode: 'BDT',
    currencySymbol: '৳',
    notifyHour: 9,
    notifyMinute: 0,
    defaultReminderDays: [30, 7, 1],
    theme: 'system',
    hasCompletedOnboarding: false,
    notificationPermissionAsked: false,
    ...overrides,
  };
}

export interface BackupFile {
  app: string;
  backupVersion: number;
  exportedAt: string;
  settings: Partial<Settings>;
  items: unknown[];
}

/** A backup file in the docs/DATA_MODEL.md format. Override any field to make it invalid. */
export function makeBackup(overrides: Partial<BackupFile> = {}): string {
  const file: BackupFile = {
    app: 'renewals',
    backupVersion: 1,
    exportedAt: '2026-10-04T08:00:00.000Z',
    settings: { language: 'bn', currencyCode: 'BDT' },
    items: [makeItem()],
    ...overrides,
  };
  return JSON.stringify(file);
}

/**
 * In-memory StateStorage so store tests never touch the AsyncStorage mock's shared state.
 * Signatures are spelled out rather than extending zustand's `StateStorage<R>`, whose write
 * methods default to returning `unknown`.
 */
export interface MemoryStorage {
  /** Everything written so far, so tests can assert on the corrupt-copy key. */
  dump: Record<string, string>;
  getItem: (name: string) => Promise<string | null>;
  setItem: (name: string, value: string) => Promise<void>;
  removeItem: (name: string) => Promise<void>;
}

/** In-memory StateStorage so store tests never touch the AsyncStorage mock's shared state. */
export function createMemoryStorage(initial: Record<string, string> = {}): MemoryStorage {
  const dump: Record<string, string> = { ...initial };
  return {
    dump,
    getItem: async (name: string) => (name in dump ? dump[name] : null),
    setItem: async (name: string, value: string) => {
      dump[name] = value;
    },
    removeItem: async (name: string) => {
      delete dump[name];
    },
  };
}
