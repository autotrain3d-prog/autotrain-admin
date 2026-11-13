// Admin forgot password, step 3: set the new password (needs the reset token from step 2).
import { defineEventHandler } from 'h3'
import { adminDb, fail, findAdmin, hashPassword, normEmail, readJson, useAdminResetToken } from '../../utils/admin-auth.js'

export default defineEventHandler(async event => {
  const b = await readJson(event)
  const email = normEmail(b.email)
  const password = String(b.password || '')

  if (password.length < 8 || password.length > 128) throw fail(400, 'Use at least 8 characters for the password.')
  if (!await useAdminResetToken(email, b.resetToken)) throw fail(400, 'This reset link has expired. Start again.')

  const admin = await findAdmin(email)
  if (!admin) throw fail(400, 'This reset link has expired. Start again.')

  const db = await adminDb()
  await db.prepare('UPDATE adm_accounts SET password_hash = ? WHERE id = ?').run(hashPassword(password), admin.id)
  await db.prepare('DELETE FROM adm_sessions WHERE admin_id = ?').run(admin.id)     // sign out everywhere
  return { ok: true }
})
