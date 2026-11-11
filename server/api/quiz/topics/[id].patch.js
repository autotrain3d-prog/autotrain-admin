import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'
import { cleanTopic } from '../../../utils/quiz.js'

// change a quiz, or hide / show it (hidden = the students do not see it, but nothing is lost)
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const db = await getDb()
  if (!(await db.prepare('SELECT id FROM quiz_topics WHERE id = ?').get(id))) throw createError({ statusCode: 404, statusMessage: 'That quiz was not found. The built-in quizzes cannot be changed.' })
  const body = await readBody(event).catch(() => ({})) || {}
  const t = cleanTopic(body, true)
  if (body.hidden !== undefined) t.hidden = body.hidden ? 1 : 0
  const keys = Object.keys(t)
  if (!keys.length) return { ok: true }
  await db.prepare(`UPDATE quiz_topics SET ${keys.map(k => k + ' = ?').join(', ')}, updated_at = ? WHERE id = ?`).run(...keys.map(k => t[k]), Date.now(), id)
  return { ok: true }
})
