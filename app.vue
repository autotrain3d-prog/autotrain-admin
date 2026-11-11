<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<style>
:root { --red: #ef3340; --red-deep: #dc2626; --bg: #0a0708; --text: #f6f1f1; --muted: #a89c9e; --line: rgba(255, 255, 255, 0.1); --ok: #3ddc84; }
* { box-sizing: border-box; }
html, body { margin: 0; min-height: 100%; background: var(--bg); color: var(--text); font-family: 'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif; -webkit-font-smoothing: antialiased; }
body::before { content: ''; position: fixed; inset: 0; pointer-events: none; background:
  radial-gradient(70vw 70vw at 0% 0%, rgba(150, 20, 30, 0.5), transparent 72%),
  radial-gradient(55vw 55vw at 100% 100%, rgba(120, 15, 25, 0.38), transparent 72%); }
button, input, select, textarea { font: inherit; }
a { color: inherit; }
.btn { display: inline-flex; align-items: center; justify-content: center; min-height: 46px; padding: 0 22px; border: 0; border-radius: 12px; background: linear-gradient(180deg, #f04450, var(--red-deep)); color: #fff; font-weight: 800; cursor: pointer; box-shadow: 0 10px 26px rgba(239, 51, 64, 0.3); }
.btn:disabled { opacity: 0.6; cursor: default; }
.btn.ghost { background: rgba(255, 255, 255, 0.07); border: 1px solid var(--line); box-shadow: none; }
.field { display: grid; gap: 6px; margin-bottom: 12px; }
.field > span { font-size: 13px; font-weight: 700; color: #d9cfd1; }
.field small { color: var(--muted); font-weight: 500; }
.in { width: 100%; min-height: 44px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 11px; background: rgba(255, 255, 255, 0.06); color: var(--text); }
textarea.in { min-height: 70px; resize: vertical; }
select.in option { background: #1a1213; }
.msg-err { padding: 10px 12px; border-radius: 10px; border: 1px solid rgba(239, 51, 64, 0.4); background: rgba(239, 51, 64, 0.12); color: #ff9aa0; }
.btn.sm { min-height: 36px; padding: 0 14px; font-size: 13px; border-radius: 10px; }
.btn.danger { background: rgba(239, 51, 64, 0.16); border: 1px solid rgba(239, 51, 64, 0.5); color: #ff9aa0; box-shadow: none; }
.pill { display: inline-block; padding: 2px 10px; border-radius: 999px; font-size: 12px; font-weight: 800; border: 1px solid var(--line); }
.pill.on { color: var(--ok); border-color: rgba(61, 220, 132, 0.45); background: rgba(61, 220, 132, 0.1); }
.pill.off { color: #ffb15c; border-color: rgba(255, 177, 92, 0.45); background: rgba(255, 177, 92, 0.1); }
:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }
</style>
