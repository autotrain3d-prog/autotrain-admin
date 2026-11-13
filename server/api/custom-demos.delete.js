import { createError, defineEventHandler, getQuery } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { customDemosDb } from '../utils/custom-demos.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = String(getQuery(event).id || '')
  if (!id) throw createError({ statusCode: 400, statusMessage: 'Tell which demo to delete.' })
  await (await customDemosDb()).prepare('DELETE FROM custom_demos WHERE id = ?').run(id)
  return { ok: true }
})
