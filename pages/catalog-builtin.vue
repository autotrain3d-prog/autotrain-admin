<template>
  <div>
    <section class="head">
      <div><h1>Built-in 3D tools</h1><p class="muted">The tools and parts already in the student catalog. Change their names and texts, give them another 3D file, or hide them. <b>Reset</b> brings back the original.</p></div>
      <NuxtLink to="/models" class="btn">+ Add new piece</NuxtLink>
    </section>
    <p v-if="error" class="msg-err" role="alert">{{ error }}</p>
    <p v-if="note" class="msg-ok" role="status">{{ note }}</p>

    <template v-if="data">
      <div class="tools">
        <input v-model="q" class="in" type="search" placeholder="Search by name or file">
        <select v-model="cat" class="in"><option value="all">All categories ({{ data.items.length }})</option><option v-for="c in data.categories" :key="c.id" :value="c.id">{{ c.short }}</option></select>
      </div>
      <div class="list">
        <article v-for="it in shown" :key="it.key" class="row" :class="{ dim: it.hidden }">
          <div class="main"><b>{{ shownName(it) }}</b><small>{{ fileName(it) }}</small></div>
          <span v-if="it.override && it.override.file_url" class="pill on">New 3D file</span>
          <span v-if="it.changed && !it.hidden" class="pill on">Changed</span>
          <span class="pill" :class="it.hidden ? 'off' : 'on'">{{ it.hidden ? 'Hidden' : 'Shown' }}</span>
          <button class="btn ghost sm" :disabled="busy" @click="toggle(it)">{{ it.hidden ? 'Show' : 'Hide (Itago)' }}</button>
          <button class="btn ghost sm" @click="edit(it)">Edit</button>
          <button v-if="it.changed" class="btn danger sm" :disabled="busy" @click="reset(it)">Reset</button>
        </article>
        <p v-if="!shown.length" class="muted">Nothing found.</p>
      </div>
    </template>
    <p v-else-if="!error" class="muted">Loading...</p>

    <div v-if="form" class="modal" @click.self="form = null">
      <form class="card" @submit.prevent="save">
        <h2>Edit "{{ form.key }}"</h2>
        <p class="muted">Leave a box empty to keep the original text.</p>
        <label class="field"><span>Name</span><input v-model="form.name" class="in" maxlength="120" :placeholder="form.key"></label>
        <label class="field"><span>Short description</span><input v-model="form.description" class="in" maxlength="300" :placeholder="form.orig.description"></label>
        <label class="field"><span>What is it used for?</span><textarea v-model="form.use_text" class="in" maxlength="600" :placeholder="form.orig.use_text" /></label>
        <label class="field"><span>3D file (.glb)</span>
          <input type="file" accept=".glb" class="in" @change="pick">
          <small>Now: {{ form.file_url ? 'a file you uploaded' : fileName(form.orig) }}</small>
        </label>
        <button v-if="form.file_url" type="button" class="btn ghost sm" @click="form.file_url = ''">Use the original 3D file</button>
        <p v-if="upMsg" class="muted">{{ upMsg }}</p>
        <details :open="Boolean(form.name_tl || form.description_tl || form.use_tl)">
          <summary>Tagalog (optional)</summary>
          <label class="field"><span>Name</span><input v-model="form.name_tl" class="in" maxlength="120"></label>
          <label class="field"><span>Short description</span><input v-model="form.description_tl" class="in" maxlength="300"></label>
          <label class="field"><span>What is it used for?</span><textarea v-model="form.use_tl" class="in" maxlength="600" /></label>
        </details>
        <p v-if="formError" class="msg-err">{{ formError }}</p>
        <div class="acts"><button type="button" class="btn ghost" @click="form = null">Cancel</button><button class="btn" :disabled="busy || uploading">{{ busy ? 'Saving...' : 'Save' }}</button></div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { upload } from '@vercel/blob/client'

const data = ref(null), error = ref(''), note = ref(''), busy = ref(false)
const q = ref(''), cat = ref('all')
const form = ref(null), formError = ref(''), uploading = ref(false), upMsg = ref('')

const api = async (url, opts) => {
  try { return await $fetch(url, opts) }
  catch (e) {
    if (e?.statusCode === 401) { await navigateTo('/login'); return null }
    throw e
  }
}
async function load() {
  try { data.value = await api('/api/models/builtin') }
  catch (e) { error.value = e?.data?.statusMessage || 'Could not read the list.' }
}
onMounted(load)

const shownName = it => (it.override && it.override.name) || it.key
const shownDesc = it => (it.override && it.override.description) || it.description
const fileName = it => (it.file ? it.file + '.glb' + (it.variant ? '  (' + it.variant + ')' : '') : 'no 3D file')

const shown = computed(() => {
  if (!data.value) return []
  const s = q.value.trim().toLowerCase()
  return data.value.items.filter(it => (cat.value === 'all' || it.category_id === cat.value)
    && (!s || it.key.toLowerCase().includes(s) || shownName(it).toLowerCase().includes(s) || String(it.file || '').toLowerCase().includes(s)))
})

function flash(m) { note.value = m; setTimeout(() => { if (note.value === m) note.value = '' }, 3500) }

function edit(it) {
  const o = it.override || {}
  formError.value = ''; upMsg.value = ''
  form.value = { key: it.key, orig: it, name: o.name || '', name_tl: o.name_tl || '', description: o.description || '', description_tl: o.description_tl || '', use_text: o.use_text || '', use_tl: o.use_tl || '', file_url: o.file_url || '', hidden: Boolean(o.hidden) }
}

async function pick(e) {
  const f = e.target.files && e.target.files[0]
  if (!f) return
  if (!/\.glb$/i.test(f.name)) { formError.value = 'Only .glb files are allowed.'; return }
  formError.value = ''; uploading.value = true; upMsg.value = 'Uploading the file...'
  try {
    const safe = f.name.replace(/\.glb$/i, '').replace(/[^\w.-]+/g, '_').slice(0, 60) || 'model'
    const blob = await upload(`models/${safe}.glb`, f, { access: 'public', handleUploadUrl: '/api/models/upload', contentType: 'model/gltf-binary' })
    form.value.file_url = blob.url
    upMsg.value = 'The file is uploaded. Press Save to use it.'
  } catch (err) {
    formError.value = err?.message || 'The upload did not work. Check the size of the file.'
    upMsg.value = ''
  } finally { uploading.value = false }
}

async function save() {
  if (busy.value || !form.value) return
  busy.value = true; formError.value = ''
  try {
    const f = form.value
    await api('/api/models/builtin', { method: 'PATCH', body: { key: f.key, name: f.name, name_tl: f.name_tl, description: f.description, description_tl: f.description_tl, use_text: f.use_text, use_tl: f.use_tl, file_url: f.file_url, hidden: f.hidden } })
    form.value = null; flash('Saved. The student catalog shows it in about a minute.'); await load()
  } catch (e) { formError.value = e?.data?.statusMessage || 'Could not save.' }
  finally { busy.value = false }
}
async function toggle(it) {
  busy.value = true
  try { await api('/api/models/builtin', { method: 'PATCH', body: { key: it.key, hidden: !it.hidden } }); flash(it.hidden ? 'Shown again.' : 'Hidden from the students.'); await load() }
  catch (e) { error.value = e?.data?.statusMessage || 'Could not change it.' }
  finally { busy.value = false }
}
async function reset(it) {
  if (!confirm(`Bring back the original of "${it.key}"?`)) return
  busy.value = true
  try { await api('/api/models/builtin?key=' + encodeURIComponent(it.key), { method: 'DELETE' }); flash('Back to the original.'); await load() }
  catch (e) { error.value = e?.data?.statusMessage || 'Could not reset it.' }
  finally { busy.value = false }
}
</script>

<style scoped>
.head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
h2 { margin: 0 0 12px; font-size: 19px; }
.muted { margin: 6px 0 0; color: var(--muted); max-width: 640px; }
.muted b { color: #fff; }
.msg-ok { padding: 10px 14px; border: 1px solid rgba(61, 220, 132, 0.4); border-radius: 12px; background: rgba(61, 220, 132, 0.1); color: #3ddc84; }
.tools { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 16px; }
.tools .in { flex: 1; min-width: 200px; margin: 0; }
.list { display: grid; gap: 8px; margin-top: 16px; }
.row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, 0.04); flex-wrap: wrap; }
.row.dim { opacity: 0.6; }
.main { flex: 1; min-width: 220px; display: grid; gap: 3px; }
.main small { color: var(--muted); }
.modal { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.7); }
.card { width: min(560px, 100%); max-height: 92vh; overflow: auto; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: #160e10; }
.acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
details { margin: 12px 0; } summary { cursor: pointer; font-weight: 700; margin-bottom: 10px; }
</style>
