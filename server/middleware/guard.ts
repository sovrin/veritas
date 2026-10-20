// The admin API edits content and needs the session. A single entry is small, so anything near a megabyte is a mistake.
const MAX_BODY_BYTES = 1024 * 1024

// The delivery API is read by other origins: sites, apps and build steps. It is authenticated by a bearer token, not a cookie,
// so any origin may call it.
const CORS = { origin: '*', methods: ['GET', 'OPTIONS'], allowHeaders: ['authorization'] } as const

export default defineEventHandler(async (event) => {
  const path = event.path

  if (path.startsWith('/api/v1/')) {
    handleCors(event, CORS)
    return
  }

  if (path.startsWith('/api/admin/')) {
    if (!(await isAdmin(event))) throw createError({ statusCode: 401, statusMessage: 'Sign in first' })
    if (Number(getRequestHeader(event, 'content-length')) > MAX_BODY_BYTES)
      throw createError({ statusCode: 413, statusMessage: 'Too large' })
  }
})
