// Admin accounts. They live in their OWN tables (adm_accounts, adm_sessions, adm_codes) in the same database,
// so the admin never reads or changes the students' accounts (users, sessions, codes).
// This file needs nothing else from the student app except db.js (getDb).
import { createError, deleteCookie, getCookie, getRequestIP, readBody, setCookie } from 'h3'
import { createHash, randomBytes, randomInt, scryptSync, timingSafeEqual } from 'node:crypto'
import { getDb } from './db.js'

const COOKIE = 'at_admin'                     // not the same cookie as the students' session
const DAY = 24 * 60 * 60 * 1000
const CODE_TTL = 10 * 60 * 1000
const MAX_TRIES = 5
export const RESEND_WAIT = 30 * 1000

/* ---- small helpers ---- */
export const sha256 = text => createHash('sha256').update(text).digest('hex')
export const randomToken = (bytes = 32) => randomBytes(bytes).toString('hex')
export const makeCode = () => String(randomInt(0, 1_000_000)).padStart(6, '0')
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const normEmail = v => String(v || '').trim().toLowerCase()
export const fail = (statusCode, statusMessage) => createError({ statusCode, statusMessage })
export const clientIp = event => getRequestIP(event, { xForwardedFor: true }) || 'local'
export async function readJson(event) {
  const body = await readBody(event)
  return body && typeof body === 'object' ? body : {}
}

/* passwords: scrypt with a random salt */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex')
  return `scrypt$${salt}$${scryptSync(password, salt, 64).toString('hex')}`
}
const DUMMY = hashPassword('dummy-password-for-timing')
export function verifyPassword(password, stored) {
  const [kind, salt, hash] = String(stored || DUMMY).split('$')
  if (kind !== 'scrypt' || !salt || !hash) return false
  const test = scryptSync(password, salt, 64)
  const real = Buffer.from(hash, 'hex')
  return real.length === test.length && timingSafeEqual(real, test) && Boolean(stored)
}

// the secret of the admin (different from the student APP_SECRET). It is used to hash the one-time codes.
const PEPPER = () => {
  if (process.env.ADMIN_SECRET) return process.env.ADMIN_SECRET
  if (process.env.NODE_ENV === 'production') throw new Error('ADMIN_SECRET is missing in the environment settings.')
  return 'dev-only-admin-secret'
}
const hashCode = (code, email, purpose) => sha256(`${code}|${String(email).toLowerCase()}|${purpose}|${PEPPER()}`)

/* the e-mail with the code: Gmail through nodemailer. Without GMAIL_USER the code is printed in the terminal. */
async function sendCodeEmail(to, code) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.log(`\n--- AutoTrain 3D admin (dev mail) ---\n To:   ${to}\n Code: ${code}\n-------------------------------------\n`)
    return
  }
  const nodemailer = (await import('nodemailer')).default
  const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })
  await transport.sendMail({
    from: process.env.MAIL_FROM || `AutoTrain 3D <${process.env.GMAIL_USER}>`,
    to,
    subject: `Your AutoTrain 3D admin code: ${code}`,
    text: `Hello,\n\nUse this code to reset your admin password.\n\nYour code: ${code}\n\nThis code expires in 10 minutes. Never share it with anyone.\nIf you did not request it, you can ignore this email.\n\nAutoTrain 3D`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#fff;color:#222"><div style="font-size:20px;font-weight:700">AutoTrain <span style="color:#d6283a">3D</span> Admin</div><p style="margin:20px 0 6px;font-size:15px">Use this code to reset your admin password.</p><p style="margin:0 0 6px;font-size:13px;color:#666">Your verification code</p><p style="margin:0 0 18px;font-size:32px;font-weight:700;letter-spacing:6px">${code}</p><p style="margin:0;font-size:13px;color:#666">This code expires in 10 minutes. Never share it with anyone. If you did not request it, you can ignore this email.</p></div>`
  })
}

let ready
async function createTables(db) {
  await db.prepare(`CREATE TABLE IF NOT EXISTS adm_accounts (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name     TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    INTEGER NOT NULL,
    last_login    INTEGER
  )`).run()
  await db.prepare(`CREATE TABLE IF NOT EXISTS adm_sessions (
    token_hash TEXT PRIMARY KEY,
    admin_id   INTEGER NOT NULL REFERENCES adm_accounts(id) ON DELETE CASCADE,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL,
    last_seen  INTEGER
  )`).run()
  await db.prepare(`CREATE TABLE IF NOT EXISTS adm_codes (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    email      TEXT NOT NULL COLLATE NOCASE,
    purpose    TEXT NOT NULL,
    code_hash  TEXT NOT NULL,
    attempts   INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    expires_at INTEGER NOT NULL
  )`).run()
  await db.prepare('CREATE INDEX IF NOT EXISTS adm_codes_lookup ON adm_codes (email, purpose)').run()
  await db.prepare('CREATE TABLE IF NOT EXISTS adm_rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL)').run()
}

/** the database, with the admin tables ready */
export async function adminDb() {
  const db = await getDb()
  ready ||= createTables(db).catch(e => { ready = null; throw e })
  await ready
  return db
}

export const publicAdmin = a => a && { isAdmin: true, id: a.id, fullName: a.full_name, email: a.email, role: 'admin' }

export async function findAdmin(email) {
  return (await adminDb()).prepare('SELECT * FROM adm_accounts WHERE email = ?').get(normEmail(email))
}

/* ---- rate limit (kept in the database) ---- */
export async function rateLimit(key, max, windowMs) {
  const db = await adminDb()
  const now = Date.now()
  const row = await db.prepare('SELECT count, reset_at FROM adm_rate_limits WHERE key = ?').get(key)
  if (!row || row.reset_at < now) {
    await db.prepare('INSERT INTO adm_rate_limits (key, count, reset_at) VALUES (?, 1, ?) ON CONFLICT(key) DO UPDATE SET count = 1, reset_at = excluded.reset_at').run(key, now + windowMs)
    return true
  }
  await db.prepare('UPDATE adm_rate_limits SET count = count + 1 WHERE key = ?').run(key)
  return row.count + 1 <= max
}
export const rateReset = async key => { await (await adminDb()).prepare('DELETE FROM adm_rate_limits WHERE key = ?').run(key) }

/* ---- sessions ---- */
export async function startAdminSession(event, adminId, remember = false) {
  const db = await adminDb()
  const token = randomToken(32)
  const days = remember ? 30 : 1
  await db.prepare('INSERT INTO adm_sessions (token_hash, admin_id, created_at, expires_at, last_seen) VALUES (?, ?, ?, ?, ?)').run(sha256(token), adminId, Date.now(), Date.now() + days * DAY, Date.now())
  await db.prepare('UPDATE adm_accounts SET last_login = ? WHERE id = ?').run(Date.now(), adminId)
  setCookie(event, COOKIE, token, { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: days * 24 * 60 * 60 })
}

export async function currentAdmin(event) {
  const token = getCookie(event, COOKIE)
  if (!token) return null
  const db = await adminDb()
  return (await db.prepare('SELECT a.* FROM adm_sessions s JOIN adm_accounts a ON a.id = s.admin_id WHERE s.token_hash = ? AND s.expires_at > ?').get(sha256(token), Date.now())) || null
}

export async function requireAdmin(event) {
  const admin = await currentAdmin(event)
  if (!admin) throw createError({ statusCode: 401, statusMessage: 'Please sign in.' })
  return admin
}

export async function endAdminSession(event) {
  const token = getCookie(event, COOKIE)
  if (token) await (await adminDb()).prepare('DELETE FROM adm_sessions WHERE token_hash = ?').run(sha256(token))
  deleteCookie(event, COOKIE, { path: '/' })
}

/* ---- one-time codes (hashed, 10 minutes, 5 tries) ---- */
export async function adminCodeTooSoon(email, purpose) {
  const row = await (await adminDb()).prepare('SELECT created_at FROM adm_codes WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1').get(email, purpose)
  return Boolean(row && Date.now() - row.created_at < RESEND_WAIT)
}

export async function issueAdminCode(email, purpose) {
  const db = await adminDb()
  const code = makeCode()
  await db.prepare('DELETE FROM adm_codes WHERE email = ? AND purpose = ?').run(email, purpose)
  await db.prepare('INSERT INTO adm_codes (email, purpose, code_hash, created_at, expires_at) VALUES (?, ?, ?, ?, ?)').run(email, purpose, hashCode(code, email, purpose), Date.now(), Date.now() + CODE_TTL)
  await sendCodeEmail(email, code)
}

export async function checkAdminCode(email, purpose, code) {
  const db = await adminDb()
  const row = await db.prepare('SELECT * FROM adm_codes WHERE email = ? AND purpose = ? ORDER BY id DESC LIMIT 1').get(email, purpose)
  if (!row || row.expires_at < Date.now() || row.attempts >= MAX_TRIES) return false
  if (row.code_hash !== hashCode(String(code || '').trim(), email, purpose)) {
    await db.prepare('UPDATE adm_codes SET attempts = attempts + 1 WHERE id = ?').run(row.id)
    return false
  }
  await db.prepare('DELETE FROM adm_codes WHERE id = ?').run(row.id)
  return true
}

export async function issueAdminResetToken(email) {
  const db = await adminDb()
  const token = randomToken(24)
  await db.prepare("DELETE FROM adm_codes WHERE email = ? AND purpose = 'reset-ok'").run(email)
  await db.prepare("INSERT INTO adm_codes (email, purpose, code_hash, created_at, expires_at) VALUES (?, 'reset-ok', ?, ?, ?)").run(email, sha256(token), Date.now(), Date.now() + 15 * 60 * 1000)
  return token
}

export async function useAdminResetToken(email, token) {
  const db = await adminDb()
  const row = await db.prepare("SELECT * FROM adm_codes WHERE email = ? AND purpose = 'reset-ok' ORDER BY id DESC LIMIT 1").get(email)
  if (!row || row.expires_at < Date.now() || row.code_hash !== sha256(String(token || ''))) return false
  await db.prepare('DELETE FROM adm_codes WHERE id = ?').run(row.id)
  return true
}
