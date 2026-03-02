import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { Preferences } from '@capacitor/preferences';
import { usePersistenceStore } from '@/stores/persistenceStore';

vi.mock('@capacitor/preferences');

describe('persistenceStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: _reset is a test-only method on the Preferences mock
    (Preferences as any)._reset();
  });

  // ---- loadPreference ----

  describe('loadPreference', () => {
    it('returns defaults when key does not exist', async () => {
      const store = usePersistenceStore();
      const result = await store.loadPreference('nonexistent', { score: 0 });
      expect(result).toEqual({ score: 0 });
    });

    it('returns stored value when key exists with correct type', async () => {
      await Preferences.set({ key: 'test', value: '42' });
      const store = usePersistenceStore();
      const result = await store.loadPreference('test', 0);
      expect(result).toBe(42);
    });

    it('returns stored object when all keys present', async () => {
      await Preferences.set({
        key: 'hsd',
        value: '{"score":5,"potentialCorrectAnswers":10,"nBack":2}',
      });
      const store = usePersistenceStore();
      const result = await store.loadPreference('hsd', {
        score: 0,
        potentialCorrectAnswers: 0,
        nBack: null as number | null,
      });
      expect(result).toEqual({ score: 5, potentialCorrectAnswers: 10, nBack: 2 });
    });

    it('returns defaults when stored value has wrong type', async () => {
      await Preferences.set({ key: 'test', value: '"not-a-number"' });
      const store = usePersistenceStore();
      const result = await store.loadPreference('test', 0);
      expect(result).toBe(0);
    });

    it('returns defaults when stored object is missing required keys', async () => {
      await Preferences.set({ key: 'test', value: '{"wrong":1}' });
      const store = usePersistenceStore();
      const result = await store.loadPreference('test', { score: 0, nBack: 2 });
      expect(result).toEqual({ score: 0, nBack: 2 });
    });

    it('returns defaults when JSON is invalid', async () => {
      await Preferences.set({ key: 'test', value: '{broken' });
      const store = usePersistenceStore();
      const result = await store.loadPreference('test', 'default');
      expect(result).toBe('default');
    });

    it('returns defaults for boolean type', async () => {
      await Preferences.set({ key: 'audio', value: 'true' });
      const store = usePersistenceStore();
      const result = await store.loadPreference('audio', false);
      expect(result).toBe(true);
    });
  });

  // ---- savePreference ----

  describe('savePreference', () => {
    it('saves serialized value to Preferences', async () => {
      const store = usePersistenceStore();
      await store.savePreference('key', { a: 1 });
      const { value } = await Preferences.get({ key: 'key' });
      expect(value).toBe('{"a":1}');
    });

    it('handles save failure gracefully', async () => {
      const store = usePersistenceStore();
      const originalSet = Preferences.set;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: override set to simulate disk full error
      (Preferences as any).set = vi.fn().mockRejectedValue(new Error('disk full'));

      // Should NOT throw
      await expect(store.savePreference('key', 'data')).resolves.toBeUndefined();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- test mock: restore original set method after test
      (Preferences as any).set = originalSet;
    });
  });

  // ---- migrateFromLocalStorage ----

  describe('migrateFromLocalStorage', () => {
    it('migrates keys from localStorage to Preferences', async () => {
      const store = usePersistenceStore();
      // Setup localStorage mock to return data for highScoreData
      const getItemMock = vi.fn((key: string) => {
        if (key === 'highScoreData') return '{"score":10}';
        return null;
      });
      const removeItemMock = vi.fn();
      globalThis.localStorage = {
        getItem: getItemMock,
        setItem: vi.fn(),
        removeItem: removeItemMock,
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      } as unknown as Storage;

      await store.migrateFromLocalStorage();

      const { value } = await Preferences.get({ key: 'highScoreData' });
      expect(value).toBe('{"score":10}');
      expect(removeItemMock).toHaveBeenCalledWith('highScoreData');
      expect(store.migrated).toBe(true);
    });

    it('skips migration if already migrated', async () => {
      await Preferences.set({ key: '_migrated', value: 'true' });
      const store = usePersistenceStore();

      const getItemSpy = vi.fn(() => null);
      globalThis.localStorage = {
        getItem: getItemSpy,
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      } as unknown as Storage;

      await store.migrateFromLocalStorage();
      expect(store.migrated).toBe(true);
      // localStorage should not be queried for data keys
      expect(getItemSpy).not.toHaveBeenCalled();
    });

    it('sets _migrated flag after migration', async () => {
      const store = usePersistenceStore();
      globalThis.localStorage = {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        length: 0,
        key: vi.fn(() => null),
      } as unknown as Storage;

      await store.migrateFromLocalStorage();
      const { value } = await Preferences.get({ key: '_migrated' });
      expect(value).toBe('true');
    });
  });
});
