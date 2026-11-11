<template>
  <main class="wrap">
    <form class="card" @submit.prevent="submit" novalidate>
      <div class="brand"><span class="mark">A</span><span>AutoTrain <b>3D</b></span><em>Admin</em></div>
      <h1>Admin sign in</h1>
      <p class="muted">This page is only for the system administrators.</p>

      <label for="email">Email</label>
      <input id="email" v-model.trim="email" type="email" autocomplete="username" required autofocus />

      <label for="pw">Password</label>
      <div class="pw">
        <input id="pw" v-model="password" :type="show ? 'text' : 'password'" autocomplete="current-password" required />
        <button type="button" class="eye" :aria-label="show ? 'Hide the password' : 'Show the password'" @click="show = !show">{{ show ? 'Hide' : 'Show' }}</button>
      </div>

      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <button class="btn" :disabled="busy || !email || !password">{{ busy ? 'Signing in...' : 'Sign in' }}</button>
    </form>
  </main>
</template>

<script setup>
definePageMeta({ layout: false })
const { refresh } = useAdmin()
const email = ref(''), password = ref(''), show = ref(false), busy = ref(false), error = ref('')

async function submit() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value } })
    await refresh()
    await navigateTo('/')
  } catch (e) {
    error.value = e?.data?.statusMessage || 'Could not sign in. Try again.'
  } finally { busy.value = false }
}
</script>

<style scoped>
.wrap { position: relative; min-height: 100vh; display: grid; place-items: center; padding: 24px; }
.card { width: min(420px, 100%); display: grid; gap: 8px; padding: 28px 26px; border: 1px solid var(--line); border-radius: 22px; background: linear-gradient(160deg, rgba(255, 255, 255, 0.07), rgba(255, 255, 255, 0.02)); backdrop-filter: blur(10px); }
.brand { display: flex; align-items: center; gap: 10px; font-size: 20px; font-weight: 800; }
.brand b { color: var(--red); }
.brand em { margin-left: auto; padding: 3px 10px; border-radius: 999px; background: rgba(239, 51, 64, 0.18); border: 1px solid rgba(239, 51, 64, 0.4); color: #ff8088; font-size: 12px; font-style: normal; letter-spacing: 0.1em; text-transform: uppercase; }
.mark { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 11px; background: linear-gradient(160deg, #f04450, #b91c1c); }
h1 { margin: 14px 0 0; font-size: 26px; letter-spacing: -0.02em; }
.muted { margin: 0 0 8px; color: var(--muted); font-size: 14px; }
label { margin-top: 8px; font-size: 13px; font-weight: 700; color: #cfc5c7; }
input { width: 100%; min-height: 48px; padding: 0 14px; border: 1px solid var(--line); border-radius: 12px; background: rgba(255, 255, 255, 0.05); color: inherit; }
.pw { position: relative; }
.pw input { padding-right: 70px; }
.eye { position: absolute; right: 6px; top: 6px; height: 36px; padding: 0 12px; border: 0; border-radius: 9px; background: rgba(255, 255, 255, 0.08); color: inherit; cursor: pointer; font-size: 13px; }
.error { margin: 4px 0 0; padding: 10px 12px; border: 1px solid rgba(239, 51, 64, 0.4); border-radius: 12px; background: rgba(239, 51, 64, 0.12); color: #ff9aa0; font-size: 14px; }
.btn { margin-top: 12px; width: 100%; }
</style>
