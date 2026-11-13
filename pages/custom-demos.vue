<template>
  <div>
    <section class="head">
      <div><h1>Added demos</h1><p class="muted">Add a guided demo with its own code. Paste the code (or choose the .js file). It is saved in the database and runs in the student app, without a new deploy. New demos start <b>Hidden</b>. To test one first, open your student site at <b>/demo?start=THE-ID</b> (it opens even when hidden), then press Show.</p></div>
      <div class="hb"><NuxtLink to="/demos" class="btn ghost">Back to Guided demos</NuxtLink><button class="btn" @click="openForm()">+ Add demo</button></div>
    </section>
    <p v-if="error" class="msg-err" role="alert">{{ error }}</p>
    <p v-if="note" class="msg-ok" role="status">{{ note }}</p>
    <p v-if="data && !data.demos.length" class="muted">You have not added a demo yet.</p>

    <div class="list">
      <article v-for="d in data?.demos" :key="d.id" class="row" :class="{ dim: d.hidden }">
        <div class="main"><b>{{ d.title || d.id }}</b><small>{{ d.id }} · {{ d.grp === 'diagnostic' ? 'Diagnostic' : 'Maintenance' }} · {{ d.level }} · {{ Math.round(d.size / 1024) }} KB</small></div>
        <span class="pill" :class="d.hidden ? 'off' : 'on'">{{ d.hidden ? 'Hidden' : 'Shown' }}</span>
        <button class="btn ghost sm" :disabled="busy" @click="toggle(d)">{{ d.hidden ? 'Show' : 'Hide (Itago)' }}</button>
        <button class="btn ghost sm" @click="openForm(d)">Edit</button>
        <button class="btn danger sm" @click="askDelete(d)">Delete</button>
      </article>
    </div>

    <div v-if="form" class="modal" @click.self="!busy && (form = null)">
      <form class="card" @submit.prevent="save">
        <h2>{{ form.isNew ? 'New demo' : 'Edit demo' }}</h2>
        <label class="field"><span>Id (small letters, numbers, _)</span><input v-model="form.id" class="in" maxlength="32" required :disabled="!form.isNew" placeholder="radiator_flush"></label>
        <label class="field"><span>Name (only for this list)</span><input v-model="form.title" class="in" maxlength="120" placeholder="Radiator Flush"></label>
        <div class="two">
          <label class="field"><span>Group</span><select v-model="form.grp" class="in"><option value="maintenance">Maintenance</option><option value="diagnostic">Diagnostic</option></select></label>
          <label class="field"><span>Level</span><select v-model="form.level" class="in"><option>Basic</option><option>Intermediate</option><option>Advanced</option></select></label>
        </div>
        <label class="field"><span>Code</span>
          <input type="file" accept=".js,.mjs,.txt" class="in" @change="readFile">
          <textarea v-model="form.code" class="in code" rows="12" spellcheck="false" placeholder="export default function myDemo(sh) { ... }" required />
          <small>Same kind of file as the demos in utils/demos. It must start with <code>export default function name(sh) {</code> and return the demo. No import lines (computed, reactive and ref are already there).</small>
        </label>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button type="button" class="btn ghost" :disabled="busy" @click="form = null">Cancel</button><button class="btn" :disabled="busy">{{ busy ? 'Saving...' : 'Save' }}</button></div>
      </form>
    </div>

    <div v-if="del" class="modal" @click.self="del = null">
      <form class="card" @submit.prevent="remove">
        <h2>Delete this demo for good?</h2>
        <p class="muted">"{{ del.title || del.id }}" and its code will be deleted. If you only want the students not to see it, use Hide.</p>
        <label class="field"><span>Type the id to confirm</span><input v-model="delText" class="in" autocomplete="off"></label>
        <div class="acts"><button type="button" class="btn ghost" @click="del = null">Cancel</button><button class="btn danger" :disabled="busy || delText.trim() !== del.id">Delete for good</button></div>
      </form>
    </div>
  </div>
</template>

<script setup>
const data = ref(null), error = ref(''), note = ref(''), busy = ref(false), form = ref(null), formErr = ref(''), del = ref(null), delText = ref('')
const msg = e => e?.data?.statusMessage || e?.message || 'Something went wrong.'
const api = async (url, opts) => {
  try { return await $fetch(url, opts) } catch (e) { if (e?.statusCode === 401) { await navigateTo('/login'); return null } throw e }
}
async function load() { try { data.value = await api('/api/custom-demos') } catch (e) { error.value = msg(e) } }
onMounted(load)
function flash(m) { note.value = m; setTimeout(() => { if (note.value === m) note.value = '' }, 3500) }
async function openForm(d) {
  formErr.value = ''
  if (!d) { form.value = { isNew: true, id: '', title: '', grp: 'maintenance', level: 'Basic', code: '', hidden: true }; return }
  try { const r = await api('/api/custom-demos?id=' + encodeURIComponent(d.id)); form.value = { isNew: false, ...r.demo, grp: r.demo.grp } } catch (e) { error.value = msg(e) }
}
function readFile(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  if (f.size > 400 * 1024) { formErr.value = 'The file is too big (most 400 KB).'; return }
  const r = new FileReader()
  r.onload = () => { form.value.code = String(r.result || ''); formErr.value = '' }
  r.readAsText(f)
}
async function save() {
  if (busy.value) return
  busy.value = true; formErr.value = ''
  try {
    const f = form.value
    await api('/api/custom-demos', { method: 'POST', body: { id: f.id, title: f.title, grp: f.grp, level: f.level, code: f.code, hidden: f.hidden } })
    form.value = null; flash('Saved.'); await load()
  } catch (e) { formErr.value = msg(e) }
  finally { busy.value = false }
}
async function toggle(d) {
  busy.value = true
  try { await api('/api/custom-demos', { method: 'PATCH', body: { id: d.id, hidden: !d.hidden } }); flash(d.hidden ? 'Hidden from the students.' : 'Shown to the students (about a minute).'); await load() }
  catch (e) { error.value = msg(e) }
  finally { busy.value = false }
}
function askDelete(d) { delText.value = ''; del.value = d }
async function remove() {
  busy.value = true
  try { await api('/api/custom-demos?id=' + encodeURIComponent(del.value.id), { method: 'DELETE' }); del.value = null; flash('Deleted.'); await load() }
  catch (e) { error.value = msg(e) }
  finally { busy.value = false }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
h2 { margin: 0 0 12px; font-size: 19px; }
.muted { margin: 6px 0 0; color: var(--muted); max-width: 680px; }
.muted b { color: #fff; }
.msg-ok { padding: 10px 14px; border: 1px solid rgba(61, 220, 132, 0.4); border-radius: 12px; background: rgba(61, 220, 132, 0.1); color: #3ddc84; }
.hb { display: flex; gap: 10px; flex-wrap: wrap; }
.list { display: grid; gap: 8px; margin-top: 16px; }
.row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, 0.04); flex-wrap: wrap; }
.row.dim { opacity: 0.7; }
.main { flex: 1; min-width: 220px; display: grid; gap: 3px; }
.main small { color: var(--muted); }
.modal { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.7); }
.card { width: min(720px, 100%); max-height: 92vh; overflow: auto; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: #160e10; }
.acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.two { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.code { font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; white-space: pre; margin-top: 8px; }
</style>
