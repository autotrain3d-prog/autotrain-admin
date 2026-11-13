// Change one built-in piece: its texts (English and Tagalog), its 3D file, or only hide / show it.
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../../utils/auth.js'
import { BUILTIN } from '../../utils/builtin-catalog.js'
import { cleanOverride, overridesDb } from '../../utils/catalog-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const body = await readBody(event).catch(() => ({})) || {}
  const key = String(body.key || '')
  if (!BUILTIN.find(b => b.key === key)) throw createError({ statusCode: 404, statusMessage: 'That piece was not found.' })
  const db = await overridesDb()
  const old = await db.prepare('SELECT * FROM catalog_overrides WHERE key = ?').get(key)

  let m
  try {
    // only "hidden" was sent: keep the rest as it is
    m = Object.keys(body).filter(k => k !== 'key').length === 1 && body.hidden !== undefined
      ? { ...(old || {}), name: old?.name ?? null, name_tl: old?.name_tl ?? null, description: old?.description ?? null, description_tl: old?.description_tl ?? null, use_text: old?.use_text ?? null, use_tl: old?.use_tl ?? null, file_url: old?.file_url ?? null, hidden: body.hidden ? 1 : 0 }
      : cleanOverride(body)
  } catch (e) { throw createError({ statusCode: 400, statusMessage: e.statusMessage || 'Check the values.' }) }

  await db.prepare(`INSERT INTO catalog_overrides (key, name, name_tl, description, description_tl, use_text, use_tl, file_url, hidden, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET name = excluded.name, name_tl = excluded.name_tl, description = excluded.description, description_tl = excluded.description_tl,
      use_text = excluded.use_text, use_tl = excluded.use_tl, file_url = excluded.file_url, hidden = excluded.hidden, updated_at = excluded.updated_at`)
    .run(key, m.name, m.name_tl, m.description, m.description_tl, m.use_text, m.use_tl, m.file_url, m.hidden ? 1 : 0, Date.now())
  return { ok: true }
})
