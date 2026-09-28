import type { SQLiteDatabase } from 'expo-sqlite';
import * as idb from 'idb-keyval';
import initSqlJs, { Database } from 'sql.js';
import { MIGRATIONS, getLatestVersion } from './schema';

const DB_KEY = 'grove_web_db';
let sqlDb: Database | null = null;
let saveTimeout: any = null;

async function persist() {
  if (!sqlDb) return;
  const data = sqlDb.export();
  await idb.set(DB_KEY, data);
}

function scheduleSave() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    persist();
  }, 1000);
}

function bindParams(stmt: any, params: any[]) {
  if (params.length === 0) return;
  if (Array.isArray(params[0])) {
    stmt.bind(params[0]);
  } else if (typeof params[0] === 'object' && params[0] !== null) {
    stmt.bind(params[0]);
  } else {
    stmt.bind(params);
  }
}

class WebSQLiteWrapper {
  async execAsync(source: string): Promise<void> {
    if (!sqlDb) throw new Error('DB not initialized');
    sqlDb.exec(source);
    scheduleSave();
  }

  async getFirstAsync<T>(source: string, ...params: any[]): Promise<T | null> {
    if (!sqlDb) throw new Error('DB not initialized');
    const stmt = sqlDb.prepare(source);
    try {
      bindParams(stmt, params);
      if (stmt.step()) {
        return stmt.getAsObject() as unknown as T;
      }
      return null;
    } finally {
      stmt.free();
    }
  }

  async getAllAsync<T>(source: string, ...params: any[]): Promise<T[]> {
    if (!sqlDb) throw new Error('DB not initialized');
    const stmt = sqlDb.prepare(source);
    try {
      bindParams(stmt, params);
      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as unknown as T);
      }
      return results;
    } finally {
      stmt.free();
    }
  }

  async runAsync(source: string, ...params: any[]): Promise<{ changes: number; lastInsertRowId: number }> {
    if (!sqlDb) throw new Error('DB not initialized');
    const stmt = sqlDb.prepare(source);
    try {
      bindParams(stmt, params);
      stmt.step();
    } finally {
      stmt.free();
    }
    
    // sql.js doesn't natively expose changes and lastInsertRowId on the statement
    // easily without separate queries. We can query them.
    const changesStmt = sqlDb.prepare("SELECT changes() as c");
    changesStmt.step();
    const changes = (changesStmt.getAsObject() as any).c;
    changesStmt.free();

    const lastIdStmt = sqlDb.prepare("SELECT last_insert_rowid() as id");
    lastIdStmt.step();
    const lastInsertRowId = (lastIdStmt.getAsObject() as any).id;
    lastIdStmt.free();

    scheduleSave();
    return { changes, lastInsertRowId };
  }

  async withTransactionAsync(callback: () => Promise<void>): Promise<void> {
    if (!sqlDb) throw new Error('DB not initialized');
    sqlDb.exec('BEGIN TRANSACTION;');
    try {
      await callback();
      sqlDb.exec('COMMIT;');
      scheduleSave();
    } catch (e) {
      sqlDb.exec('ROLLBACK;');
      throw e;
    }
  }
}

/**
 * Run pending migrations.
 */
async function runMigrations(db: WebSQLiteWrapper): Promise<void> {
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

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (sqlDb) {
    return new WebSQLiteWrapper() as unknown as SQLiteDatabase;
  }
  
  // Use metro asset resolution for the WASM file
  const wasmUrl = require('sql.js/dist/sql-wasm.wasm');
  
  const SQL = await initSqlJs({
    locateFile: () => typeof wasmUrl === 'string' ? wasmUrl : wasmUrl.uri || wasmUrl
  });
  
  const savedData = await idb.get<Uint8Array>(DB_KEY);
  if (savedData) {
    sqlDb = new SQL.Database(savedData);
  } else {
    sqlDb = new SQL.Database();
  }
  
  // Enable foreign keys
  sqlDb.exec('PRAGMA foreign_keys = ON');
  
  // Run migrations
  const wrapper = new WebSQLiteWrapper();
  await runMigrations(wrapper);
  
  return wrapper as unknown as SQLiteDatabase;
}

/**
 * Close the database connection and save to IndexedDB.
 */
export async function closeDatabase(): Promise<void> {
  if (sqlDb) {
    await persist();
    sqlDb.close();
    sqlDb = null;
  }
}

/**
 * Reset the database (for testing/debug).
 */
export async function resetDatabase(): Promise<void> {
  await closeDatabase();
  await idb.del(DB_KEY);
  sqlDb = null;
}
