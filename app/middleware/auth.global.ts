/** Everything but the sign-in page needs the admin session. */
export default defineNuxtRouteMiddleware(async (to) => {
  const admin = useAdmin()
  if (admin.value === undefined) {
    // On the server this forwards the browser's cookie; in the browser it is a plain fetch.
    admin.value = (await useRequestFetch()('/api/session')).admin
  }
  if (!admin.value && to.path !== '/login') return navigateTo('/login')
  if (admin.value && to.path === '/login') return navigateTo('/')
})
