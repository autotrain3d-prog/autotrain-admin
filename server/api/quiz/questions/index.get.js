import { createError, defineEventHandler, getQuery } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'
import { isBuiltin, rowToQuestion } from '../../../utils/quiz.js'

// the questions the admin added to one quiz (a built-in quiz or the admin's own quiz)
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const topic = String(getQuery(event).topic || '')
  const db = await getDb()
  let info = null
  if (isBuiltin(topic)) info = { id: topic, builtin: true }
  else {
    const t = await db.prepare('SELECT id, title, title_tl, icon, group_name, level, hidden FROM quiz_topics WHERE id = ?').get(topic)
    if (!t) throw createError({ statusCode: 404, statusMessage: 'That quiz was not found.' })
    info = { id: t.id, builtin: false, title: t.title, title_tl: t.title_tl, icon: t.icon, group_name: t.group_name, level: t.level, hidden: Boolean(t.hidden) }
  }
  const rows = await db.prepare('SELECT * FROM quiz_questions WHERE topic_id = ? ORDER BY id').all(topic)
  return { topic: info, questions: rows.map(rowToQuestion) }
})
