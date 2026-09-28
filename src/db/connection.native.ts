/**
 * Database connection factory.
 *
 * Uses expo-sqlite which supports both native (SQLite) and web (WASM/OPFS).
 * Wraps the connection in an abstraction so the rest of the app
 * doesn't depend on expo-sqlite directly.
 */

import * as SQLite from 'expo-sqlite';
import { MIGRATIONS, getLatestVersion } from './schema';

const DB_NAME = 'grove.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

/**
 * Get or create the database connection.
 * Runs migrations on first connection.
 */
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Enable WAL mode for better concurrent read performance
  await db.execAsync('PRAGMA journal_mode = WAL');
  await db.execAsync('PRAGMA foreign_keys = ON');

  // Run migrations
  await runMigrations(db);

  dbInstance = db;
  return db;
}

/**
 * Run pending migrations.
 */
async function runMigrations(db: SQLite.SQLiteDatabase): Promise<void> {
  // Create migrations tracking table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      version INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  // Get current version
  const result = await db.getFirstAsync<{ version: number }>(
    'SELECT COALESCE(MAX(version), 0) as version FROM _migrations',
  );
  const currentVersion = result?.version ?? 0;
  const targetVersion = getLatestVersion();

  if (currentVersion >= targetVersion) return;

  // Apply pending migrations
  for (const migration of MIGRATIONS) {
    if (migration.version <= currentVersion) continue;

    console.log(`[DB] Applying migration ${migration.version}: ${migration.name}`);

    for (const sql of migration.sql) {
      await db.execAsync(sql);
    }

    await db.runAsync(
      'INSERT INTO _migrations (version, name, applied_at) VALUES (?, ?, ?)',
      migration.version,
      migration.name,
      new Date().toISOString(),
    );
  }

  console.log(`[DB] Migrations complete. Version: ${targetVersion}`);
}

/**
 * Close the database connection.
 */
export async function closeDatabase(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
}

/**
 * Reset the database (for testing/debug).
 */
export async function resetDatabase(): Promise<void> {
  await closeDatabase();
  await SQLite.deleteDatabaseAsync(DB_NAME);
  dbInstance = null;
}
