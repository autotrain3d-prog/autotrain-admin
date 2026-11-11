// Who is signed in. The page asks the server (the cookie is HttpOnly, so the page cannot read it).
export const useAdmin = () => {
  const admin = useState('admin', () => null)
  const ready = useState('admin-ready', () => false)

  async function refresh() {
    try {
      const res = await $fetch('/api/auth/me')
      admin.value = res.admin
    } catch (e) { admin.value = null }
    ready.value = true
  }
  async function logout() {
    try { await $fetch('/api/auth/logout', { method: 'POST' }) } catch (e) { /* the cookie is gone anyway */ }
    admin.value = null
    await navigateTo('/login')
  }
  return { admin, ready, refresh, logout }
}
