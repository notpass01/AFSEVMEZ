import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(path.join(DB_DIR, "winwin.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    verified    INTEGER NOT NULL DEFAULT 0,
    verify_token TEXT,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS balances (
    user_id  INTEGER NOT NULL REFERENCES users(id),
    currency TEXT    NOT NULL,
    amount   REAL    NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, currency)
  );

  CREATE TABLE IF NOT EXISTS deposits (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL REFERENCES users(id),
    coin          TEXT    NOT NULL,
    network       TEXT    NOT NULL,
    to_address    TEXT    NOT NULL,
    unique_amount REAL    NOT NULL,
    status        TEXT    NOT NULL DEFAULT 'pending',
    tx_hash       TEXT,
    from_address  TEXT,
    confirmed_at  TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    expires_at    TEXT    NOT NULL
  );

  CREATE TABLE IF NOT EXISTS game_history (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id    INTEGER NOT NULL REFERENCES users(id),
    game       TEXT    NOT NULL,
    coin       TEXT    NOT NULL,
    bet        REAL    NOT NULL,
    payout     REAL    NOT NULL DEFAULT 0,
    result     INTEGER NOT NULL,
    win        INTEGER NOT NULL DEFAULT 0,
    multiplier REAL    NOT NULL DEFAULT 0,
    created_at TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

export default db;
