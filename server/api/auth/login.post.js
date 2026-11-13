// Admin sign in: the account comes from the admins table (not from the students).
import { defineEventHandler } from 'h3'
import { clientIp, fail, findAdmin, normEmail, publicAdmin, rateLimit, rateReset, readJson, startAdminSession, verifyPassword } from '../../utils/admin-auth.js'

export default defineEventHandler(async event => {
  const b = await readJson(event)
  const email = normEmail(b.email)
  const password = String(b.password || '')
  const key = `admin-login:${clientIp(event)}:${email}`

  if (!email || !password) throw fail(400, 'Enter your email and password.')
  if (!await rateLimit(key, 6, 10 * 60 * 1000)) throw fail(429, 'Too many wrong tries. Wait a few minutes and try again.')

  const admin = await findAdmin(email)
  const ok = verifyPassword(password, admin?.password_hash)     // the time is the same even if the account does not exist
  if (!admin || !ok) throw fail(401, 'Incorrect email or password.')

  await rateReset(key)
  await startAdminSession(event, admin.id, Boolean(b.remember))
  return { ok: true, user: publicAdmin(admin) }
})
