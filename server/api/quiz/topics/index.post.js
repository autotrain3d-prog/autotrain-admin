import { defineEventHandler, readBody } from 'h3'
import { getDb } from '../../../utils/db.js'
import { requireAdmin } from '../../../utils/auth.js'
import { cleanTopic, newTopicId } from '../../../utils/quiz.js'

// a new quiz. It starts HIDDEN: the students see it only after the admin shows it.
export default defineEventHandler(async event => {
  await requireAdmin(event)
  const t = cleanTopic(await readBody(event).catch(() => ({})) || {})
  const id = newTopicId(), now = Date.now()
  await (await getDb()).prepare('INSERT INTO quiz_topics (id, title, title_tl, icon, group_name, level, hidden, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)')
    .run(id, t.title, t.title_tl ?? null, t.icon, t.group_name, t.level, now, now)
  return { ok: true, id }
})
