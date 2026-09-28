import Database from 'better-sqlite3';
import { MIGRATIONS } from '../../src/db/schema';
import { createRepositories } from '../../src/db/repositories';

export function createTestDatabase() {
  const db = new Database(':memory:');
  
  const bindParams = (stmt: any, params: any[]) => {
    if (params.length === 0) return;
    if (Array.isArray(params[0])) {
      return stmt.bind(...params[0]);
    }
    return stmt.bind(...params);
  };

  const sqliteDatabase: any = {
    execAsync: async (source: string) => {
      db.exec(source);
    },
    getFirstAsync: async <T>(source: string, ...params: any[]) => {
      const stmt = db.prepare(source);
      const bound = bindParams(stmt, params) || stmt;
      return (bound.get() as T) || null;
    },
    getAllAsync: async <T>(source: string, ...params: any[]) => {
      const stmt = db.prepare(source);
      const bound = bindParams(stmt, params) || stmt;
      return bound.all() as T[];
    },
    runAsync: async (source: string, ...params: any[]) => {
      const stmt = db.prepare(source);
      const bound = bindParams(stmt, params) || stmt;
      const info = bound.run();
      return { changes: info.changes, lastInsertRowId: info.lastInsertRowid };
    },
    withTransactionAsync: async (cb: () => Promise<void>) => {
      db.exec('BEGIN TRANSACTION');
      try {
        await cb();
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    }
  };

  return sqliteDatabase;
}

export async function setupTestRepositories() {
  const db = createTestDatabase();
  
  // Create migrations table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      version INTEGER NOT NULL,
      name TEXT NOT NULL,
      applied_at TEXT NOT NULL
    )
  `);

  for (const migration of MIGRATIONS) {
    for (const statement of migration.sql) {
      await db.execAsync(statement);
    }
  }

  return createRepositories(db);
}
