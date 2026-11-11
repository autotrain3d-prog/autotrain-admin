// Database. Turso (the same one as the student app) when TURSO_DATABASE_URL is set, otherwise a local file for testing.
// The admin app only creates its OWN tables (admins, admin_sessions, admin_limits). It never changes the student tables.
import { createHash } from 'node:crypto'
import { hashPassword } from './security.js'

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS admins (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    last_login    INTEGER
  );
  CREATE TABLE IF NOT EXISTS admin_sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id   INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quiz_topics (
    id         TEXT PRIMARY KEY,
    title      TEXT NOT NULL,
    title_tl   TEXT,
    icon       TEXT NOT NULL DEFAULT 'mdi-help-circle-outline',
    group_name TEXT NOT NULL DEFAULT 'maintenance',
    level      TEXT NOT NULL DEFAULT 'Basic',
    hidden     INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS quiz_questions (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id   TEXT NOT NULL,
    text       TEXT NOT NULL,
    text_tl    TEXT,
    answer     TEXT NOT NULL,
    answer_tl  TEXT,
    wrong      TEXT NOT NULL,
    wrong_tl   TEXT,
    why        TEXT,
    why_tl     TEXT,
    hidden     INTEGER NOT NULL DEFAULT 1,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS quiz_questions_topic ON quiz_questions (topic_id);
  CREATE TABLE IF NOT EXISTS catalog_models (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id    TEXT NOT NULL,
    name           TEXT NOT NULL,
    name_tl        TEXT,
    description    TEXT,
    description_tl TEXT,
    use_text       TEXT,
    use_tl         TEXT,
    file_url       TEXT,
    hidden         INTEGER NOT NULL DEFAULT 1,
    created_at     INTEGER NOT NULL,
    updated_at     INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS admin_limits (
    key      TEXT PRIMARY KEY,
    count    INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  );
`

let ready = null

async function open() {
  const remote = process.env.TURSO_DATABASE_URL
  let createClient
  if (remote) {
    ({ createClient } = await import('@libsql/client/web'))
  } else {
    const { mkdirSync } = await import('node:fs')
    const { dirname, resolve } = await import('node:path')
    const file = resolve(process.env.DB_PATH || 'data/admin-test.sqlite')
    mkdirSync(dirname(file), { recursive: true })
    ;({ createClient } = await import('@libsql/client'))
  }
  const url = remote || 'file:' + (await import('node:path')).resolve(process.env.DB_PATH || 'data/admin-test.sqlite')
  const client = createClient(remote ? { url, authToken: process.env.TURSO_AUTH_TOKEN } : { url })
  await client.executeMultiple(SCHEMA)

  const rows = res => res.rows.map(r => Object.fromEntries(res.columns.map((c, i) => [c, r[i]])))
  const db = {
    prepare: sql => ({
      get: async (...args) => rows(await client.execute({ sql, args }))[0],
      all: async (...args) => rows(await client.execute({ sql, args })),
      run: async (...args) => {
        const res = await client.execute({ sql, args })
        return { changes: res.rowsAffected, lastInsertRowid: Number(res.lastInsertRowid ?? 0) }
      }
    })
  }

  // the first admin: made once, from ADMIN_EMAIL and ADMIN_PASSWORD, only when there is no admin yet
  const count = await db.prepare('SELECT COUNT(*) AS n FROM admins').get()
  if (!Number(count.n)) {
    const email = String(process.env.ADMIN_EMAIL || '').trim().toLowerCase()
    const password = String(process.env.ADMIN_PASSWORD || '')
    if (email && password.length >= 8) {
      await db.prepare('INSERT INTO admins (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)')
        .run(String(process.env.ADMIN_NAME || 'System Admin'), email, hashPassword(password), Date.now())
      console.log('[admin] the first admin was created: ' + email)
    } else {
      console.warn('[admin] there is no admin yet. Set ADMIN_EMAIL and ADMIN_PASSWORD (at least 8 characters) in .env and restart.')
    }
  }
  // tidy old sessions and counters (in the background)
  const now = Date.now()
  db.prepare('DELETE FROM admin_sessions WHERE expires_at < ?').run(now).catch(() => {})
  db.prepare('DELETE FROM admin_limits WHERE reset_at < ?').run(now).catch(() => {})
  return db
}

export const getDb = () => (ready ||= open().catch(e => { ready = null; throw e }))
