/**
 * Database React context.
 *
 * Provides repositories to the component tree after the database
 * has been initialized and migrations have run.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { getDatabase } from './connection';
import { createRepositories, type Repositories } from './repositories';

interface DatabaseState {
  ready: boolean;
  repositories: Repositories | null;
  error: Error | null;
}

const DatabaseContext = createContext<DatabaseState>({
  ready: false,
  repositories: null,
  error: null,
});

export function useDatabase(): DatabaseState {
  return useContext(DatabaseContext);
}

export function useRepositories(): Repositories {
  const { repositories, ready } = useDatabase();
  if (!ready || !repositories) {
    throw new Error('Database not ready. Ensure DatabaseProvider is mounted.');
  }
  return repositories;
}

interface DatabaseProviderProps {
  children: React.ReactNode;
}

export function DatabaseProvider({ children }: DatabaseProviderProps) {
  const [state, setState] = useState<DatabaseState>({
    ready: false,
    repositories: null,
    error: null,
  });

  useEffect(() => {
    let cancelled = false;

    async function init() {
      try {
        const db = await getDatabase();
        if (!cancelled) {
          const repos = createRepositories(db);
          setState({ ready: true, repositories: repos, error: null });
        }
      } catch (err) {
        console.error('[DB] Initialization failed:', err);
        if (!cancelled) {
          setState({
            ready: false,
            repositories: null,
            error: err instanceof Error ? err : new Error(String(err)),
          });
        }
      }
    }

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DatabaseContext.Provider value={state}>
      {children}
    </DatabaseContext.Provider>
  );
}
