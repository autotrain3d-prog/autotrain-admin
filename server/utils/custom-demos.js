// Guided demos that the admin adds with their own code. The code is the same kind of file as the demos in utils/demos/*.js:
//   export default function myDemo(sh) { ...; return { id, icon, title, summary, items, steps, ... } }
// It is saved in the database and the student app runs it. Only a signed-in admin can save it (see requireAdmin).
import { createError } from 'h3'
import { getDb } from './db.js'
import { DEMOS } from './builtin-demos.js'

let ready
export async function customDemosDb() {
  const db = await getDb()
  ready ||= db.prepare(`CREATE TABLE IF NOT EXISTS custom_demos (
    id         TEXT PRIMARY KEY,
    grp        TEXT NOT NULL,
    level      TEXT NOT NULL,
    title      TEXT,
    code       TEXT NOT NULL,
    hidden     INTEGER NOT NULL DEFAULT 1,
    updated_at INTEGER NOT NULL
  )`).run().catch(e => { ready = null; throw e })
  await ready
  return db
}

// the same turning of "export default" into a function that the student app does
export const toFunctionBody = code => String(code).replace(/export\s+default\s+/, 'return ')

export function cleanCustom(b) {
  const id = String(b.id || '').trim()
  if (!/^[a-z][a-z0-9_]{1,31}$/.test(id)) throw createError({ statusCode: 400, statusMessage: 'The id must be 2-32 small letters, numbers or _ and start with a letter (example: radiator_flush).' })
  if (DEMOS.find(d => d.id === id)) throw createError({ statusCode: 400, statusMessage: 'That id is already used by a built-in demo. Choose another.' })
  const grp = b.grp === 'diagnostic' ? 'diagnostic' : 'maintenance'
  const level = ['Basic', 'Intermediate', 'Advanced'].includes(b.level) ? b.level : 'Basic'
  const title = String(b.title || '').trim().slice(0, 120)
  const code = String(b.code || '')
  if (!code.trim()) throw createError({ statusCode: 400, statusMessage: 'Paste the code of the demo.' })
  if (code.length > 400000) throw createError({ statusCode: 400, statusMessage: 'The code is too big (most 400 KB).' })
  if (!/export\s+default\s+function/.test(code)) throw createError({ statusCode: 400, statusMessage: 'The code must start like the other demo files: export default function myDemo(sh) { ... }' })
  if (/^\s*import\s/m.test(code)) throw createError({ statusCode: 400, statusMessage: 'Remove the import lines. computed, reactive and ref are already given to the code.' })
  try { new Function('computed', 'reactive', 'ref', toFunctionBody(code)) } // only compiled to find a typing mistake; it is NOT run here
  catch (e) { throw createError({ statusCode: 400, statusMessage: 'There is a mistake in the code: ' + e.message }) }
  return { id, grp, level, title, code, hidden: b.hidden === false ? 0 : 1 }
}
