/**
 * Type declarations only — no logic. Copied from docs/DATA_MODEL.md.
 * Every read from storage and every imported backup is validated against these
 * by `domain/validate.ts` (Phase 1).
 */

export type CategoryId =
  | 'passport'
  | 'visa'
  | 'license'
  | 'id_card'
  | 'vehicle'
  | 'insurance'
  | 'subscription'
  | 'warranty'
  | 'domain_hosting'
  | 'other';

export type BillingCycle = 'none' | 'weekly' | 'monthly' | 'yearly';

export type ItemStatus = 'active' | 'archived';

export type Language = 'bn' | 'en';

export type ThemePreference = 'system' | 'light' | 'dark';

export interface Attachment {
  id: string;
  /** Relative to the app document folder, e.g. "attachments/itm_x/photo1.jpg". */
  path: string;
  /** ISO timestamp. */
  createdAt: string;
}

export interface RenewalEvent {
  id: string;
  /** ISO timestamp. */
  renewedAt: string;
  /** 'YYYY-MM-DD' */
  previousExpiresOn: string;
  /** 'YYYY-MM-DD' */
  newExpiresOn: string;
  amount?: number | null;
}

export interface RenewalItem {
  id: string;
  /** 1..60 chars. */
  title: string;
  category: CategoryId;
  /** 'YYYY-MM-DD' — a local calendar date, never a UTC timestamp. */
  expiresOn: string;
  /** Unique integers 0..365, sorted descending, max 5 entries. */
  reminderDays: number[];
  /** Greater than 0 when set. */
  amount: number | null;
  billingCycle: BillingCycle;
  autoRenews: boolean;
  /** Max 300 chars. */
  notes: string;
  /** Max 3 entries. */
  attachments: Attachment[];
  status: ItemStatus;
  history: RenewalEvent[];
  /** ISO timestamp. */
  createdAt: string;
  /** ISO timestamp. */
  updatedAt: string;
}

export interface Settings {
  language: Language;
  /** e.g. 'BDT' */
  currencyCode: string;
  /** e.g. '৳' */
  currencySymbol: string;
  /** 0..23, default 9. */
  notifyHour: number;
  /** 0..59, default 0. */
  notifyMinute: number;
  /** Used when a category has no specific default. */
  defaultReminderDays: number[];
  theme: ThemePreference;
  hasCompletedOnboarding: boolean;
  notificationPermissionAsked: boolean;
}

/** The whole persisted blob, held under the AsyncStorage key `@renewals/state`. */
export interface PersistedState {
  version: number;
  items: RenewalItem[];
  settings: Settings;
}
