// The 3D Tools manager: the categories of the student app, and the checks of what the admin types.
import { createError } from 'h3'

// same categories as the student's 3D Tools page
export const CATEGORIES = [
  { id: '1.1', title: 'Engine Compartment' },
  { id: '1.2', title: 'Undercarriage & Chassis' },
  { id: '1.3', title: 'Wheels, Tires & Braking' },
  { id: '1.4', title: 'Electrical System' },
  { id: '1.5', title: 'Fluids & Consumables' },
  { id: '2.1', title: 'Hand Tools' },
  { id: '2.2', title: 'Diagnostic & Testing' },
  { id: '2.3', title: 'Safety Equipment' },
  { id: '3', title: 'Environment & Workshop' }
]
export const MAX_MB = 25

const bad = msg => createError({ statusCode: 400, statusMessage: msg })
const text = (v, max) => String(v ?? '').trim().slice(0, max)

// only files that were uploaded to our own Vercel Blob store are accepted
export function cleanFileUrl(v) {
  const u = text(v, 500)
  if (!u) return null
  let url
  try { url = new URL(u) } catch (e) { throw bad('That file address is not valid.') }
  if (url.protocol !== 'https:' || !url.hostname.endsWith('.public.blob.vercel-storage.com') || !/\.glb$/i.test(url.pathname)) throw bad('Upload a .glb file with the Upload button.')
  return url.toString()
}

export function cleanModel(body) {
  const out = {
    category_id: text(body.category_id, 10), name: text(body.name, 80), description: text(body.description, 200), use_text: text(body.use_text, 500),
    name_tl: text(body.name_tl, 80) || null, description_tl: text(body.description_tl, 200) || null, use_tl: text(body.use_tl, 500) || null,
    file_url: cleanFileUrl(body.file_url)
  }
  if (!CATEGORIES.some(c => c.id === out.category_id)) throw bad('Choose a category.')
  if (out.name.length < 3) throw bad('The name must have at least 3 letters.')
  if (!out.description) throw bad('Write a short description.')
  if (!out.use_text) throw bad('Write what it is used for.')
  return out
}
