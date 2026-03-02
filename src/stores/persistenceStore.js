import { ref } from 'vue';
import { defineStore } from 'pinia';
import { Preferences } from '@capacitor/preferences';

export const usePersistenceStore = defineStore('persistence', () => {
  const migrated = ref(false);

  async function loadPreference(key, defaults) {
    try {
      const { value } = await Preferences.get({ key });
      if (value === null) return defaults;
      const parsed = JSON.parse(value);
      // Schema validation: type must match defaults type
      if (typeof parsed !== typeof defaults) return defaults;
      // For objects, verify expected keys exist
      if (
        typeof defaults === 'object' &&
        defaults !== null &&
        !Array.isArray(defaults)
      ) {
        for (const k of Object.keys(defaults)) {
          if (!(k in parsed)) return defaults;
        }
      }
      return parsed;
    } catch {
      return defaults;
    }
  }

  async function savePreference(key, data) {
    try {
      await Preferences.set({ key, value: JSON.stringify(data) });
    } catch (e) {
      console.warn(`Storage write failed for key "${key}":`, e);
    }
  }

  async function migrateFromLocalStorage() {
    const result = await Preferences.get({ key: '_migrated' });
    if (result.value) {
      migrated.value = true;
      return;
    }

    // Migrate each key from localStorage to Capacitor Preferences
    const keys = [
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
