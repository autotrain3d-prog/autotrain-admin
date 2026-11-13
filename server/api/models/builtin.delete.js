// Reset one built-in piece to the original (what the admin changed is removed; a 3D file that was uploaded for it is removed too).
import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../../utils/auth.js'
import { overridesDb } from '../../utils/catalog-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const key = String(getQuery(event).key || '')
  if (!key) throw createError({ statusCode: 400, statusMessage: 'Tell which piece to reset.' })
  const db = await overridesDb()
  const old = await db.prepare('SELECT file_url FROM catalog_overrides WHERE key = ?').get(key)
  await db.prepare('DELETE FROM catalog_overrides WHERE key = ?').run(key)
  let fileDeleted = false
  if (old?.file_url && process.env.BLOB_READ_WRITE_TOKEN) {
    try { const { del } = await import('@vercel/blob'); await del(old.file_url); fileDeleted = true } catch (e) { /* the record is gone; a leftover file costs nothing */ }
  }
  return { ok: true, fileDeleted }
})
