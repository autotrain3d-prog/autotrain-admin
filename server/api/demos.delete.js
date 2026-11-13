import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { demoOverridesDb } from '../utils/demo-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Tell which demo to reset.' })
  await (await demoOverridesDb()).prepare('DELETE FROM demo_overrides WHERE id = ?').run(id)
  return { ok: true }
})
