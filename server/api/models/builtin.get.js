// The built-in 3D tools and parts (from the student catalog), with what the admin changed.
import { defineEventHandler } from 'h3'
import { requireAdmin } from '../../utils/auth.js'
import { BUILTIN } from '../../utils/builtin-catalog.js'
import { overridesDb } from '../../utils/catalog-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const rows = await (await overridesDb()).prepare('SELECT * FROM catalog_overrides').all()
  const byKey = Object.fromEntries(rows.map(r => [r.key, r]))
  const items = BUILTIN.map(b => {
    const o = byKey[b.key]
    return { ...b, changed: Boolean(o), hidden: Boolean(o && o.hidden), override: o ? { ...o, hidden: Boolean(o.hidden) } : null }
  })
  const categories = []
  for (const b of BUILTIN) if (!categories.find(c => c.id === b.category_id)) categories.push({ id: b.category_id, title: b.category, short: b.short })
  return { categories, items }
})
