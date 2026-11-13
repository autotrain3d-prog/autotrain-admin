import { defineEventHandler } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { DEMOS } from '../utils/builtin-demos.js'
import { demoOverridesDb } from '../utils/demo-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const rows = await (await demoOverridesDb()).prepare('SELECT * FROM demo_overrides').all()
  const by = Object.fromEntries(rows.map(r => [r.id, r]))
  return { demos: DEMOS.map(d => ({ ...d, changed: Boolean(by[d.id]), hidden: Boolean(by[d.id]?.hidden), override: by[d.id] ? { ...by[d.id], hidden: Boolean(by[d.id].hidden) } : null })) }
})
