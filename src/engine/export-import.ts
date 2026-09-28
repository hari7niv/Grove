import type { SQLiteDatabase } from 'expo-sqlite';
import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
const LegacyFS = FileSystem as any;
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { z } from 'zod';

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

const ExportDataSchema = z.object({
  version: z.number(),
  timestamp: z.string(),
  data: z.record(z.string(), z.array(z.record(z.string(), z.any()))),
});

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
export async function importDatabase(db: SQLiteDatabase, rawData: any): Promise<void> {
  const exportData = ExportDataSchema.parse(rawData);

  await db.withTransactionAsync(async () => {
    // 1. Clear existing data in reverse dependency order (to avoid FK constraints if enforced)
    // We'll just disable foreign keys temporarily for the import.
    await db.execAsync('PRAGMA foreign_keys = OFF;');

    for (const table of [...TABLES_TO_EXPORT].reverse()) {
      await db.runAsync(`DELETE FROM ${table}`);
    }

    // 2. Insert new data
    for (const table of TABLES_TO_EXPORT) {
      const rows = exportData.data[table] as any[];
      if (!rows || rows.length === 0) continue;

      // Assume all rows in a table have the same keys
      const firstRow = rows[0] as Record<string, any>;
      const keys = Object.keys(firstRow);
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
    try {
      const dir = LegacyFS.documentDirectory;
      if (!dir) throw new Error('Document directory not available');
      const fileUri = `${dir}${filename}`;
      await LegacyFS.writeAsStringAsync(fileUri, jsonString, { encoding: LegacyFS.EncodingType.UTF8 });
      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(fileUri);
      } else {
        alert('File saved to documents. Sharing is not available.');
      }
    } catch (e) {
      console.error('Failed to export native file', e);
      alert('Failed to export file');
    }
  }
}

/**
 * Prompt the user to pick a JSON file and return its contents.
 */
export async function pickJsonFile(): Promise<string | null> {
  if (Platform.OS === 'web') {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';
      input.onchange = (e: any) => {
        const file = e.target?.files?.[0];
        if (!file) return resolve(null);
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsText(file);
      };
      input.click();
    });
  } else {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/json',
        copyToCacheDirectory: true,
      });
      if (result.canceled) return null;
      if (result.assets && result.assets.length > 0) {
        const fileUri = result.assets[0].uri;
        const content = await LegacyFS.readAsStringAsync(fileUri, { encoding: LegacyFS.EncodingType.UTF8 });
        return content;
      }
      return null;
    } catch (e) {
      console.error('Failed to pick document', e);
      return null;
    }
  }
}
