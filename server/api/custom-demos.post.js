import { defineEventHandler, readBody } from 'h3'
import { requireAdmin } from '../utils/auth.js'
import { cleanCustom, customDemosDb } from '../utils/custom-demos.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const m = cleanCustom(await readBody(event).catch(() => ({})) || {})
  await (await customDemosDb()).prepare(`INSERT INTO custom_demos (id, grp, level, title, code, hidden, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET grp = excluded.grp, level = excluded.level, title = excluded.title, code = excluded.code, hidden = excluded.hidden, updated_at = excluded.updated_at`)
    .run(m.id, m.grp, m.level, m.title, m.code, m.hidden, Date.now())
  return { ok: true }
})
