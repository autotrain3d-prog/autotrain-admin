// The admin session: a random token in a cookie (HttpOnly, SameSite=Strict). Only its hash is kept in the database.
import { createError, deleteCookie, getCookie, getRequestHeader, setCookie } from 'h3'
import { getDb } from './db.js'
import { hashToken, randomToken } from './security.js'

const COOKIE = 'autotrain_admin'
const HOURS = 8

export async function startSession(event, adminId) {
  const token = randomToken()
  const now = Date.now()
  await (await getDb()).prepare('INSERT INTO admin_sessions (token_hash, admin_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(hashToken(token), adminId, now, now + HOURS * 3600 * 1000)
  setCookie(event, COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: HOURS * 3600 })
}

export async function endSession(event) {
  const token = getCookie(event, COOKIE)
  if (token) await (await getDb()).prepare('DELETE FROM admin_sessions WHERE token_hash = ?').run(hashToken(token))
  deleteCookie(event, COOKIE, { path: '/' })
}

export async function currentAdmin(event) {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  const row = await (await getDb()).prepare(`
    SELECT a.id, a.name, a.email FROM admin_sessions s JOIN admins a ON a.id = s.admin_id
    WHERE s.token_hash = ? AND s.expires_at > ?`).get(hashToken(token), Date.now())
  return row || null
}

export async function requireAdmin(event) {
  const admin = await currentAdmin(event)
  if (!admin) throw createError({ statusCode: 401, statusMessage: 'Please sign in.' })
  return admin
}

export const clientIp = event => String(getRequestHeader(event, 'x-forwarded-for') || event.node.req.socket?.remoteAddress || 'unknown').split(',')[0].trim()
