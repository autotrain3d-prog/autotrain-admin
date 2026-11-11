<template>
  <main class="page">
    <header class="top">
      <div class="brand"><span class="mark">A</span><span>AutoTrain <b>3D</b></span><em>Admin</em></div>
      <nav class="nav">
        <NuxtLink to="/">Dashboard</NuxtLink>
        <NuxtLink to="/quiz">Quiz</NuxtLink>
        <NuxtLink to="/models">3D Tools</NuxtLink>
      </nav>
      <div class="who">
        <span>{{ admin?.name }}<small>{{ admin?.email }}</small></span>
        <button class="btn ghost sm" @click="logout">Sign out</button>
      </div>
    </header>
    <slot />
  </main>
</template>

<script setup>
const { admin, logout } = useAdmin()
</script>

<style scoped>
.page { position: relative; max-width: 980px; margin: 0 auto; padding: 24px 20px 80px; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 14px; flex-wrap: wrap; margin-bottom: 26px; }
.brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
.brand b { color: var(--red); }
.brand em { padding: 3px 10px; border-radius: 999px; background: rgba(239, 51, 64, 0.18); border: 1px solid rgba(239, 51, 64, 0.4); color: #ff8088; font-size: 12px; font-style: normal; letter-spacing: 0.1em; text-transform: uppercase; }
.mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: linear-gradient(160deg, #f04450, #b91c1c); }
.nav { display: flex; gap: 6px; }
.nav a { padding: 8px 14px; border-radius: 10px; color: #bfb3b5; font-weight: 700; text-decoration: none; }
.nav a.router-link-exact-active, .nav a.router-link-active:not([href='/']) { color: #fff; background: rgba(239, 51, 64, 0.2); }
.who { display: flex; align-items: center; gap: 12px; }
.who span { display: grid; text-align: right; font-weight: 700; font-size: 14px; }
.who small { color: var(--muted); font-weight: 500; font-size: 12px; }
</style>
