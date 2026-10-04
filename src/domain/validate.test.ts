import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  MAX_ATTACHMENTS,
  MAX_NOTES_LENGTH,
  MAX_REMINDER_VALUES,
  MAX_TITLE_LENGTH,
  clampString,
  isAttachment,
  isPartialSettings,
  isRenewalEvent,
  isRenewalItem,
  isSafeRelativePath,
  isSettings,
  normalizeAmount,
  parsePersistedBlob,
  partitionItems,
  sanitizeItem,
  sanitizeReminderDays,
  sanitizeSettings,
  sanitizeState,
  validateBackup,
} from '@/domain/validate';
import { makeBackup, makeItem, makeSettings } from '@/testing/factories';

describe('isRenewalItem', () => {
  it('accepts the example item from docs/DATA_MODEL.md', () => {
    expect(isRenewalItem(makeItem())).toBe(true);
  });

  it('rejects a missing or non-object value', () => {
    expect(isRenewalItem(null)).toBe(false);
    expect(isRenewalItem(undefined)).toBe(false);
    expect(isRenewalItem('item')).toBe(false);
    expect(isRenewalItem([])).toBe(false);
  });

  it('rejects an empty or whitespace-only title', () => {
    expect(isRenewalItem(makeItem({ title: '' }))).toBe(false);
    expect(isRenewalItem(makeItem({ title: '   ' }))).toBe(false);
  });

  it('rejects an impossible expiry date', () => {
    expect(isRenewalItem(makeItem({ expiresOn: '2026-02-31' }))).toBe(false);
    expect(isRenewalItem(makeItem({ expiresOn: '2026-02-30' }))).toBe(false);
    expect(isRenewalItem(makeItem({ expiresOn: 'not-a-date' }))).toBe(false);
    expect(isRenewalItem(makeItem({ expiresOn: '' }))).toBe(false);
  });

  it('rejects an unknown category', () => {
    expect(isRenewalItem(makeItem({ category: 'crypto' as never }))).toBe(false);
  });

  it('accepts more than 5 reminder values — the sanitizer clamps them, the item survives', () => {
    expect(isRenewalItem(makeItem({ reminderDays: [365, 90, 30, 7, 1] }))).toBe(true);
    expect(isRenewalItem(makeItem({ reminderDays: [365, 180, 90, 30, 7, 1] }))).toBe(true);
    expect(
      sanitizeItem(makeItem({ reminderDays: [365, 180, 90, 30, 7, 1] })).reminderDays
    ).toEqual([365, 180, 90, 30, 7]);
  });

  it('rejects a reminder value that is not an integer in 0..365', () => {
    expect(isRenewalItem(makeItem({ reminderDays: [-1] }))).toBe(false);
    expect(isRenewalItem(makeItem({ reminderDays: [366] }))).toBe(false);
    expect(isRenewalItem(makeItem({ reminderDays: [7.5] }))).toBe(false);
    expect(isRenewalItem(makeItem({ reminderDays: ['7' as never] }))).toBe(false);
  });

  it('accepts 0 as a reminder value (remind on the day)', () => {
    expect(isRenewalItem(makeItem({ reminderDays: [0] }))).toBe(true);
  });

  it('rejects a bad amount but accepts null', () => {
    expect(isRenewalItem(makeItem({ amount: null }))).toBe(true);
    expect(isRenewalItem(makeItem({ amount: 500 }))).toBe(true);
    expect(isRenewalItem(makeItem({ amount: 0 }))).toBe(false);
    expect(isRenewalItem(makeItem({ amount: -5 }))).toBe(false);
    expect(isRenewalItem(makeItem({ amount: Number.NaN }))).toBe(false);
    expect(isRenewalItem(makeItem({ amount: '500' as never }))).toBe(false);
  });

  it('rejects more than 3 attachments', () => {
    const attachments = Array.from({ length: MAX_ATTACHMENTS + 1 }, (_, index) => ({
      id: `att_${index}`,
      path: `attachments/itm_x/photo${index}.jpg`,
      createdAt: '2026-10-04T08:00:00.000Z',
    }));
    expect(isRenewalItem(makeItem({ attachments }))).toBe(false);
    expect(isRenewalItem(makeItem({ attachments: attachments.slice(0, MAX_ATTACHMENTS) }))).toBe(true);
  });

  it('rejects an unknown status or billing cycle', () => {
    expect(isRenewalItem(makeItem({ status: 'deleted' as never }))).toBe(false);
    expect(isRenewalItem(makeItem({ billingCycle: 'daily' as never }))).toBe(false);
  });

  it('rejects a malformed history entry', () => {
    expect(
      isRenewalItem(
        makeItem({
          history: [
            {
              id: 'evt_1',
              renewedAt: '2026-10-04T08:00:00.000Z',
              previousExpiresOn: '2026-02-31',
              newExpiresOn: '2028-03-15',
            },
          ],
        })
      )
    ).toBe(false);
  });

  it('rejects missing timestamps', () => {
    expect(isRenewalItem(makeItem({ createdAt: '' }))).toBe(false);
    expect(isRenewalItem(makeItem({ updatedAt: '' }))).toBe(false);
  });
});

describe('isSafeRelativePath', () => {
  it('accepts a sandbox-relative path', () => {
    expect(isSafeRelativePath('attachments/itm_x/photo1.jpg')).toBe(true);
  });

  it('rejects absolute paths and parent traversal from an untrusted backup', () => {
    expect(isSafeRelativePath('/etc/passwd')).toBe(false);
    expect(isSafeRelativePath('\\windows\\system32')).toBe(false);
    expect(isSafeRelativePath('../../shared/evil.jpg')).toBe(false);
    expect(isSafeRelativePath('attachments/../../evil.jpg')).toBe(false);
    expect(isSafeRelativePath('')).toBe(false);
  });

  it('allows a filename that merely contains two dots', () => {
    expect(isSafeRelativePath('attachments/photo..1.jpg')).toBe(true);
  });
});

describe('isAttachment and isRenewalEvent', () => {
  it('validates attachments', () => {
    expect(
      isAttachment({ id: 'att_1', path: 'attachments/a.jpg', createdAt: '2026-10-04T08:00:00.000Z' })
    ).toBe(true);
    expect(isAttachment({ id: '', path: 'attachments/a.jpg', createdAt: 'x' })).toBe(false);
    expect(isAttachment({ id: 'att_1', path: '/abs.jpg', createdAt: 'x' })).toBe(false);
  });

  it('validates renewal events', () => {
    expect(
      isRenewalEvent({
        id: 'evt_1',
        renewedAt: '2026-10-04T08:00:00.000Z',
        previousExpiresOn: '2026-03-15',
        newExpiresOn: '2028-03-15',
        amount: 500,
      })
    ).toBe(true);
    expect(
      isRenewalEvent({
        id: 'evt_1',
        renewedAt: '2026-10-04T08:00:00.000Z',
        previousExpiresOn: '2026-03-15',
        newExpiresOn: '2028-03-15',
      })
    ).toBe(true); // amount is optional
    expect(
      isRenewalEvent({
        id: 'evt_1',
        renewedAt: '2026-10-04T08:00:00.000Z',
        previousExpiresOn: '2026-03-15',
        newExpiresOn: '2028-02-30',
      })
    ).toBe(false);
  });
});

describe('isSettings and isPartialSettings', () => {
  it('accepts valid settings', () => {
    expect(isSettings(makeSettings())).toBe(true);
  });

  it('rejects out-of-range notification times', () => {
    expect(isSettings(makeSettings({ notifyHour: 24 }))).toBe(false);
    expect(isSettings(makeSettings({ notifyHour: -1 }))).toBe(false);
    expect(isSettings(makeSettings({ notifyMinute: 60 }))).toBe(false);
  });

  it('rejects an unknown language or theme', () => {
    expect(isSettings(makeSettings({ language: 'fr' as never }))).toBe(false);
    expect(isSettings(makeSettings({ theme: 'sepia' as never }))).toBe(false);
  });

  it('accepts a partial settings object from a backup and checks only present keys', () => {
    expect(isPartialSettings({ language: 'bn', currencyCode: 'BDT' })).toBe(true);
    expect(isPartialSettings({})).toBe(true);
    expect(isPartialSettings({ language: 'fr' })).toBe(false);
    expect(isPartialSettings({ notifyHour: 99 })).toBe(false);
  });
});

describe('sanitizeReminderDays', () => {
  it('de-duplicates and sorts descending', () => {
    expect(sanitizeReminderDays([7, 30, 30, 1, 90])).toEqual([90, 30, 7, 1]);
  });

  it('drops out-of-range and non-integer values', () => {
    expect(sanitizeReminderDays([-1, 366, 7.5, 30, 'x', null])).toEqual([30]);
  });

  it(`caps at ${MAX_REMINDER_VALUES} values, keeping the largest offsets`, () => {
    expect(sanitizeReminderDays([1, 2, 3, 7, 30, 90, 365])).toEqual([365, 90, 30, 7, 3]);
  });

  it('keeps 0', () => {
    expect(sanitizeReminderDays([0, 7])).toEqual([7, 0]);
  });

  it('returns an empty array for empty input', () => {
    expect(sanitizeReminderDays([])).toEqual([]);
  });
});

describe('sanitizeItem', () => {
  it('trims and clamps the title', () => {
    const long = 'x'.repeat(MAX_TITLE_LENGTH + 40);
    expect(sanitizeItem(makeItem({ title: `  ${long}  ` })).title).toHaveLength(MAX_TITLE_LENGTH);
  });

  it('trims and clamps the notes', () => {
    const long = 'n'.repeat(MAX_NOTES_LENGTH + 100);
    expect(sanitizeItem(makeItem({ notes: `  ${long}  ` })).notes).toHaveLength(MAX_NOTES_LENGTH);
  });

  it('drops attachments beyond 3', () => {
    const attachments = Array.from({ length: 5 }, (_, index) => ({
      id: `att_${index}`,
      path: `attachments/itm_x/photo${index}.jpg`,
      createdAt: '2026-10-04T08:00:00.000Z',
    }));
    // The guard would reject 5; sanitize is the last line of defence on the write path.
    expect(sanitizeItem(makeItem({ attachments })).attachments).toHaveLength(MAX_ATTACHMENTS);
  });

  it('normalizes a bad amount to null', () => {
    expect(sanitizeItem(makeItem({ amount: -5 })).amount).toBeNull();
    expect(sanitizeItem(makeItem({ amount: 500 })).amount).toBe(500);
  });

  it('normalizes amount to null when the billing cycle is none', () => {
    // The amount survives; it is billingCycle 'none' that keeps it out of the totals.
    expect(sanitizeItem(makeItem({ amount: 500, billingCycle: 'none' })).amount).toBe(500);
  });

  it('normalizes amount and cycle together', () => {
    expect(normalizeAmount(0)).toBeNull();
    expect(normalizeAmount(null)).toBeNull();
    expect(normalizeAmount(12.5)).toBe(12.5);
  });

  it('falls back to a safe category, cycle and status', () => {
    const sanitized = sanitizeItem(
      makeItem({
        category: 'crypto' as never,
        billingCycle: 'daily' as never,
        status: 'deleted' as never,
      })
    );
    expect(sanitized.category).toBe('other');
    expect(sanitized.billingCycle).toBe('none');
    expect(sanitized.status).toBe('active');
  });
});

describe('sanitizeSettings', () => {
  const defaults = makeSettings();

  it('passes valid settings through', () => {
    expect(sanitizeSettings(makeSettings({ notifyHour: 21 }), defaults).notifyHour).toBe(21);
  });

  it('falls back to the supplied defaults for out-of-range values', () => {
    const sanitized = sanitizeSettings(
      makeSettings({ notifyHour: 99, notifyMinute: -3, language: 'fr' as never }),
      defaults
    );
    expect(sanitized.notifyHour).toBe(defaults.notifyHour);
    expect(sanitized.notifyMinute).toBe(defaults.notifyMinute);
    expect(sanitized.language).toBe(defaults.language);
  });

  it('falls back when every default reminder value is invalid', () => {
    const sanitized = sanitizeSettings(makeSettings({ defaultReminderDays: [-5, 999] }), defaults);
    expect(sanitized.defaultReminderDays).toEqual(defaults.defaultReminderDays);
  });

  it('coerces non-boolean flags to false', () => {
    const sanitized = sanitizeSettings(
      makeSettings({ hasCompletedOnboarding: undefined as never }),
      defaults
    );
    expect(sanitized.hasCompletedOnboarding).toBe(false);
  });
});

describe('clampString', () => {
  it('trims then truncates', () => {
    expect(clampString('  hello world  ', 5)).toBe('hello');
  });
});

describe('partitionItems', () => {
  it('keeps valid items and counts the rest', () => {
    const { valid, dropped } = partitionItems([
      makeItem({ id: 'ok_1' }),
      makeItem({ id: 'bad', title: '' }),
      makeItem({ id: 'ok_2' }),
      'not-an-item',
      null,
    ]);
    expect(valid.map((item) => item.id)).toEqual(['ok_1', 'ok_2']);
    expect(dropped).toBe(3);
  });

  it('treats a non-array as no items rather than throwing', () => {
    expect(partitionItems(undefined)).toEqual({ valid: [], dropped: 0 });
    expect(partitionItems('items')).toEqual({ valid: [], dropped: 0 });
  });
});

describe('parsePersistedBlob', () => {
  const settings = makeSettings();

  it('reads the Zustand persist envelope', () => {
    const raw = JSON.stringify({
      state: { items: [makeItem()], settings },
      version: 1,
    });
    const result = parsePersistedBlob(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.version).toBe(1);
      expect(result.items).toHaveLength(1);
      expect(result.settings).toEqual(settings);
      expect(result.droppedItems).toBe(0);
    }
  });

  it('also reads a bare { version, items, settings } blob', () => {
    const raw = JSON.stringify({ version: 1, items: [makeItem()], settings });
    expect(parsePersistedBlob(raw).ok).toBe(true);
  });

  it('drops invalid items and counts them', () => {
    const raw = JSON.stringify({
      state: {
        items: [makeItem({ id: 'ok' }), makeItem({ id: 'bad', expiresOn: '2026-02-31' })],
        settings,
      },
      version: 1,
    });
    const result = parsePersistedBlob(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items.map((item) => item.id)).toEqual(['ok']);
      expect(result.droppedItems).toBe(1);
    }
  });

  it('clamps more than 5 reminder offsets on read without dropping the item', () => {
    const raw = JSON.stringify({
      state: {
        items: [makeItem({ id: 'many', reminderDays: [1, 2, 3, 7, 30, 90, 365] })],
        settings,
      },
      version: 1,
    });
    const result = parsePersistedBlob(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.reminderDays).toEqual([365, 90, 30, 7, 3]);
      expect(result.droppedItems).toBe(0);
    }
  });

  it('reports invalid settings as null so the caller can reset them, keeping the items', () => {
    const raw = JSON.stringify({
      state: { items: [makeItem({ id: 'kept' })], settings: { ...settings, notifyHour: 42 } },
      version: 1,
    });
    const result = parsePersistedBlob(raw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settings).toBeNull();
      expect(result.items.map((item) => item.id)).toEqual(['kept']);
    }
  });

  it('reports invalid JSON', () => {
    expect(parsePersistedBlob('{not json')).toEqual({ ok: false, reason: 'not-json' });
  });

  it('reports a non-object blob', () => {
    expect(parsePersistedBlob('"a string"')).toEqual({ ok: false, reason: 'not-object' });
    expect(parsePersistedBlob('[1,2,3]')).toEqual({ ok: false, reason: 'not-object' });
    expect(parsePersistedBlob('null')).toEqual({ ok: false, reason: 'not-object' });
    expect(parsePersistedBlob('42')).toEqual({ ok: false, reason: 'not-object' });
  });

  it('reports a missing or bad version', () => {
    expect(parsePersistedBlob(JSON.stringify({ state: { items: [], settings } }))).toEqual({
      ok: false,
      reason: 'bad-version',
    });
    expect(
      parsePersistedBlob(JSON.stringify({ state: { items: [], settings }, version: 'one' }))
    ).toEqual({ ok: false, reason: 'bad-version' });
  });
});

describe('sanitizeState', () => {
  it('sanitizes every item and the settings', () => {
    const state = {
      version: 1,
      items: [makeItem({ reminderDays: [7, 7, 30] })],
      settings: makeSettings({ notifyHour: 99 }),
    };
    const result = sanitizeState(state, makeSettings());
    expect(result.items[0]?.reminderDays).toEqual([30, 7]);
    expect(result.settings.notifyHour).toBe(9);
    expect(result.version).toBe(1);
  });
});

describe('validateBackup', () => {
  it('accepts a valid file and returns its items, partial settings and exportedAt', () => {
    const result = validateBackup(makeBackup());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(1);
      expect(result.settings).toEqual({ language: 'bn', currencyCode: 'BDT' });
      expect(result.exportedAt).toBe('2026-10-04T08:00:00.000Z');
    }
  });

  it('accepts a file with no settings and no exportedAt', () => {
    const file = { app: BACKUP_APP_ID, backupVersion: BACKUP_VERSION, items: [] };
    const result = validateBackup(JSON.stringify(file));
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.settings).toEqual({});
      expect(result.exportedAt).toBeNull();
    }
  });

  it('rejects invalid JSON', () => {
    expect(validateBackup('{oops')).toEqual({ ok: false, reason: 'not-json' });
  });

  it('rejects the wrong app value', () => {
    expect(validateBackup(makeBackup({ app: 'costly' }))).toEqual({
      ok: false,
      reason: 'wrong-app',
    });
  });

  it('rejects the wrong backup version', () => {
    expect(validateBackup(makeBackup({ backupVersion: 2 }))).toEqual({
      ok: false,
      reason: 'wrong-version',
    });
  });

  it('rejects a non-array items field', () => {
    const file = { app: BACKUP_APP_ID, backupVersion: BACKUP_VERSION, items: 'none' };
    expect(validateBackup(JSON.stringify(file))).toEqual({
      ok: false,
      reason: 'items-not-array',
    });
  });

  it('is all-or-nothing: one bad item rejects the whole file and reports its index', () => {
    const items: unknown[] = [
      makeItem({ id: 'ok_1' }),
      makeItem({ id: 'ok_2' }),
      makeItem({ id: 'bad', expiresOn: '2026-02-31' }),
      makeItem({ id: 'ok_3' }),
    ];
    expect(validateBackup(makeBackup({ items }))).toEqual({
      ok: false,
      reason: 'invalid-item',
      index: 2,
    });
  });

  it('rejects invalid settings', () => {
    expect(validateBackup(makeBackup({ settings: { language: 'fr' as never } }))).toEqual({
      ok: false,
      reason: 'invalid-settings',
    });
  });

  it('clamps more than 5 reminder offsets instead of rejecting the file', () => {
    const result = validateBackup(
      makeBackup({ items: [makeItem({ reminderDays: [1, 2, 3, 7, 30, 90, 365] })] })
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.reminderDays).toEqual([365, 90, 30, 7, 3]);
    }
  });
});
