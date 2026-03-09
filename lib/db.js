import { createClient } from '@libsql/client';
import bcrypt from 'bcryptjs';

let client = null;
let initPromise = null;

function createDbClient() {
  return createClient({
    url: process.env.TURSO_DATABASE_URL || 'file:home.db',
    authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  });
}

async function initSchema(db) {
  await db.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      quantity TEXT,
      category TEXT DEFAULT 'general',
      added_by_id INTEGER NOT NULL,
      added_by_name TEXT NOT NULL,
      bought INTEGER DEFAULT 0,
      bought_by_name TEXT,
      bought_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (added_by_id) REFERENCES users(id)
    )
  `);

  await seedUsers(db);
}

async function seedUsers(db) {
  const defaults = [
    { username: 'renzo', display_name: 'Renzo', password: 'casa2024' },
    { username: 'novia', display_name: 'Caro', password: 'casa2024' },
  ];
  for (const u of defaults) {
    const hash = bcrypt.hashSync(u.password, 10);
    await db.execute({
      sql: 'INSERT OR IGNORE INTO users (username, password_hash, display_name) VALUES (?, ?, ?)',
      args: [u.username, hash, u.display_name],
    });
  }
}

export async function getDb() {
  if (!client) {
    client = createDbClient();
  }
  if (!initPromise) {
    initPromise = initSchema(client);
  }
  await initPromise;
  return client;
}

// Convert libsql Row to plain object safe for JSON
export function row(r) {
  return r ? Object.fromEntries(Object.entries(r)) : null;
}
