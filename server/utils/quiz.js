// The quiz manager: what is allowed, and the checks of what the admin types. Everything is checked here on the server, not only in the page.
import { createError } from 'h3'
import { randomBytes } from 'node:crypto'
import { BUILTIN_TOPICS } from './builtin-topics.js'

export const GROUPS = ['maintenance', 'diagnostic']
export const LEVELS = ['Basic', 'Intermediate', 'Advanced']
export const ICONS = ['mdi-help-circle-outline', 'mdi-wrench-outline', 'mdi-car-battery', 'mdi-oil', 'mdi-tire', 'mdi-car-brake-abs', 'mdi-engine-outline', 'mdi-flash', 'mdi-water', 'mdi-thermometer-water', 'mdi-gauge', 'mdi-stethoscope', 'mdi-shield-check-outline', 'mdi-cog-outline', 'mdi-car-info', 'mdi-lightbulb-on-outline']

export const isBuiltin = id => BUILTIN_TOPICS.some(t => t.id === id)
export const newTopicId = () => 'c-' + randomBytes(4).toString('hex')

const bad = msg => createError({ statusCode: 400, statusMessage: msg })
const text = (v, max) => String(v ?? '').trim().slice(0, max)

// a quiz: title, optional Tagalog title, icon, group and level
export function cleanTopic(body, partial = false) {
  const out = {}
  if (!partial || body.title !== undefined) { out.title = text(body.title, 80); if (out.title.length < 3) throw bad('The quiz name must have at least 3 letters.') }
  if (body.title_tl !== undefined) out.title_tl = text(body.title_tl, 80) || null
  if (!partial || body.icon !== undefined) { out.icon = ICONS.includes(body.icon) ? body.icon : ICONS[0] }
  if (!partial || body.group_name !== undefined) { if (!GROUPS.includes(body.group_name)) throw bad('Choose Maintenance or Diagnostic.'); out.group_name = body.group_name }
  if (!partial || body.level !== undefined) { if (!LEVELS.includes(body.level)) throw bad('Choose Basic, Intermediate or Advanced.'); out.level = body.level }
  return out
}

// a question: the question, the right answer, THREE wrong answers, an explanation. Tagalog is optional.
export function cleanQuestion(body) {
  const q = {
    text: text(body.text, 300), answer: text(body.answer, 200),
    wrong: (Array.isArray(body.wrong) ? body.wrong : []).map(x => text(x, 200)),
    why: text(body.why, 500)
  }
  if (q.text.length < 5) throw bad('Write the question (at least 5 letters).')
  if (!q.answer) throw bad('Write the right answer.')
  if (q.wrong.length !== 3 || q.wrong.some(x => !x)) throw bad('Write exactly 3 wrong answers.')
  const all = [q.answer, ...q.wrong].map(x => x.toLowerCase())
  if (new Set(all).size !== 4) throw bad('The 4 answers must all be different.')

  // Tagalog (optional): all or nothing for the answers
  q.text_tl = text(body.text_tl, 300) || null
  q.answer_tl = text(body.answer_tl, 200) || null
  q.why_tl = text(body.why_tl, 500) || null
  const wtl = (Array.isArray(body.wrong_tl) ? body.wrong_tl : []).map(x => text(x, 200))
  q.wrong_tl = wtl.some(Boolean) ? wtl : null
  if (q.wrong_tl && (q.wrong_tl.length !== 3 || q.wrong_tl.some(x => !x))) throw bad('For Tagalog, write all 3 wrong answers (or leave all of them empty).')
  return q
}

export const rowToQuestion = r => ({
  id: r.id, topicId: r.topic_id, text: r.text, text_tl: r.text_tl, answer: r.answer, answer_tl: r.answer_tl,
  wrong: JSON.parse(r.wrong), wrong_tl: r.wrong_tl ? JSON.parse(r.wrong_tl) : null, why: r.why, why_tl: r.why_tl, hidden: Boolean(r.hidden)
})
