// Every page needs a signed-in admin, except the login page.
export default defineNuxtRouteMiddleware(async to => {
  const { admin, ready, refresh } = useAdmin()
  if (!ready.value) await refresh()
  if (!admin.value && to.path !== '/login') return navigateTo('/login')
  if (admin.value && to.path === '/login') return navigateTo('/')
})
