import { createHash } from 'node:crypto'
import type { H3Event } from 'h3'

/**
 * One admin, one password (NUXT_ADMIN_PASSWORD). The session is a sealed cookie whose key is derived from that
 * password, so changing the password signs everyone out.
 */
export function adminSession(event: H3Event) {
  const { adminPassword } = useRuntimeConfig()
  return useSession<{ admin?: boolean }>(event, {
    name: 'veritas',
    password: createHash('sha256').update(`veritas-session:${adminPassword}`).digest('hex'),
    maxAge: 60 * 60 * 12,
    cookie: { httpOnly: true, sameSite: 'strict', secure: !import.meta.dev },
  })
}

export async function isAdmin(event: H3Event): Promise<boolean> {
  if (!useRuntimeConfig().adminPassword) return false
  return Boolean((await adminSession(event)).data.admin)
}
