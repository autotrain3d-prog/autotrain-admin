// Changes the admin made to the BUILT-IN 3D tools (a new name, a new text, hidden, a new 3D file).
// The built-in list itself stays in the code; this table only keeps what was changed, so "reset" always brings back the original.
import { getDb } from './db.js'

let ready
export async function overridesDb() {
  const db = await getDb()
  ready ||= db.prepare(`CREATE TABLE IF NOT EXISTS catalog_overrides (
    key            TEXT PRIMARY KEY,
    name           TEXT,
    name_tl        TEXT,
    description    TEXT,
    description_tl TEXT,
    use_text       TEXT,
    use_tl         TEXT,
    file_url       TEXT,
    hidden         INTEGER NOT NULL DEFAULT 0,
    updated_at     INTEGER NOT NULL
  )`).run().catch(e => { ready = null; throw e })
  await ready
  return db
}

const clean = (v, max) => {
  const t = String(v ?? '').trim()
  return t ? t.slice(0, max) : null
}

/** the text fields of an override, checked and cut to a sensible length */
export function cleanOverride(b) {
  const url = clean(b.file_url, 500)
  if (url && !/^https:\/\/[\w.-]+\/.+\.glb(\?.*)?$/i.test(url)) throw Object.assign(new Error('The 3D file address is not valid.'), { statusCode: 400, statusMessage: 'The 3D file address is not valid.' })
  return {
    name: clean(b.name, 120), name_tl: clean(b.name_tl, 120),
    description: clean(b.description, 300), description_tl: clean(b.description_tl, 300),
    use_text: clean(b.use_text, 600), use_tl: clean(b.use_tl, 600),
    file_url: url, hidden: b.hidden ? 1 : 0
  }
}
