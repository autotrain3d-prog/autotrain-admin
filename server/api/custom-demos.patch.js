// only show / hide
import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { customDemosDb } from '../utils/custom-demos.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const b = await readBody(event).catch(() => ({})) || {}
  const r = await (await customDemosDb()).prepare('UPDATE custom_demos SET hidden = ?, updated_at = ? WHERE id = ?').run(b.hidden ? 1 : 0, Date.now(), String(b.id || ''))
  if (r && r.rowsAffected === 0) throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  return { ok: true }
})
