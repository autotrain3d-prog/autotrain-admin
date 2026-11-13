import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { customDemosDb } from '../utils/custom-demos.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const db = await customDemosDb()
  const id = String(getQuery(event).id || '')
  if (id) {
    const r = await db.prepare('SELECT * FROM custom_demos WHERE id = ?').get(id)
    if (!r) throw createError({ statusCode: 404, statusMessage: 'Not found.' })
    return { demo: { ...r, hidden: Boolean(r.hidden) } }
  }
  const rows = await db.prepare('SELECT id, grp, level, title, hidden, updated_at, length(code) AS size FROM custom_demos ORDER BY updated_at DESC').all()
  return { demos: rows.map(r => ({ ...r, hidden: Boolean(r.hidden) })) }
})
