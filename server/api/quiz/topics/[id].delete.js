import { createError, defineEventHandler, getQuery, getRouterParam } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'

// delete a quiz for good, with all its questions. The admin must type the name of the quiz (?confirm=the name).
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')
  const db = await getDb()
  const topic = await db.prepare('SELECT id, title FROM quiz_topics WHERE id = ?').get(id)
  if (!topic) throw createError({ statusCode: 404, statusMessage: 'That quiz was not found. The built-in quizzes cannot be deleted.' })
  if (String(getQuery(event).confirm || '').trim() !== topic.title) throw createError({ statusCode: 400, statusMessage: 'Type the exact name of the quiz to delete it.' })
  await db.prepare('DELETE FROM quiz_questions WHERE topic_id = ?').run(id)
  await db.prepare('DELETE FROM quiz_topics WHERE id = ?').run(id)
  return { ok: true }
})
