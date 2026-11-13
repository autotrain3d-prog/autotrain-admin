// Who is signed in? (null when nobody)
import { defineEventHandler } from 'h3'
import { currentAdmin, publicAdmin } from '../../utils/admin-auth.js'

export default defineEventHandler(async event => ({ user: publicAdmin(await currentAdmin(event)) || null }))
