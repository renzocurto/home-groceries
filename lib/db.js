import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(process.cwd(), 'data', 'home.db');

let db;

function getDb() {
  if (!db) {
    const { mkdirSync } = require('fs');
    mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      display_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

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
    );
  `);

  seedUsers();
}

function seedUsers() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (count.c === 0) {
    const users = [
      { username: 'renzo', display_name: 'Renzo', password: 'casa2024' },
      { username: 'novia', display_name: 'Caro', password: 'casa2024' },
    ];
    const insert = db.prepare(
      'INSERT INTO users (username, password_hash, display_name) VALUES (?, ?, ?)'
    );
    for (const u of users) {
      const hash = bcrypt.hashSync(u.password, 10);
      insert.run(u.username, hash, u.display_name);
    }
  }
}

export default getDb;
