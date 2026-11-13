// Admin forgot password, step 2: check the code and hand back a short-lived reset token.
import { defineEventHandler } from 'h3'
import { checkAdminCode, clientIp, fail, issueAdminResetToken, normEmail, rateLimit, readJson } from '../../../utils/admin-auth.js'

export default defineEventHandler(async event => {
  const b = await readJson(event)
  const email = normEmail(b.email)
  const code = String(b.code || '').replace(/\D/g, '')

  if (!await rateLimit(`admin-forgot-verify:${clientIp(event)}`, 12, 15 * 60 * 1000)) throw fail(429, 'Too many attempts. Try again later.')
  if (code.length !== 6) throw fail(400, 'Enter all 6 digits of the code.')
  if (!await checkAdminCode(email, 'reset', code)) throw fail(400, 'That code is wrong or has expired.')

  return { ok: true, resetToken: await issueAdminResetToken(email) }
})
