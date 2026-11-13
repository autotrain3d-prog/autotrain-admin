<template>
  <main class="login-page">
    <div class="bg" aria-hidden="true"><div class="glow glow-a"></div><div class="glow glow-b"></div><div class="dots"></div></div>

    <div class="wrap">
      <form class="card" novalidate @submit.prevent="next">
        <span class="role">Admin</span>
        <h2 class="card-title">{{ step === 3 && done ? 'Password changed' : 'Forgot password' }}</h2>

        <!-- step 1: the email -->
        <template v-if="step === 1">
          <p class="muted">Enter the email of your admin account. We will send a 6-digit code to your Gmail.</p>
          <label class="field-label" for="email">Email</label>
          <div class="field"><input id="email" v-model.trim="email" type="email" placeholder="Email" autocomplete="username" required autofocus /></div>
        </template>

        <!-- step 2: the code from Gmail -->
        <template v-else-if="step === 2">
          <p class="muted">We sent a 6-digit code to <b>{{ email }}</b>. It expires in 10 minutes.</p>
          <label class="field-label" for="code">Code from Gmail</label>
          <div class="field"><input id="code" v-model="code" inputmode="numeric" maxlength="6" placeholder="6-digit code" autocomplete="one-time-code" class="code" required autofocus /></div>
          <button type="button" class="link" :disabled="wait > 0 || busy" @click="resend">{{ wait > 0 ? `Send the code again in ${wait}s` : 'Send the code again' }}</button>
        </template>

        <!-- step 3: the new password -->
        <template v-else-if="!done">
          <p class="muted">Choose a new password (at least 8 characters).</p>
          <label class="field-label" for="pw">New password</label>
          <div class="field">
            <input id="pw" v-model="password" :type="show ? 'text' : 'password'" placeholder="New password" autocomplete="new-password" required autofocus />
            <button type="button" class="eye" :aria-label="show ? 'Hide the password' : 'Show the password'" @click="show = !show">
              <svg v-if="!show" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
              <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22" /></svg>
            </button>
          </div>
          <label class="field-label" for="pw2">Confirm the password</label>
          <div class="field"><input id="pw2" v-model="password2" :type="show ? 'text' : 'password'" placeholder="Confirm the password" autocomplete="new-password" required /></div>
        </template>

        <p v-else class="muted">Your password is changed. You can sign in with the new password now.</p>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button v-if="!(step === 3 && done)" class="login-button" :disabled="busy || !canNext">{{ busy ? 'Please wait...' : step === 1 ? 'Send the code' : step === 2 ? 'Check the code' : 'Change the password' }}</button>
        <NuxtLink v-else to="/login" class="login-button as-link">Back to sign in</NuxtLink>
        <div v-if="!(step === 3 && done)" class="links"><NuxtLink to="/login">Back to sign in</NuxtLink></div>
      </form>
    </div>
  </main>
</template>

<script setup>
definePageMeta({ layout: false })
const step = ref(1), email = ref(''), code = ref(''), password = ref(''), password2 = ref(''), show = ref(false)
const busy = ref(false), error = ref(''), done = ref(false), wait = ref(0)
let resetToken = '', timer = null

const canNext = computed(() => (step.value === 1 ? /\S+@\S+\.\S+/.test(email.value) : step.value === 2 ? code.value.replace(/\D/g, '').length === 6 : password.value.length >= 8 && password2.value.length >= 8))
function startWait() { wait.value = 30; clearInterval(timer); timer = setInterval(() => { wait.value--; if (wait.value <= 0) clearInterval(timer) }, 1000) }
onBeforeUnmount(() => clearInterval(timer))

async function call(url, body) {
  busy.value = true; error.value = ''
  try { return await $fetch(url, { method: 'POST', body }) }
  catch (e) { error.value = e?.data?.statusMessage || 'Something went wrong. Try again.'; return null }
  finally { busy.value = false }
}
async function next() {
  if (busy.value || !canNext.value) return
  if (step.value === 1) { if (await call('/api/auth/forgot', { email: email.value })) { step.value = 2; startWait() } }
  else if (step.value === 2) {
    const r = await call('/api/auth/forgot/verify', { email: email.value, code: code.value })
    if (r) { resetToken = r.resetToken; step.value = 3 }
  } else {
    if (password.value !== password2.value) { error.value = 'The two passwords are not the same.'; return }
    if (await call('/api/auth/reset', { email: email.value, resetToken, password: password.value })) done.value = true
  }
}
async function resend() { if (await call('/api/auth/forgot', { email: email.value })) startWait() }
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.login-page { --red: #ef3340; --red-deep: #dc2626; --bg: #0a0708; --text: #f6f1f1; --muted: #a89c9e; --line: rgba(255, 255, 255, 0.1); --display: 'Inter Tight', 'Inter', system-ui, sans-serif; --body: 'Inter', system-ui, sans-serif; position: relative; min-height: 100vh; min-height: 100dvh; overflow: hidden; background: var(--bg); color: var(--text); font-family: var(--body); }
.bg { position: absolute; inset: 0; pointer-events: none; }
.glow { position: absolute; border-radius: 50%; filter: blur(90px); }
.glow-a { top: -20%; left: -10%; width: 70vw; height: 70vw; max-width: 900px; max-height: 900px; background: rgba(150, 20, 30, 0.38); }
.glow-b { right: -15%; bottom: -25%; width: 55vw; height: 55vw; max-width: 700px; max-height: 700px; background: rgba(120, 15, 25, 0.28); }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px); background-size: 28px 28px; mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%); }
.wrap { position: relative; z-index: 1; min-height: 100vh; min-height: 100dvh; display: grid; place-items: center; padding: 24px; }
.card { position: relative; width: min(440px, 100%); padding: 32px 28px 24px; border: 1px solid var(--line); border-radius: 24px; background: linear-gradient(160deg, rgba(60, 14, 20, 0.7), rgba(14, 10, 11, 0.85) 55%); backdrop-filter: blur(18px); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55); }
.card::before { content: ''; position: absolute; top: -1px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, transparent, var(--red), transparent); }
.role { position: absolute; top: 20px; right: 22px; padding: 3px 10px; border-radius: 999px; background: rgba(239, 51, 64, 0.18); border: 1px solid rgba(239, 51, 64, 0.4); color: #ff8088; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.card-title { margin: 24px 0 14px; font-family: var(--display); font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
.muted { margin: 0 0 18px; color: var(--muted); font-size: 14px; line-height: 1.5; }
.muted b { color: var(--text); }
.field-label { display: block; margin-bottom: 8px; color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.field { position: relative; margin-bottom: 18px; }
.field input { box-sizing: border-box; width: 100%; min-height: 60px; padding: 0 56px 0 20px; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 14px; background: rgba(0, 0, 0, 0.35); color: var(--text); font-family: var(--body); font-size: 16px; }
.field input.code { text-align: center; font-size: 26px; letter-spacing: 10px; font-weight: 700; padding: 0 20px; }
.field input::placeholder { color: #75696b; opacity: 1; letter-spacing: 0; }
.field input:focus { outline: none; border-color: var(--red); box-shadow: 0 0 0 1px var(--red); }
.eye { position: absolute; top: 50%; right: 12px; display: grid; place-items: center; width: 40px; height: 40px; transform: translateY(-50%); border: 0; border-radius: 10px; background: transparent; color: #b9adaf; cursor: pointer; }
.eye:hover { color: #fff; }
.link { margin: -6px 0 14px; padding: 0; border: 0; background: none; color: #ff8088; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; }
.link:disabled { color: var(--muted); cursor: default; }
.error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid rgba(239, 51, 64, 0.4); border-radius: 14px; background: rgba(239, 51, 64, 0.12); color: #ff9aa0; font-size: 14px; }
.login-button { display: block; width: 100%; box-sizing: border-box; min-height: 54px; border: 0; border-radius: 12px; background: linear-gradient(180deg, #f04450, var(--red-deep)); color: #fff; font-family: var(--body); font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 12px 28px rgba(220, 38, 38, 0.35); }
.login-button.as-link { display: grid; place-items: center; text-decoration: none; }
.login-button:active { transform: scale(0.98); }
.login-button:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
.links { display: flex; justify-content: center; margin-top: 14px; }
.links a { color: #f6f1f1; font-size: 14px; font-weight: 600; text-decoration: none; }
.links a:hover { color: #ff8088; }
</style>
