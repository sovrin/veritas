import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

// aequitas is consumed from its built dist/ in the sibling checkout. Run `pnpm build` there first.
const root = dirname(fileURLToPath(import.meta.url))
const aequitas = resolve(root, process.env.AEQUITAS_DIST ?? '../aequitas/dist') + '/'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    // NUXT_ADMIN_PASSWORD: the one password for the admin UI. Empty disables sign-in.
    adminPassword: '',
    // NUXT_DB_URL: where content lives. A local SQLite file by default; a libsql:// or https:// URL for Turso/libsql server.
    dbUrl: 'file:.data/veritas.db',
    // NUXT_DB_TOKEN: auth token for a remote database.
    dbToken: '',
    // NUXT_TRUST_PROXY=true: rate-limit by X-Forwarded-For. Only behind a proxy that sets it.
    trustProxy: false,
  },
  routeRules: {
    '/**': { headers: { 'Referrer-Policy': 'no-referrer', 'X-Content-Type-Options': 'nosniff' } },
  },
  css: [`${aequitas}aequitas.css`, `${aequitas}aequitas.icons.css`, '~/assets/app.css'],
  alias: { '@aequitas': aequitas },
  app: {
    head: {
      // data-ae-manual: importing aequitas.js (toast, setTheme) must not run its DOM-scanning init.
      // Stateful pieces are explicit Vue components in app/components/ae/ instead.
      htmlAttrs: { lang: 'en', 'data-ae-manual': '' },
      title: 'veritas',
      meta: [{ name: 'description', content: 'A very simple headless CMS.' }],
    },
  },
  vite: { server: { fs: { allow: [root, resolve(aequitas, '..')] } } },
})
