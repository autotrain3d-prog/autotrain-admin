<template>
  <main class="login-page">
    <!-- Background -->
    <div class="bg" aria-hidden="true">
      <div class="glow glow-a"></div>
      <div class="glow glow-b"></div>
      <div class="dots"></div>
      <svg class="disc" viewBox="0 0 400 400">
        <g class="rotor">
          <circle cx="200" cy="200" r="190" class="ring-outer" />
          <circle cx="200" cy="200" r="150" />
          <circle cx="200" cy="200" r="60" />
          <circle cx="200" cy="200" r="22" />
          <g class="holes">
            <circle v-for="n in 12" :key="n" :cx="200 + 105 * Math.cos((n * 30 * Math.PI) / 180)" :cy="200 + 105 * Math.sin((n * 30 * Math.PI) / 180)" r="9" />
          </g>
        </g>
        <path class="caliper" d="M 352 118 A 190 190 0 0 1 352 282" />
      </svg>
    </div>

    <div class="shell">
      <!-- Brand -->
      <section class="brand">
        <h1 class="headline">AutoTrain <span class="accent">3D</span>.</h1>
        <p class="tagline">Administrator console. Manage the quizzes, the 3D tools, the guided demos and the activities of the training system.</p>
      </section>

      <!-- Login card -->
      <form class="card" novalidate @submit.prevent="submit">
        <span class="role">Admin</span>
        <h2 class="card-title">Sign in</h2>

        <label class="field-label" for="email">Email</label>
        <div class="field">
          <input id="email" v-model.trim="email" type="email" placeholder="Email" autocomplete="username" required autofocus />
        </div>

        <label class="field-label" for="pw">Password</label>
        <div class="field">
          <input id="pw" v-model="password" :type="show ? 'text' : 'password'" placeholder="Enter your password" autocomplete="current-password" required />
          <button type="button" class="eye" :aria-label="show ? 'Hide the password' : 'Show the password'" @click="show = !show">
            <svg v-if="!show" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.9 17.9A10.9 10.9 0 0 1 12 19c-6.4 0-10-7-10-7a18 18 0 0 1 5.1-5.9M9.9 4.2A10 10 0 0 1 12 4c6.4 0 10 7 10 7a18 18 0 0 1-2.2 3.2M1 1l22 22" /></svg>
          </button>
        </div>

        <label class="remember-label">
          <input v-model="remember" type="checkbox" />
          <span>Remember me</span>
        </label>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <button class="login-button" :disabled="busy || !email || !password">{{ busy ? 'Signing in...' : 'Login' }}</button>
        <div class="links"><NuxtLink to="/forgot-password">Forgot password?</NuxtLink></div>
        <p class="foot">This page is only for the system administrators.</p>
      </form>
    </div>
  </main>
</template>

<script setup>
definePageMeta({ layout: false })
const { refresh } = useAdmin()
const email = ref(''), password = ref(''), remember = ref(false), show = ref(false), busy = ref(false), error = ref('')

async function submit() {
  if (busy.value) return
  busy.value = true; error.value = ''
  try {
    await $fetch('/api/auth/login', { method: 'POST', body: { email: email.value, password: password.value, remember: remember.value } })
    await refresh()
    await navigateTo('/')
  } catch (e) {
    error.value = e?.data?.statusMessage || 'Could not sign in. Try again.'
  } finally { busy.value = false }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');

/* the same look as the student login */
.login-page {
  --red: #ef3340; --red-deep: #dc2626; --bg: #0a0708; --text: #f6f1f1; --muted: #a89c9e; --line: rgba(255, 255, 255, 0.1);
  --display: 'Inter Tight', 'Inter', system-ui, sans-serif; --body: 'Inter', system-ui, sans-serif;
  position: relative; min-height: 100vh; min-height: 100dvh; overflow: hidden; background: var(--bg); color: var(--text); font-family: var(--body);
}
.bg { position: absolute; inset: 0; pointer-events: none; }
.glow { position: absolute; border-radius: 50%; filter: blur(90px); }
.glow-a { top: -20%; left: -10%; width: 70vw; height: 70vw; max-width: 900px; max-height: 900px; background: rgba(150, 20, 30, 0.38); }
.glow-b { right: -15%; bottom: -25%; width: 55vw; height: 55vw; max-width: 700px; max-height: 700px; background: rgba(120, 15, 25, 0.28); }
.dots { position: absolute; inset: 0; background-image: radial-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px); background-size: 28px 28px; mask-image: radial-gradient(ellipse at center, #000 30%, transparent 80%); }
.disc { position: absolute; left: -12%; bottom: -22%; width: min(90vh, 760px); aspect-ratio: 1; fill: none; stroke: rgba(239, 51, 64, 0.2); stroke-width: 1.5; }
.rotor { transform-origin: 200px 200px; animation: spin-up 2.8s cubic-bezier(0.1, 0.7, 0.2, 1) both; }
.ring-outer { stroke: rgba(239, 51, 64, 0.34); stroke-width: 2.5; }
.holes circle { stroke: rgba(239, 51, 64, 0.38); }
.caliper { stroke: rgba(239, 51, 64, 0.5); stroke-width: 22; stroke-linecap: round; }
@keyframes spin-up { from { transform: rotate(-540deg); } to { transform: rotate(0deg); } }

.shell { position: relative; z-index: 1; display: grid; grid-template-columns: 1fr minmax(380px, 440px); align-items: center; gap: clamp(40px, 8vw, 140px); max-width: 1240px; min-height: 100vh; min-height: 100dvh; margin: 0 auto; padding: 48px clamp(24px, 5vw, 56px); }
.headline { margin: 0; font-family: var(--display); font-size: clamp(44px, 6vw, 84px); font-weight: 800; line-height: 0.98; letter-spacing: -0.045em; }
.accent { color: var(--red); }
.tagline { max-width: 420px; margin: 24px 0 0; color: var(--muted); font-size: 16px; line-height: 1.6; }

.card { position: relative; padding: 32px 28px 24px; border: 1px solid var(--line); border-radius: 24px; background: linear-gradient(160deg, rgba(60, 14, 20, 0.7), rgba(14, 10, 11, 0.85) 55%); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); box-shadow: 0 30px 80px rgba(0, 0, 0, 0.55); }
.card::before { content: ''; position: absolute; top: -1px; left: 12%; right: 12%; height: 2px; background: linear-gradient(90deg, transparent, var(--red), transparent); }
.role { position: absolute; top: 20px; right: 22px; padding: 3px 10px; border-radius: 999px; background: rgba(239, 51, 64, 0.18); border: 1px solid rgba(239, 51, 64, 0.4); color: #ff8088; font-size: 12px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; }
.card-title { margin: 24px 0 22px; font-family: var(--display); font-size: 30px; font-weight: 800; letter-spacing: -0.03em; }
.field-label { display: block; margin-bottom: 8px; color: var(--muted); font-size: 12px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; }
.field { position: relative; margin-bottom: 18px; }
.field input { box-sizing: border-box; width: 100%; min-height: 60px; padding: 0 56px 0 20px; border: 1px solid rgba(255, 255, 255, 0.14); border-radius: 14px; background: rgba(0, 0, 0, 0.35); color: var(--text); font-family: var(--body); font-size: 16px; }
.field input::placeholder { color: #75696b; opacity: 1; }
.field input:focus { outline: none; border-color: var(--red); box-shadow: 0 0 0 1px var(--red); }
.eye { position: absolute; top: 50%; right: 12px; display: grid; place-items: center; width: 40px; height: 40px; transform: translateY(-50%); border: 0; border-radius: 10px; background: transparent; color: #b9adaf; cursor: pointer; }
.eye:hover { color: #fff; }
.error { margin: 0 0 14px; padding: 10px 12px; border: 1px solid rgba(239, 51, 64, 0.4); border-radius: 14px; background: rgba(239, 51, 64, 0.12); color: #ff9aa0; font-size: 14px; }
.login-button { width: 100%; min-height: 54px; border: 0; border-radius: 12px; background: linear-gradient(180deg, #f04450, var(--red-deep)); color: #fff; font-family: var(--body); font-size: 16px; font-weight: 700; cursor: pointer; box-shadow: 0 12px 28px rgba(220, 38, 38, 0.35); transition: transform 0.12s ease, box-shadow 0.12s ease; }
.login-button:active { transform: scale(0.98); box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3); }
.login-button:disabled { opacity: 0.5; cursor: default; box-shadow: none; }
.remember-label { display: flex; align-items: center; gap: 12px; min-height: 44px; margin: -4px 0 12px; font-size: 15px; cursor: pointer; }
.remember-label input { width: 20px; height: 20px; accent-color: var(--red); }
.links { display: flex; justify-content: center; margin-top: 14px; }
.links a { color: #f6f1f1; font-size: 14px; font-weight: 600; text-decoration: none; }
.links a:hover { color: #ff8088; }
.foot { margin: 16px 0 0; color: var(--muted); font-size: 12px; font-weight: 600; text-align: center; }

@media (max-width: 860px) {
  .shell { grid-template-columns: 1fr; gap: 28px; padding-top: 72px; }
  .headline { font-size: clamp(40px, 12vw, 64px); }
  .tagline { margin-top: 14px; }
}
</style>
