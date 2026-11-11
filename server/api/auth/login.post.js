import { createError, defineEventHandler, readBody } from 'h3'
import { getDb } from '../../utils/db.js'
import { rateLimit, rateReset, verifyPassword } from '../../utils/security.js'
import { clientIp, startSession } from '../../utils/auth.js'

export default defineEventHandler(async event => {
  const body = await readBody(event).catch(() => ({})) || {}
  const email = String(body.email || '').trim().toLowerCase()
  const password = String(body.password || '')
  if (!email || !password) throw createError({ statusCode: 400, statusMessage: 'Enter the email and the password.' })

  // at most 6 tries in 15 minutes for one address, and 20 for one computer
  const keyEmail = 'login:' + email, keyIp = 'login-ip:' + clientIp(event)
  if (!(await rateLimit(keyEmail, 6, 15 * 60 * 1000)) || !(await rateLimit(keyIp, 20, 15 * 60 * 1000))) {
    throw createError({ statusCode: 429, statusMessage: 'Too many tries. Wait 15 minutes and try again.' })
  }

  const db = await getDb()
  const admin = await db.prepare('SELECT id, name, email, password_hash FROM admins WHERE email = ?').get(email)
  // the same answer for a wrong email and a wrong password
  if (!verifyPassword(password, admin?.password_hash) || !admin) throw createError({ statusCode: 401, statusMessage: 'The email or the password is wrong.' })

  await rateReset(keyEmail)
  await db.prepare('UPDATE admins SET last_login = ? WHERE id = ?').run(Date.now(), admin.id)
  await startSession(event, admin.id)
  return { ok: true, admin: { id: admin.id, name: admin.name, email: admin.email } }
})
