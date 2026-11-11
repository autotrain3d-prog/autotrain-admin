import { createError, defineEventHandler, readBody } from 'h3'
import { getDb } from '../../utils/db.js'
import { requireAdmin } from '../../utils/auth.js'
import { cleanModel } from '../../utils/models.js'

// a new piece. It starts HIDDEN. It cannot be shown without a 3D file.
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const m = cleanModel(await readBody(event).catch(() => ({})) || {})
  if (!m.file_url) throw createError({ statusCode: 400, statusMessage: 'Upload the .glb file first.' })
  const now = Date.now()
  const res = await (await getDb()).prepare('INSERT INTO catalog_models (category_id, name, name_tl, description, description_tl, use_text, use_tl, file_url, hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)')
    .run(m.category_id, m.name, m.name_tl, m.description, m.description_tl, m.use_text, m.use_tl, m.file_url, now, now)
  return { ok: true, id: Number(res.lastInsertRowid) }
})
