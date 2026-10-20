import { createHash } from 'node:crypto'

// Inline <script> without src. Everything is hashed, including the import map, except JSON payloads: those are data, not code.
const INLINE_SCRIPT = /<script(?![^>]*\ssrc=)([^>]*)>([\s\S]*?)<\/script>/gi
const JSON_TYPE = /\stype=["']application\/(ld\+)?json["']/

/**
 * Content-Security-Policy for rendered pages. Only scripts from this origin may run, plus the inline
 * runtime-config snippet and import map Nuxt emits, allowed by their hashes. Entries hold arbitrary text, so this is what
 * limits the damage of any markup that ever slips through into the admin.
 */
export default defineNitroPlugin((nitro) => {
  // Vite's dev client and devtools inject their own inline scripts and sockets; the policy is a production concern.
  if (import.meta.dev) return

  nitro.hooks.hook('render:html', (html, { event }) => {
    const hashes = new Set<string>()
    for (const part of [...html.head, ...html.bodyPrepend, ...html.body, ...html.bodyAppend]) {
      for (const [, attrs, code] of part.matchAll(INLINE_SCRIPT)) {
        if (JSON_TYPE.test(attrs)) continue
        hashes.add(`'sha256-${createHash('sha256').update(code).digest('base64')}'`)
      }
    }
    setResponseHeader(event, 'Content-Security-Policy', [
      "default-src 'self'",
      ['script-src', "'self'", ...hashes].join(' '),
      "style-src 'self'",
      "img-src 'self' data:",
      "connect-src 'self'",
      "object-src 'none'",
      "base-uri 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
    ].join('; '))
  })
})
