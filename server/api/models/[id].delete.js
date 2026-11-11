import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { del } from '@vercel/blob'
import { getDb } from '../../utils/db.js'
import { requireAdmin } from '../../utils/auth.js'

// delete a piece for good, and its file. The admin must type the name of the piece (?confirm=the name).
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = await getDb()
  const m = await db.prepare('SELECT id, name, file_url FROM catalog_models WHERE id = ?').get(id)
  if (!m) throw createError({ statusCode: 404, statusMessage: 'That piece was not found.' })
  if (String(getQuery(event).confirm || '').trim() !== m.name) throw createError({ statusCode: 400, statusMessage: 'Type the exact name of the piece to delete it.' })
  await db.prepare('DELETE FROM catalog_models WHERE id = ?').run(id)
  let fileDeleted = false
  if (m.file_url && process.env.BLOB_READ_WRITE_TOKEN) { try { await del(m.file_url); fileDeleted = true } catch (e) { /* the record is gone; a leftover file costs nothing to the students */ } }
  return { ok: true, fileDeleted }
})
