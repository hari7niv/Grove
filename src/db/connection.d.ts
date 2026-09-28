import type { SQLiteDatabase } from 'expo-sqlite';

export function getDatabase(): Promise<SQLiteDatabase>;
export function closeDatabase(): Promise<void>;
export function resetDatabase(): Promise<void>;
