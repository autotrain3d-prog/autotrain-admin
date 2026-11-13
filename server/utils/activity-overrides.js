// What the admin changed in the activities that are already in the student app (title, short text, hidden).
import { createError } from 'h3'
import { getDb } from './db.js'
import { ACTIVITIES } from './builtin-activities.js'

let ready
export async function activityOverridesDb() {
  const db = await getDb()
  ready ||= db.prepare(`CREATE TABLE IF NOT EXISTS activity_overrides (
    id TEXT PRIMARY KEY, title TEXT, title_tl TEXT, summary TEXT, summary_tl TEXT,
    hidden INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL
  )`).run().catch(e => { ready = null; throw e })
  await ready
  return db
}
const text = (v, max, label) => {
  const s = String(v ?? '').trim()
  if (s.length > max) throw createError({ statusCode: 400, statusMessage: `${label} is too long (most ${max} letters).` })
  return s || null
}
export function cleanActivity(b) {
  if (!ACTIVITIES.find(a => a.id === String(b.id || ''))) throw createError({ statusCode: 404, statusMessage: 'That activity was not found.' })
  return { id: String(b.id), title: text(b.title, 120, 'The title'), title_tl: text(b.title_tl, 120, 'The Tagalog title'), summary: text(b.summary, 400, 'The short text'), summary_tl: text(b.summary_tl, 400, 'The Tagalog short text'), hidden: b.hidden ? 1 : 0 }
}
