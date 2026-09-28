import initSqlJs, { Database, SqlValue } from 'sql.js';
import * as idb from 'idb-keyval';
import type { SQLiteDatabase } from 'expo-sqlite';

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

export async function getDatabase(): Promise<SQLiteDatabase> {
  if (sqlDb) {
    return new WebSQLiteWrapper() as unknown as SQLiteDatabase;
  }
  
  const SQL = await initSqlJs({
    // We expect sql-wasm.wasm to be served from the root or node_modules
    // Usually bundlers can resolve this or we can fetch it from unpkg
    locateFile: file => `https://sql.js.org/dist/${file}`
  });
  
  const savedData = await idb.get<Uint8Array>(DB_KEY);
  if (savedData) {
    sqlDb = new SQL.Database(savedData);
  } else {
    sqlDb = new SQL.Database();
  }
  
  return new WebSQLiteWrapper() as unknown as SQLiteDatabase;
}
