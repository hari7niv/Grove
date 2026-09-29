/**
 * Settings repository implementation.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import type { AppSettings } from '../../types/models';
import { DEFAULT_SETTINGS } from '../../types/models';
import type { SettingsRepository } from './types';

export function createSettingsRepository(db: SQLiteDatabase): SettingsRepository {
  return {
    async get(key) {
      const row = await db.getFirstAsync<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        key,
      );
      return row?.value ?? null;
    },

    async set(key, value) {
      await db.runAsync(
        `INSERT INTO settings (key, value) VALUES (?, ?)
         ON CONFLICT(key) DO UPDATE SET value = ?`,
        key,
        value,
        value,
      );
    },

    async getAll() {
      const rows = await db.getAllAsync<{ key: string; value: string }>(
        'SELECT key, value FROM settings',
      );

      const map = new Map(rows.map((r) => [r.key, r.value]));

      return {
        dayStartHour: parseInt(map.get('dayStartHour') ?? String(DEFAULT_SETTINGS.dayStartHour), 10),
        restTokensPerMonth: parseInt(map.get('restTokensPerMonth') ?? String(DEFAULT_SETTINGS.restTokensPerMonth), 10),
        themePreference: (map.get('themePreference') ?? DEFAULT_SETTINGS.themePreference) as AppSettings['themePreference'],
        notificationsEnabled: (map.get('notificationsEnabled') ?? String(DEFAULT_SETTINGS.notificationsEnabled)) === 'true',
        reduceMotion: (map.get('reduceMotion') ?? String(DEFAULT_SETTINGS.reduceMotion)) === 'true',
        units: (map.get('units') ?? DEFAULT_SETTINGS.units) as AppSettings['units'],
        targetRole: (map.get('targetRole') ?? DEFAULT_SETTINGS.targetRole) as AppSettings['targetRole'],
        rssProxyUrl: map.get('rssProxyUrl') ?? DEFAULT_SETTINGS.rssProxyUrl,
      };
    },
  };
}
