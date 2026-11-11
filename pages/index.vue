<template>
  <div>
    <section class="intro">
      <h1>Dashboard</h1>
      <p class="muted">The admin is connected to the same database as the student app.</p>
    </section>

    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <section v-if="stats" class="grid">
      <article class="tile"><b>{{ show(stats.students) }}</b><span>Students</span><small v-if="stats.students !== null">{{ show(stats.verified) }} verified, {{ show(stats.newThisWeek) }} new this week</small></article>
      <article class="tile"><b>{{ show(stats.admins) }}</b><span>Admins</span></article>
      <NuxtLink to="/quiz" class="tile link"><b>{{ show(stats.quizQuestions) }}</b><span>Added quiz questions</span><small>Open the quiz manager</small></NuxtLink>
      <NuxtLink to="/models" class="tile link"><b>{{ show(stats.models) }}</b><span>Added 3D pieces</span><small>Open the 3D Tools manager</small></NuxtLink>
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
.tile.link { text-decoration: none; color: inherit; }
.tile.link:hover { border-color: rgba(239, 51, 64, 0.5); }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
.brand b { color: var(--red); }
.brand em { padding: 3px 10px; border-radius: 999px; background: rgba(239, 51, 64, 0.18); border: 1px solid rgba(239, 51, 64, 0.4); color: #ff8088; font-size: 12px; font-style: normal; letter-spacing: 0.1em; text-transform: uppercase; }
.mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: linear-gradient(160deg, #f04450, #b91c1c); }
.who { display: flex; align-items: center; gap: 12px; }
.who span { display: grid; text-align: right; font-weight: 700; font-size: 14px; }
.who small { color: var(--muted); font-weight: 500; font-size: 12px; }
.intro { margin: 34px 0 18px; }
h1 { margin: 0; font-size: 34px; letter-spacing: -0.03em; }
.muted { margin: 8px 0 0; color: var(--muted); }
.grid { display: grid; gap: 12px; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); }
.tile { display: grid; gap: 4px; padding: 18px; border: 1px solid var(--line); border-radius: 18px; background: linear-gradient(160deg, rgba(255, 255, 255, 0.06), rgba(255, 255, 255, 0.02)); }
.tile b { font-size: 38px; letter-spacing: -0.03em; color: #ff6b75; }
.tile span { font-weight: 700; }
.tile small { color: var(--muted); font-size: 12px; }
.tile.off b { color: #7d7274; }
.note { margin-top: 28px; padding: 16px 18px; border: 1px solid rgba(61, 220, 132, 0.35); border-radius: 16px; background: rgba(61, 220, 132, 0.08); }
.note h2 { margin: 0 0 6px; font-size: 17px; }
.note p { margin: 0; color: #d6ddd9; line-height: 1.5; }
.error { padding: 12px 14px; border: 1px solid rgba(239, 51, 64, 0.4); border-radius: 12px; background: rgba(239, 51, 64, 0.12); color: #ff9aa0; }
</style>
