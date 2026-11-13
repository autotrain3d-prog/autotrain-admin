import { createError, defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { cleanDemo, demoOverridesDb } from '../utils/demo-overrides.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const body = await readBody(event).catch(() => ({})) || {}
  const db = await demoOverridesDb()
  const old = await db.prepare('SELECT * FROM demo_overrides WHERE id = ?').get(String(body.id || ''))
  let m
  try {
    m = Object.keys(body).filter(k => k !== 'id').length === 1 && body.hidden !== undefined
      ? cleanDemo({ id: body.id, title: old?.title, title_tl: old?.title_tl, summary: old?.summary, summary_tl: old?.summary_tl, hidden: body.hidden })
      : cleanDemo(body)
  } catch (e) { throw createError({ statusCode: e.statusCode || 400, statusMessage: e.statusMessage || 'Check the values.' }) }
  await db.prepare(`INSERT INTO demo_overrides (id, title, title_tl, summary, summary_tl, hidden, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET title = excluded.title, title_tl = excluded.title_tl, summary = excluded.summary, summary_tl = excluded.summary_tl, hidden = excluded.hidden, updated_at = excluded.updated_at`)
    .run(m.id, m.title, m.title_tl, m.summary, m.summary_tl, m.hidden, Date.now())
  return { ok: true }
})
