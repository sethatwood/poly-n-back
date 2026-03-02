import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

export const usePersistenceStore = defineStore('persistence', () => {
  const migrated = ref(false);

  async function loadPreference<T>(key: string, defaults: T): Promise<T> {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null) return defaults;
      const parsed: unknown = JSON.parse(value);
      // Schema validation: type must match defaults type
      if (typeof parsed !== typeof defaults) return defaults;
      // For objects, verify expected keys exist
      if (
        typeof defaults === 'object' &&
        defaults !== null &&
        !Array.isArray(defaults)
      ) {
        const defaultRecord = defaults as Record<string, unknown>;
        const parsedRecord = parsed as Record<string, unknown>;
        for (const k of Object.keys(defaultRecord)) {
          if (!(k in parsedRecord)) return defaults;
        }
      }
      return parsed as T;
    } catch {
      return defaults;
    }
  }

  async function savePreference<T>(key: string, data: T): Promise<void> {
    try {
      await Preferences.set({ key, value: JSON.stringify(data) });
    } catch (e) {
      console.warn(`Storage write failed for key "${key}":`, e);
    }
  }

  async function migrateFromLocalStorage(): Promise<void> {
    const result = await Preferences.get({ key: '_migrated' });
    if (result.value) {
      migrated.value = true;
      return;
    }

    // Migrate each key from localStorage to Capacitor Preferences
    const keys: string[] = [
      'highScoreData',
      'isAudioEnabled',
      'achievements',
      'tutorialCompleted',
    ];
    for (const key of keys) {
      // NOTE: localStorage references here are INTENTIONAL -- reading old data
      // for one-time migration (per project decision from Phase 4).
      const value = localStorage.getItem(key);
      if (value !== null) {
        await Preferences.set({ key, value });
        localStorage.removeItem(key);
      }
    }
    await Preferences.set({ key: '_migrated', value: 'true' });
    migrated.value = true;
  }

  return { migrated, loadPreference, savePreference, migrateFromLocalStorage };
});
