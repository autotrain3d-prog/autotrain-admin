// Makes the first admin account (or another one). Run it on your own computer, in the admin project:
//   node --env-file=.env scripts/create-admin.mjs
// It asks for the name, the email and the password. The password is saved only as a hash.
import readline from 'node:readline'
import { adminDb, hashPassword } from '../server/utils/admin-auth.js'

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const ask = q => new Promise(r => rl.question(q, r))
function askHidden(q) {
  return new Promise(resolve => {
    process.stdout.write(q)
    const stdin = process.stdin
    let text = ''
    stdin.setRawMode?.(true); stdin.resume(); stdin.setEncoding('utf8')
    const on = ch => {
      for (const c of ch) {
        if (c === '\r' || c === '\n') { stdin.setRawMode?.(false); stdin.off('data', on); process.stdout.write('\n'); return resolve(text) }
        if (c === '\u0003') process.exit(1)
        if (c === '\u007f' || c === '\b') text = text.slice(0, -1)
        else text += c
      }
    }
    stdin.on('data', on)
  })
}

const name = (await ask('Full name: ')).trim()
const email = (await ask('Email (Gmail): ')).trim().toLowerCase()
rl.close()
const password = await askHidden('Password (at least 8 characters, you will not see it): ')

if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { console.error('The name or the email is not valid.'); process.exit(1) }
if (password.length < 8) { console.error('The password needs at least 8 characters.'); process.exit(1) }

const db = await adminDb()
const old = await db.prepare('SELECT id FROM adm_accounts WHERE email = ?').get(email)
if (old) { console.error('There is already an admin with this email.'); process.exit(1) }
await db.prepare('INSERT INTO adm_accounts (full_name, email, password_hash, created_at) VALUES (?, ?, ?, ?)').run(name, email, hashPassword(password), Date.now())
console.log(`\nAdmin account made: ${email}`)
process.exit(0)
