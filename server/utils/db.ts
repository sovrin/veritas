import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { migrate } from 'drizzle-orm/libsql/migrator'
import * as schema from '../db/schema'

function connect() {
  // NUXT_DB_URL: a local file (default) or a libsql/Turso URL. NUXT_DB_TOKEN: its auth token, for remote ones.
  const { dbUrl, dbToken } = useRuntimeConfig()
  if (dbUrl.startsWith('file:')) mkdirSync(dirname(resolve(dbUrl.slice(5))), { recursive: true })
  const client = createClient({ url: dbUrl, authToken: dbToken || undefined })
  return drizzle(client, { schema, casing: 'snake_case' })
}

let ready: Promise<ReturnType<typeof connect>> | undefined

/** The database, migrated to the current schema on first use. Migrations are read from server/db/migrations,
 *  relative to the working directory. */
export function useDb() {
  ready ??= (async () => {
    const db = connect()
    await db.run('PRAGMA foreign_keys = ON')
    await migrate(db, { migrationsFolder: resolve('server/db/migrations') })
    return db
  })()
  return ready
}
