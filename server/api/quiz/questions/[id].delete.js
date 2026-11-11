import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'

// delete a question for good. The page asks "are you sure" first, and sends ?confirm=yes
export default defineEventHandler(async event => {
  await requireAdmin(event)
  if (getQuery(event).confirm !== 'yes') throw createError({ statusCode: 400, statusMessage: 'Please confirm the delete.' })
  const res = await (await getDb()).prepare('DELETE FROM quiz_questions WHERE id = ?').run(Number(getRouterParam(event, 'id')))
  if (!res.changes) throw createError({ statusCode: 404, statusMessage: 'That question was not found.' })
  return { ok: true }
})
