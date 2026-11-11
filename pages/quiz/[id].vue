<template>
  <div>
    <NuxtLink to="/quiz" class="back">← All quizzes</NuxtLink>
    <p v-if="error" class="msg-err" role="alert">{{ error }}</p>

    <template v-if="data">
      <section class="head">
        <div>
          <h1>{{ title }}</h1>
          <p class="muted" v-if="data.topic.builtin">This quiz is in the student app already. The questions you add here are shown after the built-in ones.</p>
          <p class="muted" v-else>{{ data.topic.group_name }} · {{ data.topic.level }} · <span class="pill" :class="data.topic.hidden ? 'off' : 'on'">{{ data.topic.hidden ? 'Hidden' : 'Shown' }}</span></p>
        </div>
        <div class="acts">
          <button v-if="!data.topic.builtin" class="btn ghost" @click="toggleTopic">{{ data.topic.hidden ? 'Show quiz' : 'Hide quiz (Itago)' }}</button>
          <button class="btn" @click="openForm()">+ Add question</button>
        </div>
      </section>
      <p v-if="!data.topic.builtin && data.topic.hidden" class="hint">This quiz is hidden. The students will not see it until you click "Show quiz". Questions must also be shown.</p>

      <p v-if="!data.questions.length" class="muted">No added questions yet.</p>
      <div class="list">
        <article v-for="q in data.questions" :key="q.id" class="row">
          <div class="main">
            <b>{{ q.text }}</b>
            <small>✔ {{ q.answer }}</small>
          </div>
          <span class="pill" :class="q.hidden ? 'off' : 'on'">{{ q.hidden ? 'Hidden' : 'Shown' }}</span>
          <button class="btn ghost sm" @click="toggleQ(q)">{{ q.hidden ? 'Show' : 'Hide' }}</button>
          <button class="btn ghost sm" @click="openForm(q)">Edit</button>
          <button class="btn danger sm" @click="delQ = q; formErr = ''">Delete</button>
        </article>
      </div>
    </template>

    <div v-if="form" class="modal" @click.self="form = null">
      <form class="card" @submit.prevent="save">
        <h2>{{ form.id ? 'Edit question' : 'New question' }}</h2>
        <label class="field"><span>Question</span><textarea v-model="form.text" class="in" maxlength="300" required /></label>
        <label class="field"><span>Right answer</span><input v-model="form.answer" class="in" maxlength="200" required></label>
        <label v-for="i in 3" :key="i" class="field"><span>Wrong answer {{ i }}</span><input v-model="form.wrong[i - 1]" class="in" maxlength="200" required></label>
        <label class="field"><span>Why is it right? <small>(shown after the answer)</small></span><textarea v-model="form.why" class="in" maxlength="500" /></label>
        <details :open="hasTl(form)">
          <summary>Tagalog (optional)</summary>
          <label class="field"><span>Question</span><textarea v-model="form.text_tl" class="in" maxlength="300" /></label>
          <label class="field"><span>Right answer</span><input v-model="form.answer_tl" class="in" maxlength="200"></label>
          <label v-for="i in 3" :key="i" class="field"><span>Wrong answer {{ i }}</span><input v-model="form.wrong_tl[i - 1]" class="in" maxlength="200"></label>
          <label class="field"><span>Why is it right?</span><textarea v-model="form.why_tl" class="in" maxlength="500" /></label>
        </details>
        <p v-if="!form.id" class="muted">A new question starts hidden. Click "Show" in the list when it is ready.</p>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button type="button" class="btn ghost" @click="form = null">Cancel</button><button class="btn" :disabled="busy">Save</button></div>
      </form>
    </div>

    <div v-if="delQ" class="modal" @click.self="delQ = null">
      <div class="card">
        <h2>Delete this question for good?</h2>
        <p class="muted">"{{ delQ.text }}" will be deleted. This cannot be undone. To only hide it from the students, use Hide.</p>
        <p v-if="formErr" class="msg-err">{{ formErr }}</p>
        <div class="acts"><button class="btn ghost" @click="delQ = null">Cancel</button><button class="btn danger" :disabled="busy" @click="removeQ">Delete for good</button></div>
      </div>
    </div>
  </div>
</template>

<script setup>
const route = useRoute()
const id = route.params.id
const data = ref(null), error = ref(''), form = ref(null), delQ = ref(null), formErr = ref(''), busy = ref(false)
const msg = e => e?.data?.statusMessage || 'Something went wrong.'
const title = computed(() => data.value?.topic.builtin ? 'Add questions to: ' + id : data.value?.topic.title)
const hasTl = f => Boolean(f.text_tl || f.answer_tl || f.why_tl || f.wrong_tl.some(Boolean))

async function load() {
  try {
    data.value = await $fetch('/api/quiz/questions', { query: { topic: id } })
    if (data.value.topic.builtin) {
      const all = await $fetch('/api/quiz/topics'); const b = all.builtin.find(t => t.id === id)
      if (b) data.value.topic.title = b.title
    }
  } catch (e) { error.value = msg(e) }
}
const blank = () => ({ id: null, topic_id: id, text: '', answer: '', wrong: ['', '', ''], why: '', text_tl: '', answer_tl: '', wrong_tl: ['', '', ''], why_tl: '' })
function openForm(q) {
  formErr.value = ''
  form.value = q ? { ...blank(), ...q, topic_id: id, wrong: [...q.wrong], wrong_tl: q.wrong_tl ? [...q.wrong_tl] : ['', '', ''], text_tl: q.text_tl || '', answer_tl: q.answer_tl || '', why: q.why || '', why_tl: q.why_tl || '' } : blank()
}
async function save() {
  busy.value = true; formErr.value = ''
  try {
    const f = form.value
    if (f.id) await $fetch(`/api/quiz/questions/${f.id}`, { method: 'PATCH', body: f })
    else await $fetch('/api/quiz/questions', { method: 'POST', body: f })
    form.value = null; await load()
  } catch (e) { formErr.value = msg(e) }
  busy.value = false
}
async function toggleQ(q) { try { await $fetch(`/api/quiz/questions/${q.id}`, { method: 'PATCH', body: { hidden: !q.hidden } }); await load() } catch (e) { error.value = msg(e) } }
async function toggleTopic() { try { await $fetch(`/api/quiz/topics/${id}`, { method: 'PATCH', body: { hidden: !data.value.topic.hidden } }); await load() } catch (e) { error.value = msg(e) } }
async function removeQ() {
  busy.value = true; formErr.value = ''
  try { await $fetch(`/api/quiz/questions/${delQ.value.id}`, { method: 'DELETE', query: { confirm: 'yes' } }); delQ.value = null; await load() }
  catch (e) { formErr.value = msg(e) }
  busy.value = false
}
onMounted(load)
</script>

<style scoped>
.back { color: var(--muted); text-decoration: none; font-weight: 700; }
.head { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap; margin: 14px 0; }
h1 { margin: 0; font-size: 30px; letter-spacing: -0.03em; }
.muted { margin: 6px 0 0; color: var(--muted); text-transform: none; }
.hint { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(255, 177, 92, 0.4); background: rgba(255, 177, 92, 0.08); color: #ffd09a; }
.list { display: grid; gap: 8px; margin-top: 14px; }
.row { display: flex; align-items: center; gap: 10px; padding: 12px 14px; border: 1px solid var(--line); border-radius: 14px; background: rgba(255, 255, 255, 0.04); flex-wrap: wrap; }
.main { flex: 1; min-width: 220px; display: grid; gap: 3px; }
.main small { color: var(--ok); }
.acts { display: flex; gap: 10px; justify-content: flex-end; flex-wrap: wrap; }
.modal { position: fixed; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px; background: rgba(0, 0, 0, 0.7); }
.card { width: min(560px, 100%); max-height: 92vh; overflow: auto; padding: 22px; border: 1px solid var(--line); border-radius: 18px; background: #160e10; }
.card h2 { margin: 0 0 12px; font-size: 19px; }
details { margin-bottom: 12px; } summary { cursor: pointer; font-weight: 700; margin-bottom: 10px; }
</style>
