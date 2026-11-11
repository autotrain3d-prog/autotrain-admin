import { createError, defineEventHandler, readBody } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'
import { cleanQuestion, isBuiltin } from '../../../utils/quiz.js'

// a new question. It starts HIDDEN, like a new quiz.
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const body = await readBody(event).catch(() => ({})) || {}
  const topic = String(body.topic_id || '')
  const db = await getDb()
  if (!isBuiltin(topic) && !(await db.prepare('SELECT id FROM quiz_topics WHERE id = ?').get(topic))) throw createError({ statusCode: 404, statusMessage: 'That quiz was not found.' })
  const total = Number((await db.prepare('SELECT COUNT(*) AS n FROM quiz_questions WHERE topic_id = ?').get(topic)).n)
  if (total >= 60) throw createError({ statusCode: 400, statusMessage: 'A quiz can have at most 60 added questions.' })
  const q = cleanQuestion(body), now = Date.now()
  const res = await db.prepare('INSERT INTO quiz_questions (topic_id, text, text_tl, answer, answer_tl, wrong, wrong_tl, why, why_tl, hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)')
    .run(topic, q.text, q.text_tl, q.answer, q.answer_tl, JSON.stringify(q.wrong), q.wrong_tl ? JSON.stringify(q.wrong_tl) : null, q.why || null, q.why_tl, now, now)
  return { ok: true, id: res.lastInsertRowid }
})
