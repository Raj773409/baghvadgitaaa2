import mysql from 'mysql2/promise';
import { drizzle } from 'drizzle-orm/mysql2';
import * as schema from './schema.ts';

let pool: mysql.Pool | null = null;

/**
 * Lazily creates a shared connection pool. Returns null when DATABASE_URL is not configured,
 * so callers can fall back to the legacy JSON-file PlatformStore during the migration window
 * (see PROJECT_ETERNAL_DATABASE_ASSESSMENT.md for the cutover plan).
 */
export function getDbPool(): mysql.Pool | null {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return null;
  if (!pool) {
    pool = mysql.createPool({
      uri: url,
      connectionLimit: Number(process.env.DATABASE_POOL_SIZE) || 10,
      waitForConnections: true,
    });
  }
  return pool;
}

export function getDb() {
  const p = getDbPool();
  if (!p) {
    throw new Error('DATABASE_URL is not configured; MySQL persistence is not active.');
  }
  return drizzle(p, { schema, mode: 'default' });
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export type AppDatabase = ReturnType<typeof getDb>;
