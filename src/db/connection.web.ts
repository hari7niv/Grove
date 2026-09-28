/**
 * Mock Database connection for Web.
 * 
 * expo-sqlite doesn't work perfectly on the web in this configuration without
 * OPFS setup. For Phase 1 we use an in-memory mock on the web so the UI renders.
 */

export async function getDatabase(): Promise<any> {
  console.warn('SQLite is mocked on Web for Phase 1. Data will not persist.');
  
  // Return a mock object that implements the SQLiteDatabase interface 
  // minimally enough so our Repositories don't crash when constructed.
  return {
    execAsync: async () => {},
    getFirstAsync: async () => null,
    getAllAsync: async () => [],
    runAsync: async () => ({ changes: 0, lastInsertRowId: 0 }),
    withTransactionAsync: async (cb: any) => await cb(),
  };
}
