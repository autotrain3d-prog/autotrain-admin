import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { del } from '@vercel/blob'
import { getDb } from '../../utils/db.js'
import { requireAdmin } from '../../utils/auth.js'
import { cleanModel } from '../../utils/models.js'

// edit a piece, or only hide / show it
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = await getDb()
  const old = await db.prepare('SELECT id, file_url FROM catalog_models WHERE id = ?').get(id)
  if (!old) throw createError({ statusCode: 404, statusMessage: 'That piece was not found.' })
  const body = await readBody(event).catch(() => ({})) || {}
  if (Object.keys(body).length === 1 && body.hidden !== undefined) {
    await db.prepare('UPDATE catalog_models SET hidden = ?, updated_at = ? WHERE id = ?').run(body.hidden ? 1 : 0, Date.now(), id)
    return { ok: true }
  }
  const m = cleanModel({ ...body, file_url: body.file_url || old.file_url })
  await db.prepare('UPDATE catalog_models SET category_id = ?, name = ?, name_tl = ?, description = ?, description_tl = ?, use_text = ?, use_tl = ?, file_url = ?, updated_at = ? WHERE id = ?')
    .run(m.category_id, m.name, m.name_tl, m.description, m.description_tl, m.use_text, m.use_tl, m.file_url, Date.now(), id)
  // a replaced file is removed from the store (best effort)
  if (old.file_url && old.file_url !== m.file_url && process.env.BLOB_READ_WRITE_TOKEN) { try { await del(old.file_url) } catch (e) { /* ignore */ } }
  return { ok: true }
})
