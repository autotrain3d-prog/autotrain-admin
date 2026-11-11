<template>
  <div>
    <section class="head">
      <div><h1>3D Tools</h1><p class="muted">Add a part or tool with its 3D file (.glb). It shows in the student's 3D Tools page, in the category you choose. New pieces start hidden.</p></div>
      <button class="btn" @click="openForm()">+ Add piece</button>
    </section>
    <p v-if="error" class="msg-err" role="alert">{{ error }}</p>
    <p v-if="data && !data.models.length" class="muted">You have not added a piece yet.</p>

    <div class="list">
      <article v-for="m in data?.models" :key="m.id" class="row">
        <div class="main"><b>{{ m.name }}</b><small>{{ catName(m.category_id) }} · {{ fileName(m.file_url) }}</small></div>
        <span class="pill" :class="m.hidden ? 'off' : 'on'">{{ m.hidden ? 'Hidden' : 'Shown' }}</span>
        <button class="btn ghost sm" @click="toggle(m)">{{ m.hidden ? 'Show' : 'Hide (Itago)' }}</button>
        <button class="btn ghost sm" @click="openForm(m)">Edit</button>
        <button class="btn danger sm" @click="askDelete(m)">Delete</button>
      </article>
    </div>

    <div v-if="form" class="modal" @click.self="!busy && (form = null)">
      <form class="card" @submit.prevent="save">
        <h2>{{ form.id ? 'Edit piece' : 'New piece' }}</h2>
        <label class="field"><span>Name</span><input v-model="form.name" class="in" maxlength="80" required></label>
        <label class="field"><span>Category</span>
          <select v-model="form.category_id" class="in" required><option value="" disabled>Choose...</option><option v-for="c in data.categories" :key="c.id" :value="c.id">{{ c.id }} · {{ c.title }}</option></select>
        </label>
        <label class="field"><span>Short description</span><input v-model="form.description" class="in" maxlength="200" required></label>
        <label class="field"><span>What is it used for?</span><textarea v-model="form.use_text" class="in" maxlength="500" required /></label>
        <label class="field"><span>3D file (.glb, up to {{ maxMb }} MB)</span>
          <input ref="fileEl" type="file" accept=".glb" class="in" @change="pickFile">
          <small v-if="form.file_url && !file">Current file: {{ fileName(form.file_url) }} (choose another only if you want to replace it)</small>
        </label>
        <div v-if="busy && progress" class="bar"><i :style="{ width: progress + '%' }"></i></div>
        <details :open="Boolean(form.name_tl || form.description_tl || form.use_tl)">
          <summary>Tagalog (optional)</summary>
          <label class="field"><span>Name</span><input v-model="form.name_tl" class="in" maxlength="80"></label>
          <label class="field"><span>Short description</span><input v-model="form.description_tl" class="in" maxlength="200"></label>
          <label class="field"><span>What is it used for?</span><textarea v-model="form.use_tl" class="in" maxlength="500" /></label>
        </details>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button type="button" class="btn ghost" :disabled="busy" @click="form = null">Cancel</button><button class="btn" :disabled="busy">{{ busy ? 'Saving...' : 'Save' }}</button></div>
      </form>
    </div>

    <div v-if="del" class="modal" @click.self="del = null">
      <form class="card" @submit.prevent="remove">
        <h2>Delete this piece for good?</h2>
        <p class="muted">"{{ del.name }}" and its 3D file will be deleted. This cannot be undone. If you only want the students not to see it, use Hide instead.</p>
        <label class="field"><span>Type the name of the piece to confirm</span><input v-model="delText" class="in" autocomplete="off"></label>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button type="button" class="btn ghost" @click="del = null">Cancel</button><button class="btn danger" :disabled="busy || delText.trim() !== del.name">Delete for good</button></div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { upload } from '@vercel/blob/client'
const maxMb = 25
const data = ref(null), error = ref(''), form = ref(null), del = ref(null), delText = ref(''), formErr = ref(''), busy = ref(false), file = ref(null), progress = ref(0)
const msg = e => e?.data?.statusMessage || e?.message || 'Something went wrong.'
const catName = id => data.value?.categories.find(c => c.id === id)?.title || id
const fileName = u => (u ? decodeURIComponent(u.split('/').pop()) : 'no file')

async function load() { try { data.value = await $fetch('/api/models') } catch (e) { error.value = msg(e) } }
const blank = () => ({ id: null, name: '', category_id: '', description: '', use_text: '', file_url: '', name_tl: '', description_tl: '', use_tl: '' })
function openForm(m) {
  formErr.value = ''; file.value = null; progress.value = 0
  form.value = m ? { ...blank(), ...m, name_tl: m.name_tl || '', description_tl: m.description_tl || '', use_tl: m.use_tl || '' } : blank()
}
function pickFile(e) {
  const f = e.target.files?.[0]; formErr.value = ''; file.value = null
  if (!f) return
  if (!/\.glb$/i.test(f.name)) { formErr.value = 'The file must be a .glb file.'; e.target.value = ''; return }
  if (f.size > maxMb * 1024 * 1024) { formErr.value = `The file is too big. The most is ${maxMb} MB.`; e.target.value = ''; return }
  file.value = f
}
async function save() {
  formErr.value = ''
  const f = form.value
  if (!f.id && !file.value) { formErr.value = 'Choose the .glb file.'; return }
  busy.value = true; progress.value = 0
  try {
    let url = f.file_url
    if (file.value) {
      const safe = file.value.name.toLowerCase().replace(/[^a-z0-9.-]+/g, '-')
      const blob = await upload('models/' + safe, file.value, { access: 'public', contentType: 'model/gltf-binary', handleUploadUrl: '/api/models/upload', onUploadProgress: p => { progress.value = Math.round(p.percentage) } })
      url = blob.url
    }
    const body = { ...f, file_url: url }
    if (f.id) await $fetch(`/api/models/${f.id}`, { method: 'PATCH', body })
    else await $fetch('/api/models', { method: 'POST', body })
    form.value = null; await load()
  } catch (e) { formErr.value = msg(e) }
  busy.value = false
}
async function toggle(m) { try { await $fetch(`/api/models/${m.id}`, { method: 'PATCH', body: { hidden: !m.hidden } }); await load() } catch (e) { error.value = msg(e) } }
function askDelete(m) { formErr.value = ''; delText.value = ''; del.value = m }
async function remove() {
  busy.value = true; formErr.value = ''
  try { await $fetch(`/api/models/${del.value.id}`, { method: 'DELETE', query: { confirm: delText.value.trim() } }); del.value = null; await load() }
  catch (e) { formErr.value = msg(e) }
  busy.value = false
}
onMounted(load)
</script>

<style scoped>
.head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
h2 { margin: 0 0 12px; font-size: 19px; }
.muted { margin: 6px 0 0; color: var(--muted); max-width: 640px; }
.list { display: grid; gap: 8px; margin-top: 16px; }
.row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, 0.04); flex-wrap: wrap; }
.main { flex: 1; min-width: 220px; display: grid; gap: 3px; }
.main small { color: var(--muted); }
.modal { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.7); }
.card { width: min(560px, 100%); max-height: 92vh; overflow: auto; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: #160e10; }
.acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
.bar { height: 8px; margin-bottom: 12px; border-radius: 99px; background: rgba(255, 255, 255, 0.1); overflow: hidden; }
.bar i { display: block; height: 100%; background: var(--red); transition: width 0.2s; }
details { margin-bottom: 12px; } summary { cursor: pointer; font-weight: 700; margin-bottom: 10px; }
</style>
