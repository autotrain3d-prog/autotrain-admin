import { createError, defineEventHandler, getRouterParam, readBody } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'
import { cleanQuestion } from '../../../utils/quiz.js'

// change a question, or only hide / show it
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const id = Number(getRouterParam(event, 'id'))
  const db = await getDb()
  if (!(await db.prepare('SELECT id FROM quiz_questions WHERE id = ?').get(id))) throw createError({ statusCode: 404, statusMessage: 'That question was not found.' })
  const body = await readBody(event).catch(() => ({})) || {}
  if (Object.keys(body).length === 1 && body.hidden !== undefined) {
    await db.prepare('UPDATE quiz_questions SET hidden = ?, updated_at = ? WHERE id = ?').run(body.hidden ? 1 : 0, Date.now(), id)
    return { ok: true }
  }
  const q = cleanQuestion(body)
  await db.prepare('UPDATE quiz_questions SET text = ?, text_tl = ?, answer = ?, answer_tl = ?, wrong = ?, wrong_tl = ?, why = ?, why_tl = ?, updated_at = ? WHERE id = ?')
    .run(q.text, q.text_tl, q.answer, q.answer_tl, JSON.stringify(q.wrong), q.wrong_tl ? JSON.stringify(q.wrong_tl) : null, q.why || null, q.why_tl, Date.now(), id)
  return { ok: true }
})
