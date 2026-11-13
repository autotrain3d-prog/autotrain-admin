<template>
  <div class="adm">
    <section class="intro">
      <p class="eyebrow">Overview</p>
      <h1>Dashboard</h1>
      <p class="muted">The admin is connected to the same database as the student app.</p>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <section v-if="stats" class="grid">
      <article class="tile">
        <span class="badge" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M21 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8" /></svg></span>
        <div class="txt"><b>{{ show(stats.students) }}</b><span>Students</span><small v-if="stats.students !== null">{{ show(stats.verified) }} verified, {{ show(stats.newThisWeek) }} new this week</small></div>
      </article>
      <article class="tile">
        <span class="badge" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg></span>
        <div class="txt"><b>{{ show(stats.admins) }}</b><span>Admins</span></div>
      </article>
      <NuxtLink to="/quiz" class="tile link">
        <span class="badge" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3M12 17h.01" /></svg></span>
        <div class="txt"><b>{{ show(stats.quizQuestions) }}</b><span>Added quiz questions</span><small>Open the quiz manager</small></div>
        <span class="go" aria-hidden="true">&rarr;</span>
      </NuxtLink>
      <NuxtLink to="/catalog-builtin" class="tile link">
        <span class="badge" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.4 2.4-2.6-.6-.6-2.6z" /></svg></span>
        <div class="txt"><b>95</b><span>Built-in 3D tools</span><small>Open the built-in tools</small></div>
        <span class="go" aria-hidden="true">&rarr;</span>
      </NuxtLink>
      <NuxtLink to="/demos" class="tile link">
        <span class="badge" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="6 4 20 12 6 20 6 4" /></svg></span>
        <div class="txt"><b>17</b><span>Guided demos</span><small>Open the built-in demos</small></div>
        <span class="go" aria-hidden="true">&rarr;</span>
      </NuxtLink>
      <NuxtLink to="/activities" class="tile link">
        <span class="badge" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg></span>
        <div class="txt"><b>2</b><span>Activities</span><small>Open the activities</small></div>
        <span class="go" aria-hidden="true">&rarr;</span>
      </NuxtLink>
    </section>
    <p v-else-if="!error" class="muted">Loading...</p>
  </div>
</template>

<script setup>
const stats = ref(null), error = ref('')
// a table that is not there yet shows a dash
const show = n => (n === null || n === undefined ? '-' : n)

onMounted(async () => {
  try { stats.value = await $fetch('/api/stats') }
  catch (e) {
    if (e?.statusCode === 401) return navigateTo('/login')
    error.value = e?.data?.statusMessage || 'Could not read the database. Check the values in .env.'
  }
})
</script>

<style scoped>
/* the same look as the student app */
.adm { --red: #ef3340; --red-deep: #dc2626; --text: #f6f1f1; --muted: #a89c9e; --line: rgba(255, 255, 255, 0.1); color: var(--text); font-family: 'Inter', system-ui, sans-serif; }
.intro { margin: 34px 0 20px; }
.eyebrow { margin: 0 0 6px; color: #ff6b75; font-size: 12px; font-weight: 800; letter-spacing: 0.14em; text-transform: uppercase; }
h1 { margin: 0; font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; font-size: clamp(28px, 5vw, 40px); font-weight: 800; letter-spacing: -0.03em; line-height: 1.1; }
.muted { margin: 10px 0 0; color: var(--muted); font-size: 15px; line-height: 1.5; }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(3, 1fr); }
@media (max-width: 900px) { .grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 560px) { .grid { grid-template-columns: 1fr; } }
.tile { position: relative; min-height: 112px; box-sizing: border-box; display: flex; align-items: center; gap: 14px; padding: 18px; border: 1px solid var(--line); border-radius: 20px; background: rgba(255, 255, 255, 0.04); color: inherit; text-decoration: none; }
.tile.link { cursor: pointer; transition: border-color 0.15s, background 0.15s; }
.tile.link:hover { border-color: rgba(239, 51, 64, 0.55); background: rgba(255, 255, 255, 0.06); }
.badge { flex: none; display: grid; place-items: center; width: 50px; height: 50px; border-radius: 15px; background: linear-gradient(160deg, rgba(239, 51, 64, 0.3), rgba(239, 51, 64, 0.08)); border: 1px solid rgba(239, 51, 64, 0.35); color: #ff6b75; }
.txt { min-width: 0; display: grid; gap: 2px; }
.txt b { font-family: 'Inter Tight', 'Inter', system-ui, sans-serif; font-size: 34px; font-weight: 800; letter-spacing: -0.03em; line-height: 1; color: #ff6b75; }
.txt span { font-weight: 700; font-size: 15px; }
.txt small { color: var(--muted); font-size: 12px; }
.go { margin-left: auto; flex: none; display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--red); color: #fff; font-weight: 800; }
.error { padding: 12px 14px; border: 1px solid rgba(239, 51, 64, 0.4); border-radius: 12px; background: rgba(239, 51, 64, 0.12); color: #ff9aa0; }
</style>
