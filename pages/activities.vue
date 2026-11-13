<template>
  <div>
    <section class="head">
      <div><h1>Activities</h1><p class="muted">The activities that are already in the student Activity page. Change their titles and short texts (English and Tagalog), or hide them. <b>Reset</b> brings back the original.</p></div>
    </section>
    <p v-if="error" class="msg-err" role="alert">{{ error }}</p>
    <p v-if="note" class="msg-ok" role="status">{{ note }}</p>

    <template v-if="data">
      <div class="list">
        <article v-for="d in shown" :key="d.id" class="row" :class="{ dim: d.hidden }">
          <div class="main"><b>{{ (d.override && d.override.title) || d.title }}</b><small>{{ d.level }}</small></div>
          <span v-if="d.changed && !d.hidden" class="pill on">Changed</span>
          <span class="pill" :class="d.hidden ? 'off' : 'on'">{{ d.hidden ? 'Hidden' : 'Shown' }}</span>
          <button class="btn ghost sm" :disabled="busy" @click="toggle(d)">{{ d.hidden ? 'Show' : 'Hide (Itago)' }}</button>
          <button class="btn ghost sm" @click="edit(d)">Edit</button>
          <button v-if="d.changed" class="btn danger sm" :disabled="busy" @click="reset(d)">Reset</button>
        </article>
      </div>
    </template>
    <p v-else-if="!error" class="muted">Loading...</p>

    <div v-if="form" class="modal" @click.self="form = null">
      <form class="card" @submit.prevent="save">
        <h2>Edit "{{ form.orig.title }}"</h2>
        <p class="muted">Leave a box empty to keep the original text. The tasks inside the activity are not changed here.</p>
        <label class="field"><span>Title</span><input v-model="form.title" class="in" maxlength="120" :placeholder="form.orig.title"></label>
        <label class="field"><span>Short text</span><textarea v-model="form.summary" class="in" maxlength="300" :placeholder="form.orig.summary" /></label>
        <details :open="Boolean(form.title_tl || form.summary_tl)">
          <summary>Tagalog (optional)</summary>
          <label class="field"><span>Title</span><input v-model="form.title_tl" class="in" maxlength="120"></label>
          <label class="field"><span>Short text</span><textarea v-model="form.summary_tl" class="in" maxlength="300" /></label>
        </details>
        <p v-if="formError" class="msg-err">{{ formError }}</p>
        <div class="acts"><button type="button" class="btn ghost" @click="form = null">Cancel</button><button class="btn" :disabled="busy">{{ busy ? 'Saving...' : 'Save' }}</button></div>
      </form>
    </div>
  </div>
</template>

<script setup>
const data = ref(null), error = ref(''), note = ref(''), busy = ref(false), grp = ref('all'), form = ref(null), formError = ref('')
const api = async (url, opts) => {
  try { return await $fetch(url, opts) } catch (e) { if (e?.statusCode === 401) { await navigateTo('/login'); return null } throw e }
}
async function load() { try { data.value = await api('/api/activities') } catch (e) { error.value = e?.data?.statusMessage || 'Could not read the list.' } }
onMounted(load)
const shown = computed(() => (data.value ? data.value.activities : []))
function flash(m) { note.value = m; setTimeout(() => { if (note.value === m) note.value = '' }, 3500) }
function edit(d) {
  const o = d.override || {}
  formError.value = ''
  form.value = { id: d.id, orig: d, title: o.title || '', title_tl: o.title_tl || '', summary: o.summary || '', summary_tl: o.summary_tl || '', hidden: Boolean(o.hidden) }
}
async function save() {
  if (busy.value) return
  busy.value = true; formError.value = ''
  try {
    const f = form.value
    await api('/api/activities', { method: 'PATCH', body: { id: f.id, title: f.title, title_tl: f.title_tl, summary: f.summary, summary_tl: f.summary_tl, hidden: f.hidden } })
    form.value = null; flash('Saved. The students see it in about a minute.'); await load()
  } catch (e) { formError.value = e?.data?.statusMessage || 'Could not save.' }
  finally { busy.value = false }
}
async function toggle(d) {
  busy.value = true
  try { await api('/api/activities', { method: 'PATCH', body: { id: d.id, hidden: !d.hidden } }); flash(d.hidden ? 'Shown again.' : 'Hidden from the students.'); await load() }
  catch (e) { error.value = e?.data?.statusMessage || 'Could not change it.' }
  finally { busy.value = false }
}
async function reset(d) {
  if (!confirm(`Bring back the original of "${d.title}"?`)) return
  busy.value = true
  try { await api('/api/activities?id=' + encodeURIComponent(d.id), { method: 'DELETE' }); flash('Back to the original.'); await load() }
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
.tools { display: flex; gap: 10px; margin-top: 16px; }
.tools .in { max-width: 280px; margin: 0; }
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
