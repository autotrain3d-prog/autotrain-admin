import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { activityOverridesDb } from '../utils/activity-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Tell which activity to reset.' })
  await (await activityOverridesDb()).prepare('DELETE FROM activity_overrides WHERE id = ?').run(id)
  return { ok: true }
})
