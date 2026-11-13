// What the admin changed in the guided demos that are already in the student app (title, short text, hidden).
// The demos themselves stay in the code; this table keeps only the changes, so "Reset" brings back the original.
import { createError } from 'h3'
import { getDb } from './db.js'
import { DEMOS } from './builtin-demos.js'

let ready
export async function demoOverridesDb() {
  const db = await getDb()
  ready ||= db.prepare(`CREATE TABLE IF NOT EXISTS demo_overrides (
    id          TEXT PRIMARY KEY,
    title       TEXT,
    title_tl    TEXT,
    summary     TEXT,
    summary_tl  TEXT,
    hidden      INTEGER NOT NULL DEFAULT 0,
    updated_at  INTEGER NOT NULL
  )`).run().catch(e => { ready = null; throw e })
  await ready
  return db
}

const text = (v, max, label) => {
  const s = String(v ?? '').trim()
  if (s.length > max) throw createError({ statusCode: 400, statusMessage: `${label} is too long (most ${max} letters).` })
  return s || null
}

export function cleanDemo(b) {
  if (!DEMOS.find(d => d.id === String(b.id || ''))) throw createError({ statusCode: 404, statusMessage: 'That demo was not found.' })
  return { id: String(b.id), title: text(b.title, 120, 'The title'), title_tl: text(b.title_tl, 120, 'The Tagalog title'), summary: text(b.summary, 300, 'The short text'), summary_tl: text(b.summary_tl, 300, 'The Tagalog short text'), hidden: b.hidden ? 1 : 0 }
}
