/**
 * Data export and import utilities.
 * Handles serializing the entire database to JSON and restoring it.
 */

import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';

const TABLES_TO_EXPORT = [
  'category',
  'habit',
  'activity_log',
  'rest_token',
  'exercise',
  'routine',
  'exercise_session',
  'book',
  'book_quote',
  'task',
  'reminder',
  'roadmap',
  'roadmap_item',
  'focus_session',
  'feed_source',
  'article',
  'settings',
];

export interface ExportData {
  version: number;
  timestamp: string;
  data: Record<string, any[]>;
}

/**
 * Exports all data from the database into a JSON object.
 */
export async function exportDatabase(db: SQLiteDatabase): Promise<ExportData> {
  const data: Record<string, any[]> = {};

  for (const table of TABLES_TO_EXPORT) {
    const rows = await db.getAllAsync(`SELECT * FROM ${table}`);
    data[table] = rows;
  }

  return {
    version: 1, // Schema version
    timestamp: new Date().toISOString(),
    data,
  };
}

/**
 * Clears and imports data into the database from a JSON object.
 * Runs in a transaction.
 */
export async function importDatabase(db: SQLiteDatabase, exportData: ExportData): Promise<void> {
  if (!exportData || !exportData.data) {
    throw new Error('Invalid export data format.');
  }

  await db.withTransactionAsync(async () => {
    // 1. Clear existing data in reverse dependency order (to avoid FK constraints if enforced)
    // We'll just disable foreign keys temporarily for the import.
    await db.execAsync('PRAGMA foreign_keys = OFF;');

    for (const table of [...TABLES_TO_EXPORT].reverse()) {
      await db.runAsync(`DELETE FROM ${table}`);
    }

    // 2. Insert new data
    for (const table of TABLES_TO_EXPORT) {
      const rows = exportData.data[table];
      if (!rows || rows.length === 0) continue;

      // Assume all rows in a table have the same keys
      const keys = Object.keys(rows[0]);
      const placeholders = keys.map(() => '?').join(', ');
      const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

      for (const row of rows) {
        const values = keys.map((k) => row[k]);
        await db.runAsync(query, ...values);
      }
    }

    await db.execAsync('PRAGMA foreign_keys = ON;');
  });
}

/**
 * Helper to download JSON on web or save to file on native.
 */
export async function downloadJson(filename: string, jsonString: string): Promise<void> {
  if (Platform.OS === 'web') {
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } else {
    // For native, we would use expo-file-system and expo-sharing.
    // Given the local-first constraints and simplicity, we can log it or use an alert
    // for Phase 1. A full implementation would require `expo-file-system`.
    console.warn('File download requires expo-file-system on native platforms.');
    alert('Export completed. Check console logs for native JSON data.');
    console.log(jsonString);
  }
}
