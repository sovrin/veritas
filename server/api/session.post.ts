export default defineEventHandler(async (event) => {
  rateLimit(event, 'login', 10)
  const { adminPassword } = useRuntimeConfig()
  if (!adminPassword) throw createError({ statusCode: 503, statusMessage: 'Set NUXT_ADMIN_PASSWORD to enable sign-in' })

  const body = await readBody<{ password?: unknown }>(event)
  if (typeof body?.password !== 'string' || !safeEqual(body.password, adminPassword))
    throw createError({ statusCode: 401, statusMessage: 'Wrong password' })

  await (await adminSession(event)).update({ admin: true })
  return { admin: true }
})
