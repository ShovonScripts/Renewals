import {
  DEFAULT_SETTINGS,
  STATE_VERSION,
  STORAGE_KEY,
  CORRUPT_KEY_PREFIX,
  applyMigrations,
  createRenewalsStore,
  newEventId,
  newItemId,
  type RenewalsStore,
} from '@/store/store';
import { makeItem, makeSettings, createMemoryStorage, type MemoryStorage } from '@/testing/factories';

const NOW = new Date(2026, 9, 4, 8, 0, 0);

function makeStore(initial: Record<string, string> = {}): {
  store: RenewalsStore;
  storage: MemoryStorage;
} {
  const storage = createMemoryStorage(initial);
  const store = createRenewalsStore({ backing: storage, now: () => NOW });
  return { store, storage };
}

async function hydrated(initial: Record<string, string> = {}) {
  const created = makeStore(initial);
  // persist hydrates automatically when the store is created. Waiting for that single pass,
  // rather than calling rehydrate() a second time, is what a real app start does — and it keeps
  // the recovery notices from being recorded twice for one read.
  if (!created.store.persist.hasHydrated()) {
    await new Promise<void>((resolve) => {
      const unsubscribe = created.store.persist.onFinishHydration(() => {
        unsubscribe();
        resolve();
      });
    });
  }
  return created;
}

describe('newItemId and newEventId', () => {
  it('follows the docs/DATA_MODEL.md id format', () => {
    expect(newItemId(NOW.getTime())).toMatch(/^itm_[0-9a-z]+_[0-9a-z]{4}$/);
    expect(newEventId(NOW.getTime())).toMatch(/^evt_[0-9a-z]+_[0-9a-z]{4}$/);
  });

  it('produces unique ids', () => {
    const ids = new Set(Array.from({ length: 500 }, () => newItemId(NOW.getTime())));
    expect(ids.size).toBe(500);
  });
});

describe('initial state and hydration', () => {
  it('starts empty with default settings and reports hydration', async () => {
    const { store } = makeStore();
    expect(store.getState().hasHydrated).toBe(false);

    await store.persist.rehydrate();

    const state = store.getState();
    expect(state.hasHydrated).toBe(true);
    expect(state.items).toEqual([]);
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
  });

  it('restores items and settings from storage', async () => {
    const item = makeItem({ id: 'itm_saved' });
    const { store } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: { items: [item], settings: makeSettings({ notifyHour: 21 }) },
        version: STATE_VERSION,
      }),
    });

    expect(store.getState().items.map((entry) => entry.id)).toEqual(['itm_saved']);
    expect(store.getState().settings.notifyHour).toBe(21);
  });

  it('does not persist hasHydrated', async () => {
    const { store, storage } = await hydrated();
    store.getState().updateSettings({ notifyHour: 10 });

    const written = JSON.parse(storage.dump[STORAGE_KEY] ?? '{}') as { state: Record<string, unknown> };
    expect(Object.keys(written.state).sort()).toEqual(['items', 'settings']);
    expect('hasHydrated' in written.state).toBe(false);
  });

  it('writes the persist envelope with the state version', async () => {
    const { store, storage } = await hydrated();
    store.getState().add({ title: 'Visa', category: 'visa', expiresOn: '2027-05-01' });

    const written = JSON.parse(storage.dump[STORAGE_KEY] ?? '{}') as { version: number };
    expect(written.version).toBe(STATE_VERSION);
    expect(STATE_VERSION).toBe(1);
  });
});

describe('add', () => {
  it('creates a sanitized item with a generated id and timestamps', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({
      title: '  Passport  ',
      category: 'passport',
      expiresOn: '2028-03-15',
      notes: '  Renew early  ',
    });

    expect(item.id).toMatch(/^itm_/);
    expect(item.title).toBe('Passport');
    expect(item.notes).toBe('Renew early');
    expect(item.status).toBe('active');
    expect(item.history).toEqual([]);
    expect(item.createdAt).toBe(NOW.toISOString());
    expect(item.updatedAt).toBe(NOW.toISOString());
    expect(store.getState().items).toHaveLength(1);
  });

  it('applies the category default reminder days', async () => {
    const { store } = await hydrated();
    const { add } = store.getState();

    expect(add({ title: 'A', category: 'passport', expiresOn: '2028-01-01' }).reminderDays).toEqual([
      90, 30, 7, 1,
    ]);
    expect(add({ title: 'B', category: 'visa', expiresOn: '2028-01-01' }).reminderDays).toEqual([
      90, 30, 7, 1,
    ]);
    expect(
      add({ title: 'C', category: 'subscription', expiresOn: '2028-01-01' }).reminderDays
    ).toEqual([7, 1]);
    expect(add({ title: 'D', category: 'warranty', expiresOn: '2028-01-01' }).reminderDays).toEqual([
      30, 7,
    ]);
  });

  it('falls back to Settings.defaultReminderDays for a category with no default', async () => {
    const { store } = await hydrated();
    store.getState().updateSettings({ defaultReminderDays: [60, 14, 2] });

    expect(store.getState().add({ title: 'E', category: 'other', expiresOn: '2028-01-01' }).reminderDays).toEqual([
      60, 14, 2,
    ]);
  });

  it('honours an explicit reminderDays override', async () => {
    const { store } = await hydrated();
    const item = store
      .getState()
      .add({ title: 'F', category: 'passport', expiresOn: '2028-01-01', reminderDays: [30, 30, 7] });

    // De-duplicated and sorted descending by the sanitizer.
    expect(item.reminderDays).toEqual([30, 7]);
  });

  it('puts the newest item first', async () => {
    const { store } = await hydrated();
    store.getState().add({ title: 'First', category: 'other', expiresOn: '2028-01-01' });
    store.getState().add({ title: 'Second', category: 'other', expiresOn: '2028-01-02' });

    expect(store.getState().items.map((item) => item.title)).toEqual(['Second', 'First']);
  });

  it('refuses an impossible expiry date instead of storing it', async () => {
    const { store } = await hydrated();
    expect(() =>
      store.getState().add({ title: 'Bad', category: 'other', expiresOn: '2026-02-31' })
    ).toThrow(TypeError);
    expect(store.getState().items).toHaveLength(0);
  });
});

describe('update', () => {
  it('patches fields, sanitizes them and bumps updatedAt', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({ title: 'Passport', category: 'passport', expiresOn: '2028-01-01' });

    store.getState().update(item.id, { title: `  ${'x'.repeat(80)}  `, notes: 'changed' });

    const updated = store.getState().items[0];
    expect(updated?.title).toHaveLength(60);
    expect(updated?.notes).toBe('changed');
    expect(updated?.id).toBe(item.id);
    expect(updated?.createdAt).toBe(item.createdAt);
    expect(updated?.updatedAt).toBe(NOW.toISOString());
  });

  it('leaves other items untouched', async () => {
    const { store } = await hydrated();
    const a = store.getState().add({ title: 'A', category: 'other', expiresOn: '2028-01-01' });
    store.getState().add({ title: 'B', category: 'other', expiresOn: '2028-01-02' });

    store.getState().update(a.id, { title: 'A2' });

    expect(store.getState().items.map((item) => item.title).sort()).toEqual(['A2', 'B']);
  });

  it('refuses an impossible expiry date', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({ title: 'A', category: 'other', expiresOn: '2028-01-01' });
    expect(() => store.getState().update(item.id, { expiresOn: '2026-02-31' })).toThrow(TypeError);
  });
});

describe('remove, archive and restore', () => {
  it('removes an item', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({ title: 'A', category: 'other', expiresOn: '2028-01-01' });
    store.getState().remove(item.id);
    expect(store.getState().items).toEqual([]);
  });

  it('ignores an unknown id', async () => {
    const { store } = await hydrated();
    store.getState().add({ title: 'A', category: 'other', expiresOn: '2028-01-01' });
    store.getState().remove('itm_does_not_exist');
    expect(store.getState().items).toHaveLength(1);
  });

  it('archives and restores, flipping the status', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({ title: 'A', category: 'other', expiresOn: '2028-01-01' });

    store.getState().archive(item.id);
    expect(store.getState().items[0]?.status).toBe('archived');

    store.getState().restore(item.id);
    expect(store.getState().items[0]?.status).toBe('active');
  });
});

describe('markRenewed', () => {
  it('moves the expiry date and records a history entry', async () => {
    const { store } = await hydrated();
    const item = store
      .getState()
      .add({ title: 'Netflix', category: 'subscription', expiresOn: '2026-10-01' });

    store.getState().markRenewed(item.id, { expiresOn: '2026-11-01', amount: 900 });

    const renewed = store.getState().items[0];
    expect(renewed?.expiresOn).toBe('2026-11-01');
    expect(renewed?.amount).toBe(900);
    expect(renewed?.history).toHaveLength(1);
    expect(renewed?.history[0]).toMatchObject({
      renewedAt: NOW.toISOString(),
      previousExpiresOn: '2026-10-01',
      newExpiresOn: '2026-11-01',
      amount: 900,
    });
    expect(renewed?.history[0]?.id).toMatch(/^evt_/);
  });

  it('keeps the existing amount when none is given', async () => {
    const { store } = await hydrated();
    const item = store
      .getState()
      .add({ title: 'A', category: 'subscription', expiresOn: '2026-10-01', amount: 500, billingCycle: 'monthly' });

    store.getState().markRenewed(item.id, { expiresOn: '2026-11-01' });

    expect(store.getState().items[0]?.amount).toBe(500);
    expect(store.getState().items[0]?.history[0]?.amount).toBeNull();
  });

  it('accumulates history across renewals', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({ title: 'A', category: 'other', expiresOn: '2026-01-01' });

    store.getState().markRenewed(item.id, { expiresOn: '2027-01-01' });
    store.getState().markRenewed(item.id, { expiresOn: '2028-01-01' });

    const history = store.getState().items[0]?.history ?? [];
    expect(history).toHaveLength(2);
    expect(history.map((event) => event.newExpiresOn)).toEqual(['2027-01-01', '2028-01-01']);
  });

  it('refuses an impossible expiry date', async () => {
    const { store } = await hydrated();
    const item = store.getState().add({ title: 'A', category: 'other', expiresOn: '2028-01-01' });
    expect(() => store.getState().markRenewed(item.id, { expiresOn: '2026-02-31' })).toThrow(TypeError);
  });
});

describe('updateSettings', () => {
  it('merges a partial patch', async () => {
    const { store } = await hydrated();
    store.getState().updateSettings({ language: 'en', notifyHour: 20 });

    expect(store.getState().settings.language).toBe('en');
    expect(store.getState().settings.notifyHour).toBe(20);
    expect(store.getState().settings.currencyCode).toBe(DEFAULT_SETTINGS.currencyCode);
  });

  it('sanitizes out-of-range values back to the defaults', async () => {
    const { store } = await hydrated();
    store.getState().updateSettings({ notifyHour: 99, notifyMinute: -5, language: 'fr' as never });

    expect(store.getState().settings.notifyHour).toBe(DEFAULT_SETTINGS.notifyHour);
    expect(store.getState().settings.notifyMinute).toBe(DEFAULT_SETTINGS.notifyMinute);
    expect(store.getState().settings.language).toBe(DEFAULT_SETTINGS.language);
  });
});

describe('corrupt state recovery', () => {
  const corruptKeysIn = (dump: Record<string, string>) =>
    Object.keys(dump).filter((key) => key.startsWith(CORRUPT_KEY_PREFIX));

  it('starts empty, copies the blob aside and flags it when the value is not JSON', async () => {
    const { store, storage } = await hydrated({ [STORAGE_KEY]: '{this is not json' });

    expect(store.getState().items).toEqual([]);
    expect(store.getState().settings).toEqual(DEFAULT_SETTINGS);
    expect(store.getState().storageWasCorrupt).toBe(true);
    expect(store.getState().droppedCount).toBe(0);
    expect(store.getState().settingsWereReset).toBe(false);

    const corruptKeys = corruptKeysIn(storage.dump);
    expect(corruptKeys).toEqual([`${CORRUPT_KEY_PREFIX}${NOW.getTime()}`]);
    expect(storage.dump[corruptKeys[0] ?? '']).toBe('{this is not json');
  });

  it('treats a wrong top-level shape as whole-blob corruption', async () => {
    for (const raw of ['[1,2,3]', '"a string"', 'null', '42']) {
      const { store, storage } = await hydrated({ [STORAGE_KEY]: raw });
      expect(store.getState().items).toEqual([]);
      expect(store.getState().storageWasCorrupt).toBe(true);
      expect(corruptKeysIn(storage.dump)).toHaveLength(1);
    }
  });

  it('treats a missing version as whole-blob corruption', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({ state: { items: [makeItem()], settings: makeSettings() } }),
    });

    expect(store.getState().items).toEqual([]);
    expect(store.getState().storageWasCorrupt).toBe(true);
    expect(corruptKeysIn(storage.dump)).toHaveLength(1);
  });

  it('keeps the items but resets invalid settings, and still copies the blob aside', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          items: [makeItem({ id: 'itm_kept' })],
          settings: makeSettings({ notifyHour: 42 }),
        },
        version: 1,
      }),
    });

    const state = store.getState();
    expect(state.items.map((item) => item.id)).toEqual(['itm_kept']);
    expect(state.settings).toEqual(DEFAULT_SETTINGS);
    expect(state.settingsWereReset).toBe(true);
    expect(state.storageWasCorrupt).toBe(false);
    expect(state.droppedCount).toBe(0);
    expect(corruptKeysIn(storage.dump)).toEqual([`${CORRUPT_KEY_PREFIX}${NOW.getTime()}`]);
  });

  it('keeps the valid items, counts the invalid ones and copies the blob aside', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          items: [
            makeItem({ id: 'itm_ok' }),
            makeItem({ id: 'itm_bad', expiresOn: '2026-02-31' }),
            'garbage',
          ],
          settings: makeSettings(),
        },
        version: 1,
      }),
    });

    const state = store.getState();
    expect(state.items.map((item) => item.id)).toEqual(['itm_ok']);
    expect(state.droppedCount).toBe(2);
    expect(state.settingsWereReset).toBe(false);
    expect(state.storageWasCorrupt).toBe(false);
    expect(state.settings).toEqual(makeSettings());
    expect(corruptKeysIn(storage.dump)).toHaveLength(1);
  });

  it('reports both repairs when items are dropped and settings are invalid', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          items: [makeItem({ id: 'itm_ok' }), makeItem({ id: 'itm_bad', title: '' })],
          settings: makeSettings({ notifyMinute: 99 }),
        },
        version: 1,
      }),
    });

    const state = store.getState();
    expect(state.droppedCount).toBe(1);
    expect(state.settingsWereReset).toBe(true);
    expect(state.storageWasCorrupt).toBe(false);
    expect(corruptKeysIn(storage.dump)).toHaveLength(1);
  });

  it('clamps more than 5 reminder offsets on read instead of dropping the item', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          items: [makeItem({ id: 'itm_many', reminderDays: [1, 2, 3, 7, 30, 90, 365] })],
          settings: makeSettings(),
        },
        version: 1,
      }),
    });

    const state = store.getState();
    expect(state.items).toHaveLength(1);
    expect(state.items[0]?.reminderDays).toEqual([365, 90, 30, 7, 3]);
    expect(state.droppedCount).toBe(0);
    // Nothing was lost, so no corrupt copy is needed.
    expect(corruptKeysIn(storage.dump)).toEqual([]);
  });

  it('writes the cleaned blob back so the bad rows do not survive', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: {
          items: [makeItem({ id: 'itm_ok' }), makeItem({ id: 'itm_bad', title: '' })],
          settings: makeSettings(),
        },
        version: 1,
      }),
    });

    // Any write re-serializes the state, dropping the invalid row for good.
    store.getState().updateSettings({ notifyHour: 8 });

    const written = JSON.parse(storage.dump[STORAGE_KEY] ?? '{}') as {
      state: { items: { id: string }[] };
    };
    expect(written.state.items.map((item) => item.id)).toEqual(['itm_ok']);
  });

  it('leaves the recovery flags alone for a clean read', async () => {
    const { store, storage } = await hydrated({
      [STORAGE_KEY]: JSON.stringify({
        state: { items: [makeItem()], settings: makeSettings() },
        version: 1,
      }),
    });

    const state = store.getState();
    expect(state.droppedCount).toBe(0);
    expect(state.settingsWereReset).toBe(false);
    expect(state.storageWasCorrupt).toBe(false);
    expect(corruptKeysIn(storage.dump)).toEqual([]);
  });

  it('survives an empty storage entry without writing a corrupt copy', async () => {
    const { store, storage } = await hydrated({});
    expect(corruptKeysIn(storage.dump)).toEqual([]);
    expect(store.getState().storageWasCorrupt).toBe(false);
  });
});

describe('migrations', () => {
  it('is a no-op at the current version with an empty step table', () => {
    const state = { items: [], settings: makeSettings() };
    expect(applyMigrations(state, STATE_VERSION, STATE_VERSION)).toBe(state);
  });

  it('applies each step from N to N+1 in order', () => {
    const table = {
      1: (state: unknown) => ({ ...(state as object), stepOne: true }),
      2: (state: unknown) => ({ ...(state as object), stepTwo: true }),
      3: (state: unknown) => ({ ...(state as object), stepThree: true }),
    };

    expect(applyMigrations({}, 1, 4, table)).toEqual({
      stepOne: true,
      stepTwo: true,
      stepThree: true,
    });
  });

  it('applies a single step when only one version behind', () => {
    const table = { 1: (state: unknown) => ({ ...(state as object), migrated: true }) };
    expect(applyMigrations({ kept: 1 }, 1, 2, table)).toEqual({ kept: 1, migrated: true });
  });

  it('skips a missing step instead of throwing', () => {
    const table = { 2: (state: unknown) => ({ ...(state as object), onlyTwo: true }) };
    expect(applyMigrations({}, 1, 3, table)).toEqual({ onlyTwo: true });
  });

  it('does nothing when the stored version is newer than the app', () => {
    const state = { items: [] };
    expect(applyMigrations(state, 5, 1)).toBe(state);
  });

  it('passes each step the output of the previous one', () => {
    const table = {
      1: (state: unknown) => (state as number) + 1,
      2: (state: unknown) => (state as number) * 10,
    };
    expect(applyMigrations(1, 1, 3, table)).toBe(20);
  });
});
