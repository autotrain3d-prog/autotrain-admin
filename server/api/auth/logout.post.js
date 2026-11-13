import { defineEventHandler } from 'h3'
import { endAdminSession } from '../../utils/admin-auth.js'

export default defineEventHandler(async event => {
  await endAdminSession(event)
  return { ok: true }
})
