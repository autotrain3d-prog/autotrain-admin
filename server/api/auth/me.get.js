import { defineEventHandler } from 'h3'
import { currentAdmin } from '../../utils/auth.js'

// who is signed in (null when nobody is). It never throws, so the page can just ask.
export default defineEventHandler(async event => ({ admin: await currentAdmin(event) }))
