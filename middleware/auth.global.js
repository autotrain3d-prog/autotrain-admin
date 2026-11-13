// Only the signed-in admins can open the admin pages. The sign-in page and the forgot-password page are open.
const OPEN = ['/login', '/forgot-password']

export default defineNuxtRouteMiddleware(async to => {
  if (OPEN.includes(to.path)) return
  try {
    const headers = import.meta.server ? useRequestHeaders(['cookie']) : undefined
    const res = await $fetch('/api/auth/me', { headers })
    if (res && res.user) return
  } catch (e) { /* not signed in */ }
  return navigateTo('/login')
})
