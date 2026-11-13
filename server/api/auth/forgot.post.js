// Admin forgot password, step 1: email a 6-digit code (Gmail). The answer is always the same, so nobody can find out who is an admin.
import { defineEventHandler } from 'h3'
import { EMAIL_RE, adminCodeTooSoon, clientIp, fail, findAdmin, issueAdminCode, normEmail, rateLimit, readJson } from '../../utils/admin-auth.js'

export default defineEventHandler(async event => {
  const b = await readJson(event)
  const email = normEmail(b.email)

  if (!EMAIL_RE.test(email)) throw fail(400, 'Enter a valid email address.')
  if (!await rateLimit(`admin-forgot:${clientIp(event)}`, 6, 60 * 60 * 1000)) throw fail(429, 'Too many attempts. Try again later.')

  const admin = await findAdmin(email)
  if (admin && !await adminCodeTooSoon(email, 'reset')) {
    try { await issueAdminCode(email, 'reset') } catch (e) { console.error('[mail] could not send the admin reset code:', e.message) }
  }
  return { ok: true }
})
