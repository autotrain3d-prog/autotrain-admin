<template>
  <div>
    <section class="head">
      <div><h1>Quiz</h1><p class="muted">Add questions to the quizzes of the student app, or make a new quiz. New things stay hidden until you show them.</p></div>
      <button class="btn" @click="openNew">+ New quiz</button>
    </section>

    <p v-if="error" class="msg-err" role="alert">{{ error }}</p>

    <h2>Your quizzes</h2>
    <p v-if="data && !data.custom.length" class="muted">You have no quiz of your own yet.</p>
    <div class="list">
      <article v-for="t in data?.custom" :key="t.id" class="row">
        <NuxtLink :to="`/quiz/${t.id}`" class="main">
          <b>{{ t.title }}</b>
          <small>{{ t.group_name }} · {{ t.level }} · {{ t.questions }} question{{ t.questions === 1 ? '' : 's' }}</small>
        </NuxtLink>
        <span class="pill" :class="t.hidden ? 'off' : 'on'">{{ t.hidden ? 'Hidden' : 'Shown' }}</span>
        <button class="btn ghost sm" @click="toggle(t)">{{ t.hidden ? 'Show' : 'Hide (Itago)' }}</button>
        <button class="btn danger sm" @click="askDelete(t)">Delete</button>
      </article>
    </div>

    <h2>Built-in quizzes <small class="muted">(in the student app already; you can add questions, not delete)</small></h2>
    <div class="list">
      <article v-for="t in data?.builtin" :key="t.id" class="row">
        <NuxtLink :to="`/quiz/${t.id}`" class="main">
          <b>{{ t.title }}</b>
          <small>{{ t.group }} · {{ t.level }} · {{ t.count }} built-in<template v-if="t.added"> + {{ t.added }} added</template></small>
        </NuxtLink>
      </article>
    </div>

    <div v-if="form" class="modal" @click.self="form = null">
      <form class="card" @submit.prevent="create">
        <h2>New quiz</h2>
        <label class="field"><span>Name</span><input v-model="form.title" class="in" maxlength="80" required></label>
        <label class="field"><span>Name in Tagalog <small>(optional)</small></span><input v-model="form.title_tl" class="in" maxlength="80"></label>
        <label class="field"><span>Group</span><select v-model="form.group_name" class="in"><option value="maintenance">Maintenance</option><option value="diagnostic">Diagnostic</option></select></label>
        <label class="field"><span>Level</span><select v-model="form.level" class="in"><option>Basic</option><option>Intermediate</option><option>Advanced</option></select></label>
        <label class="field"><span>Icon</span><select v-model="form.icon" class="in"><option v-for="i in icons" :key="i" :value="i">{{ i.replace('mdi-', '') }}</option></select></label>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button type="button" class="btn ghost" @click="form = null">Cancel</button><button class="btn" :disabled="busy">Create</button></div>
      </form>
    </div>

    <div v-if="del" class="modal" @click.self="del = null">
      <form class="card" @submit.prevent="remove">
        <h2>Delete this quiz for good?</h2>
        <p class="muted">"{{ del.title }}" and its {{ del.questions }} question(s) will be deleted. This cannot be undone. If you only want the students not to see it, use Hide instead.</p>
        <label class="field"><span>Type the name of the quiz to confirm</span><input v-model="delText" class="in" autocomplete="off"></label>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button type="button" class="btn ghost" @click="del = null">Cancel</button><button class="btn danger" :disabled="busy || delText.trim() !== del.title">Delete for good</button></div>
      </form>
    </div>
  </div>
</template>

<script setup>
const data = ref(null), error = ref(''), form = ref(null), del = ref(null), delText = ref(''), formErr = ref(''), busy = ref(false)
const icons = ['mdi-help-circle-outline', 'mdi-wrench-outline', 'mdi-car-battery', 'mdi-oil', 'mdi-tire', 'mdi-car-brake-abs', 'mdi-engine-outline', 'mdi-flash', 'mdi-water', 'mdi-thermometer-water', 'mdi-gauge', 'mdi-stethoscope', 'mdi-shield-check-outline', 'mdi-cog-outline', 'mdi-car-info', 'mdi-lightbulb-on-outline']
const msg = e => e?.data?.statusMessage || 'Something went wrong.'

async function load() {
  try { data.value = await $fetch('/api/quiz/topics') } catch (e) { error.value = msg(e) }
}
function openNew() { formErr.value = ''; form.value = { title: '', title_tl: '', group_name: 'maintenance', level: 'Basic', icon: icons[0] } }
async function create() {
  busy.value = true; formErr.value = ''
  try { const r = await $fetch('/api/quiz/topics', { method: 'POST', body: form.value }); form.value = null; await navigateTo(`/quiz/${r.id}`) }
  catch (e) { formErr.value = msg(e) }
  busy.value = false
}
async function toggle(t) {
  try { await $fetch(`/api/quiz/topics/${t.id}`, { method: 'PATCH', body: { hidden: !t.hidden } }); await load() } catch (e) { error.value = msg(e) }
}
function askDelete(t) { formErr.value = ''; delText.value = ''; del.value = t }
async function remove() {
  busy.value = true; formErr.value = ''
  try { await $fetch(`/api/quiz/topics/${del.value.id}`, { method: 'DELETE', query: { confirm: delText.value.trim() } }); del.value = null; await load() }
  catch (e) { formErr.value = msg(e) }
  busy.value = false
}
onMounted(load)
</script>

<style scoped>
.head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; }
h1 { margin: 0; font-size: 32px; letter-spacing: -0.03em; }
h2 { margin: 28px 0 10px; font-size: 18px; }
h2 small { font-size: 12px; font-weight: 500; }
.muted { margin: 6px 0 0; color: var(--muted); }
.list { display: grid; gap: 8px; }
.row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, 0.04); flex-wrap: wrap; }
.main { flex: 1; min-width: 200px; display: grid; gap: 2px; text-decoration: none; color: inherit; }
.main small { color: var(--muted); text-transform: capitalize; }
.main:hover b { color: #ff8088; }
.modal { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.7); }
.card { width: min(480px, 100%); max-height: 92vh; overflow: auto; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: #160e10; }
.card h2 { margin-top: 0; }
.acts { display: flex; justify-content: flex-end; gap: 10px; margin-top: 8px; }
</style>
