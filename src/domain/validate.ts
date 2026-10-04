/**
 * PURE type guards and sanitizers. No React, no I/O. Never throws on bad data.
 *
 * docs/DATA_MODEL.md ("Validation"):
 *  - Every storage read and every imported backup passes through these guards.
 *  - A corrupt state blob is copied aside by the store and the app starts empty.
 *  - Sanitize on write: trim strings, clamp lengths, de-duplicate and sort reminderDays,
 *    drop attachments beyond 3.
 *
 * Two deliberately different policies:
 *  - READING STORAGE tolerates partially bad data: `partitionItems` keeps the valid items
 *    and counts the rest, because losing everything over one bad row is worse.
 *  - IMPORTING A BACKUP is all-or-nothing (docs/FEATURES.md F-10): one invalid item rejects
 *    the whole file and changes nothing.
 */

import { parseDateOnly } from '@/domain/dates';
import type {
  Attachment,
  BillingCycle,
  CategoryId,
  ItemStatus,
  Language,
  PersistedState,
  RenewalEvent,
  RenewalItem,
  Settings,
  ThemePreference,
} from '@/types';

export const MAX_TITLE_LENGTH = 60;
export const MAX_NOTES_LENGTH = 300;
export const MAX_REMINDER_VALUES = 5;
export const MAX_ATTACHMENTS = 3;
export const MIN_REMINDER_OFFSET = 0;
export const MAX_REMINDER_OFFSET = 365;
export const BACKUP_APP_ID = 'renewals';
export const BACKUP_VERSION = 1;

/** docs/FEATURES.md F-02. Order here is the order the category grid is rendered in. */
export const CATEGORY_IDS: readonly CategoryId[] = [
  'passport',
  'visa',
  'license',
  'id_card',
  'vehicle',
  'insurance',
  'subscription',
  'warranty',
  'domain_hosting',
  'other',
];

export const BILLING_CYCLES: readonly BillingCycle[] = ['none', 'weekly', 'monthly', 'yearly'];
export const ITEM_STATUSES: readonly ItemStatus[] = ['active', 'archived'];
export const LANGUAGES: readonly Language[] = ['bn', 'en'];
export const THEME_PREFERENCES: readonly ThemePreference[] = ['system', 'light', 'dark'];

// --------------------------------------------------------------------------- primitives

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value);
}

function isIntegerInRange(value: unknown, min: number, max: number): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max;
}

/** Positive, finite amount. Zero and negatives are treated as "no cost". */
function isValidAmount(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

/**
 * Attachments are stored inside the app sandbox and referenced by relative path. An imported
 * backup is untrusted input, so refuse absolute paths and parent traversal before anything
 * ever reaches expo-file-system.
 */
export function isSafeRelativePath(value: unknown): value is string {
  if (!isNonEmptyString(value)) {
    return false;
  }
  if (value.startsWith('/') || value.startsWith('\\')) {
    return false;
  }
  return !value.split(/[\\/]/).includes('..');
}

// --------------------------------------------------------------------------- guards

export function isAttachment(value: unknown): value is Attachment {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isNonEmptyString(value.id) && isSafeRelativePath(value.path) && isNonEmptyString(value.createdAt)
  );
}

export function isRenewalEvent(value: unknown): value is RenewalEvent {
  if (!isRecord(value)) {
    return false;
  }
  if (!isNonEmptyString(value.id) || !isNonEmptyString(value.renewedAt)) {
    return false;
  }
  if (parseDateOnly(String(value.previousExpiresOn)) === null) {
    return false;
  }
  if (parseDateOnly(String(value.newExpiresOn)) === null) {
    return false;
  }
  // `amount` is optional and may be null.
  return (
    value.amount === undefined || value.amount === null || isValidAmount(value.amount)
  );
}

/**
 * Structural validity of one item.
 *
 * Rejects: empty title, unknown category, unparseable or impossible expiry date,
 * a reminder value that is not an integer in 0..365,
 * more than 3 attachments, an unsafe attachment path, unknown billing cycle or status.
 *
 * Does NOT reject over-long title or notes — the sanitizer clamps those, per
 * docs/DATA_MODEL.md ("clamp lengths"). Does NOT reject more than 5 reminder values either;
 * those are de-duplicated, sorted and truncated on every read and import path.
 */
export function isRenewalItem(value: unknown): value is RenewalItem {
  if (!isRecord(value)) {
    return false;
  }
  if (!isNonEmptyString(value.id)) {
    return false;
  }
  if (typeof value.title !== 'string' || value.title.trim().length === 0) {
    return false;
  }
  if (!isOneOf(value.category, CATEGORY_IDS)) {
    return false;
  }
  if (typeof value.expiresOn !== 'string' || parseDateOnly(value.expiresOn) === null) {
    return false;
  }
  // Length is deliberately NOT capped here. More than 5 values is normalized away by
  // sanitizeReminderDays on every read and import path, so a backup with 6 offsets keeps its
  // item instead of losing it. Every value still has to be an integer in 0..365.
  if (
    !Array.isArray(value.reminderDays) ||
    !value.reminderDays.every((entry) =>
      isIntegerInRange(entry, MIN_REMINDER_OFFSET, MAX_REMINDER_OFFSET)
    )
  ) {
    return false;
  }
  if (!(value.amount === null || isValidAmount(value.amount))) {
    return false;
  }
  if (!isOneOf(value.billingCycle, BILLING_CYCLES)) {
    return false;
  }
  if (typeof value.autoRenews !== 'boolean') {
    return false;
  }
  if (typeof value.notes !== 'string') {
    return false;
  }
  if (
    !Array.isArray(value.attachments) ||
    value.attachments.length > MAX_ATTACHMENTS ||
    !value.attachments.every(isAttachment)
  ) {
    return false;
  }
  if (!isOneOf(value.status, ITEM_STATUSES)) {
    return false;
  }
  if (!Array.isArray(value.history) || !value.history.every(isRenewalEvent)) {
    return false;
  }
  return isNonEmptyString(value.createdAt) && isNonEmptyString(value.updatedAt);
}

export function isSettings(value: unknown): value is Settings {
  if (!isRecord(value)) {
    return false;
  }
  return (
    isOneOf(value.language, LANGUAGES) &&
    isNonEmptyString(value.currencyCode) &&
    typeof value.currencySymbol === 'string' &&
    isIntegerInRange(value.notifyHour, 0, 23) &&
    isIntegerInRange(value.notifyMinute, 0, 59) &&
    Array.isArray(value.defaultReminderDays) &&
    value.defaultReminderDays.every((entry) =>
      isIntegerInRange(entry, MIN_REMINDER_OFFSET, MAX_REMINDER_OFFSET)
    ) &&
    isOneOf(value.theme, THEME_PREFERENCES) &&
    typeof value.hasCompletedOnboarding === 'boolean' &&
    typeof value.notificationPermissionAsked === 'boolean'
  );
}

/** Backup files carry a partial Settings object; only the keys present are checked. */
export function isPartialSettings(value: unknown): value is Partial<Settings> {
  if (!isRecord(value)) {
    return false;
  }
  const checks: [string, (entry: unknown) => boolean][] = [
    ['language', (entry) => isOneOf(entry, LANGUAGES)],
    ['currencyCode', isNonEmptyString],
    ['currencySymbol', (entry) => typeof entry === 'string'],
    ['notifyHour', (entry) => isIntegerInRange(entry, 0, 23)],
    ['notifyMinute', (entry) => isIntegerInRange(entry, 0, 59)],
    [
      'defaultReminderDays',
      (entry) =>
        Array.isArray(entry) &&
        entry.every((day) => isIntegerInRange(day, MIN_REMINDER_OFFSET, MAX_REMINDER_OFFSET)),
    ],
    ['theme', (entry) => isOneOf(entry, THEME_PREFERENCES)],
    ['hasCompletedOnboarding', (entry) => typeof entry === 'boolean'],
    ['notificationPermissionAsked', (entry) => typeof entry === 'boolean'],
  ];

  return checks.every(([key, check]) => {
    const entry = value[key];
    return entry === undefined || check(entry);
  });
}

// --------------------------------------------------------------------------- sanitizers

export function clampString(value: string, maxLength: number): string {
  return value.trim().slice(0, maxLength);
}

/** Drop out-of-range and non-integer offsets, de-duplicate, sort descending, cap at 5. */
export function sanitizeReminderDays(value: readonly unknown[]): number[] {
  const unique = new Set<number>();
  for (const entry of value) {
    if (isIntegerInRange(entry, MIN_REMINDER_OFFSET, MAX_REMINDER_OFFSET)) {
      unique.add(entry);
    }
  }
  return [...unique].sort((a, b) => b - a).slice(0, MAX_REMINDER_VALUES);
}

export function normalizeAmount(value: number | null): number | null {
  return isValidAmount(value) ? value : null;
}

/**
 * Clamp an item's reminder offsets and leave everything else alone. Applied on every read and
 * import path so that a stored or imported item with 6 offsets keeps its item and loses the
 * extra offset, rather than being dropped.
 */
export function withNormalizedReminderDays(item: RenewalItem): RenewalItem {
  return { ...item, reminderDays: sanitizeReminderDays(item.reminderDays) };
}

/** Normalize one already-valid item before it is written to storage. */
export function sanitizeItem(item: RenewalItem): RenewalItem {
  return {
    ...item,
    title: clampString(item.title, MAX_TITLE_LENGTH),
    notes: clampString(item.notes, MAX_NOTES_LENGTH),
    category: isOneOf(item.category, CATEGORY_IDS) ? item.category : 'other',
    billingCycle: isOneOf(item.billingCycle, BILLING_CYCLES) ? item.billingCycle : 'none',
    status: isOneOf(item.status, ITEM_STATUSES) ? item.status : 'active',
    autoRenews: item.autoRenews === true,
    amount: normalizeAmount(item.amount),
    reminderDays: sanitizeReminderDays(item.reminderDays),
    attachments: item.attachments.slice(0, MAX_ATTACHMENTS).map((attachment) => ({
      ...attachment,
      id: attachment.id.trim(),
      path: attachment.path.trim(),
      createdAt: attachment.createdAt.trim(),
    })),
    history: item.history.filter(isRenewalEvent),
  };
}

/**
 * Normalize settings before they are written. `defaults` supplies the fallback for any field
 * that is out of range, so product defaults stay in the store and this function stays policy-free.
 */
export function sanitizeSettings(settings: Settings, defaults: Settings): Settings {
  return {
    language: isOneOf(settings.language, LANGUAGES) ? settings.language : defaults.language,
    currencyCode: clampString(settings.currencyCode, 12) || defaults.currencyCode,
    currencySymbol: clampString(settings.currencySymbol, 4) || defaults.currencySymbol,
    notifyHour: isIntegerInRange(settings.notifyHour, 0, 23)
      ? settings.notifyHour
      : defaults.notifyHour,
    notifyMinute: isIntegerInRange(settings.notifyMinute, 0, 59)
      ? settings.notifyMinute
      : defaults.notifyMinute,
    defaultReminderDays:
      sanitizeReminderDays(settings.defaultReminderDays).length > 0
        ? sanitizeReminderDays(settings.defaultReminderDays)
        : defaults.defaultReminderDays,
    theme: isOneOf(settings.theme, THEME_PREFERENCES) ? settings.theme : defaults.theme,
    hasCompletedOnboarding: settings.hasCompletedOnboarding === true,
    notificationPermissionAsked: settings.notificationPermissionAsked === true,
  };
}

export function sanitizeState(state: PersistedState, defaults: Settings): PersistedState {
  return {
    version: state.version,
    items: state.items.map(sanitizeItem),
    settings: sanitizeSettings(state.settings, defaults),
  };
}

// --------------------------------------------------------------------------- reading storage

/** Keep the valid items, count the rest. Never throws. */
export function partitionItems(value: unknown): { valid: RenewalItem[]; dropped: number } {
  if (!Array.isArray(value)) {
    return { valid: [], dropped: 0 };
  }
  const valid: RenewalItem[] = [];
  let dropped = 0;
  for (const entry of value) {
    if (isRenewalItem(entry)) {
      valid.push(entry);
    } else {
      dropped += 1;
    }
  }
  return { valid, dropped };
}

/**
 * Whole-blob failures. These are the only cases where the app starts empty: the JSON could not
 * be parsed, the top level was not an object, or the version marker was unusable.
 *
 * Invalid *settings* are not here — those are recoverable, see `settings: null` below.
 */
export type PersistedBlobFailure = 'not-json' | 'not-object' | 'bad-version';

export interface PersistedBlobRead {
  ok: true;
  version: number;
  /** Valid items, with reminder offsets already clamped to 5. */
  items: RenewalItem[];
  /** null when the stored settings were invalid — the caller substitutes its own defaults. */
  settings: Settings | null;
  /** How many entries in the items array failed validation. */
  droppedItems: number;
}

export type PersistedBlobResult = PersistedBlobRead | { ok: false; reason: PersistedBlobFailure };

/**
 * Parse the string read from AsyncStorage.
 *
 * Accepts both the Zustand persist envelope (`{ state: { items, settings }, version }`) and a
 * bare `{ version, items, settings }` blob.
 *
 * Recovery is graduated, not all-or-nothing:
 *  - unparseable JSON / non-object / unusable version -> `{ ok: false }`, store starts empty
 *  - some invalid items -> the valid ones are kept and the rest counted in `droppedItems`
 *  - invalid settings -> `settings: null`, items survive, caller resets settings to defaults
 */
export function parsePersistedBlob(raw: string): PersistedBlobResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not-json' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: 'not-object' };
  }

  const inner = isRecord(parsed.state) ? parsed.state : parsed;
  const version = isRecord(parsed.state) ? parsed.version : inner.version;

  if (!isIntegerInRange(version, 0, Number.MAX_SAFE_INTEGER)) {
    return { ok: false, reason: 'bad-version' };
  }

  const settings = isSettings(inner.settings) ? inner.settings : null;
  const { valid, dropped } = partitionItems(inner.items);

  return {
    ok: true,
    version,
    items: valid.map(withNormalizedReminderDays),
    settings,
    droppedItems: dropped,
  };
}

// --------------------------------------------------------------------------- backup import

export type BackupFailure =
  | 'not-json'
  | 'not-object'
  | 'wrong-app'
  | 'wrong-version'
  | 'items-not-array'
  | 'invalid-item'
  | 'invalid-settings';

export type BackupValidation =
  | { ok: true; items: RenewalItem[]; settings: Partial<Settings>; exportedAt: string | null }
  | { ok: false; reason: BackupFailure; index?: number };

/**
 * All-or-nothing backup validation (docs/FEATURES.md F-10). If any single item is invalid the
 * whole file is rejected and `index` says which one, so the UI can explain it.
 */
export function validateBackup(raw: string): BackupValidation {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, reason: 'not-json' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, reason: 'not-object' };
  }
  if (parsed.app !== BACKUP_APP_ID) {
    return { ok: false, reason: 'wrong-app' };
  }
  if (parsed.backupVersion !== BACKUP_VERSION) {
    return { ok: false, reason: 'wrong-version' };
  }
  if (!Array.isArray(parsed.items)) {
    return { ok: false, reason: 'items-not-array' };
  }
  if (parsed.settings !== undefined && !isPartialSettings(parsed.settings)) {
    return { ok: false, reason: 'invalid-settings' };
  }

  const items: RenewalItem[] = [];
  for (let index = 0; index < parsed.items.length; index += 1) {
    const entry = parsed.items[index];
    if (!isRenewalItem(entry)) {
      return { ok: false, reason: 'invalid-item', index };
    }
    // Same rule as a storage read: too many reminder offsets is normalized, not rejected.
    items.push(withNormalizedReminderDays(entry));
  }

  return {
    ok: true,
    items,
    settings: (parsed.settings as Partial<Settings> | undefined) ?? {},
    exportedAt: isNonEmptyString(parsed.exportedAt) ? parsed.exportedAt : null,
  };
}
