export interface PersistentStoreOptions {
  dbPath?: string;
  tableName?: string;
}

/**
 * SQLite Persistent Store for @typepurify/cache.
 * Provides a robust disk-based caching backend for massive datasets.
 */
export class SqlitePersistentStore {
  private db: any;
  private tableName: string;

  constructor(options: PersistentStoreOptions = {}) {
    this.tableName = options.tableName ?? 'typepurify_cache';
    const dbPath = options.dbPath ?? ':memory:';
    // Dynamically require sqlite3 at runtime to bypass static bundler checks
    const req = typeof module !== 'undefined' && module.require ? module.require : require;
    this.db = new (req('sqlite3').Database)(dbPath);
    this.init();
  }

  private init(): void {
    this.db.run(
      `CREATE TABLE IF NOT EXISTS ${this.tableName} (
        key TEXT PRIMARY KEY,
        value TEXT,
        expiresAt INTEGER
      )`
    );
  }

  async set(key: string, value: any, ttlMs?: number): Promise<void> {
    const expiresAt = ttlMs ? Date.now() + ttlMs : null;
    const strValue = JSON.stringify(value);
    
    return new Promise((resolve, reject) => {
      this.db.run(
        `INSERT OR REPLACE INTO ${this.tableName} (key, value, expiresAt) VALUES (?, ?, ?)`,
        [key, strValue, expiresAt],
        (err: any) => (err ? reject(err) : resolve())
      );
    });
  }

  async get<T = any>(key: string): Promise<T | null> {
    return new Promise((resolve, reject) => {
      this.db.get(
        `SELECT value, expiresAt FROM ${this.tableName} WHERE key = ?`,
        [key],
        (err: any, row: any) => {
          if (err) return reject(err);
          if (!row) return resolve(null);
          if (row.expiresAt && Date.now() > row.expiresAt) {
            this.delete(key);
            return resolve(null);
          }
          try {
            resolve(JSON.parse(row.value));
          } catch {
            resolve(null);
          }
        }
      );
    });
  }

  async delete(key: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(`DELETE FROM ${this.tableName} WHERE key = ?`, [key], (err: any) =>
        err ? reject(err) : resolve()
      );
    });
  }
}
