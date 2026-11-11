import { defineEventHandler } from 'h3'
import { getDb } from '../../utils/db.js'
import { requireAdmin } from '../../utils/auth.js'
import { CATEGORIES } from '../../utils/models.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const rows = await (await getDb()).prepare('SELECT * FROM catalog_models ORDER BY id DESC').all()
  return { categories: CATEGORIES, models: rows.map(r => ({ ...r, hidden: Boolean(r.hidden) })) }
})
