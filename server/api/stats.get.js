// Numbers for the admin dashboard. It only READS the student tables. A table that does not exist yet is shown as "not set up yet".
import { defineEventHandler } from 'h3'
import { getDb } from '../utils/db.js'
import { requireAdmin } from '../utils/auth.js'

export default defineEventHandler(async event => {
  await requireAdmin(event)
  const db = await getDb()
  const count = async (sql, ...args) => {
    try { return Number((await db.prepare(sql).get(...args)).n) } catch (e) { return null }
  }
  const week = Date.now() - 7 * 24 * 3600 * 1000
  return {
    students: await count('SELECT COUNT(*) AS n FROM users'),
    verified: await count('SELECT COUNT(*) AS n FROM users WHERE email_verified = 1'),
    newThisWeek: await count('SELECT COUNT(*) AS n FROM users WHERE created_at > ?', week),
    admins: await count('SELECT COUNT(*) AS n FROM admins'),
    quizQuestions: await count('SELECT COUNT(*) AS n FROM quiz_questions'),
    models: await count('SELECT COUNT(*) AS n FROM catalog_models')
  }
})
