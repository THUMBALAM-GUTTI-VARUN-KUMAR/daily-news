import { Preferences } from '@capacitor/preferences';

export const storage = {
  get: async (key: string): Promise<string | null> => {
    try {
      const { value } = await Preferences.get({ key });
      if (value !== null && value !== undefined && value !== '') {
        return value;
      }
    } catch (e) {
      console.warn('Native preferences read error, falling back:', e);
    }
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },

  set: async (key: string, value: string): Promise<void> => {
    try {
      await Preferences.set({ key, value });
    } catch (e) {
      console.warn('Native preferences set error:', e);
    }
    try {
      localStorage.setItem(key, value);
    } catch {
      // ignore
    }
  },

  remove: async (key: string): Promise<void> => {
    try {
      await Preferences.remove({ key });
    } catch (e) {
      console.warn('Native preferences remove error:', e);
    }
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  },
};
