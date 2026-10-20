import type { H3Event } from 'h3'

type Bucket = { count: number; resetAt: number }
const buckets = new Map<string, Bucket>()

setInterval(() => {
  const now = Date.now()
  for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
}, 60_000).unref()

/** Fixed-window limit per client IP and scope. Throws 429 once `max` requests fall inside one window. */
export function rateLimit(event: H3Event, scope: string, max: number, windowMs = 60_000) {
  // Per-process. Behind several instances each one counts separately, which only loosens the limit.
  const { trustProxy } = useRuntimeConfig()
  const ip = getRequestIP(event, { xForwardedFor: Boolean(trustProxy) }) ?? 'unknown'
  const key = `${scope}:${ip}`
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  if (++bucket.count > max) {
    setResponseHeader(event, 'Retry-After', String(Math.ceil((bucket.resetAt - now) / 1000)))
    throw createError({ statusCode: 429, statusMessage: 'Too many requests' })
  }
}
