// The list of the quizzes: the built-in ones (from the student app's code) and the ones the admin made.
import { defineEventHandler } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'
import { BUILTIN_TOPICS } from '../../../utils/builtin-topics.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const db = await getDb()
  const counts = await db.prepare('SELECT topic_id, COUNT(*) AS n, SUM(CASE WHEN hidden = 0 THEN 1 ELSE 0 END) AS shown FROM quiz_questions GROUP BY topic_id').all()
  const byTopic = Object.fromEntries(counts.map(c => [c.topic_id, { n: Number(c.n), shown: Number(c.shown || 0) }]))
  const custom = await db.prepare('SELECT id, title, title_tl, icon, group_name, level, hidden, created_at FROM quiz_topics ORDER BY created_at DESC').all()
  return {
    builtin: BUILTIN_TOPICS.map(t => ({ ...t, added: byTopic[t.id]?.n || 0, addedShown: byTopic[t.id]?.shown || 0 })),
    custom: custom.map(t => ({ id: t.id, title: t.title, title_tl: t.title_tl, icon: t.icon, group_name: t.group_name, level: t.level, hidden: Boolean(t.hidden), questions: byTopic[t.id]?.n || 0, questionsShown: byTopic[t.id]?.shown || 0 }))
  }
})
