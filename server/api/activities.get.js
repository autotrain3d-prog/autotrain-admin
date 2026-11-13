import { defineEventHandler } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { ACTIVITIES } from '../utils/builtin-activities.js'
import { activityOverridesDb } from '../utils/activity-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const rows = await (await activityOverridesDb()).prepare('SELECT * FROM activity_overrides').all()
  const by = Object.fromEntries(rows.map(r => [r.id, r]))
  return { activities: ACTIVITIES.map(a => ({ ...a, changed: Boolean(by[a.id]), hidden: Boolean(by[a.id]?.hidden), override: by[a.id] ? { ...by[a.id], hidden: Boolean(by[a.id].hidden) } : null })) }
})
