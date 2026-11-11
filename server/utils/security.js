// Passwords, the login session and a small rate limiter. Uses Node's built-in crypto only.
import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { getDb } from './db.js'

const PEPPER = () => {
  if (process.env.ADMIN_SECRET && process.env.ADMIN_SECRET.length >= 16) return process.env.ADMIN_SECRET
  if (process.env.NODE_ENV === 'production') throw new Error('ADMIN_SECRET is missing (or too short) in the environment settings.')
  return 'dev-only-change-me-please'
}

export const sha256 = text => createHash('sha256').update(text).digest('hex')
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('hex')
export const hashToken = token => sha256(`${token}|${PEPPER()}`)

/* ---- passwords: scrypt with a random salt ---- */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(password, salt, 64).toString('hex')
  return `scrypt$${salt}$${hash}`
}
const DUMMY = hashPassword('dummy-password-for-timing')
export function verifyPassword(password, stored) {
  const [kind, salt, hash] = String(stored || DUMMY).split('$')
  if (kind !== 'scrypt' || !salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const real = Buffer.from(hash, 'hex')
  return real.length === test.length && timingSafeEqual(real, test) && Boolean(stored)
}

/* ---- rate limit (kept in the database, so it also works on a host with many short-lived servers) ---- */
export async function rateLimit(key, max, windowMs) {
  const db = await getDb()
  const now = Date.now()
  const row = await db.prepare('SELECT count, reset_at FROM admin_limits WHERE key = ?').get(key)
  if (!row || row.reset_at < now) {
    await db.prepare('INSERT INTO admin_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at').run(key, now + windowMs)
    return true
  }
  await db.prepare('UPDATE admin_limits SET count = count + 1 WHERE key = ?').run(key)
  return row.count + 1 <= max
}
export const rateReset = async key => { await (await getDb()).prepare('DELETE FROM admin_limits WHERE key = ?').run(key) }
