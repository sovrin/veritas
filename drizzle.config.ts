import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  dialect: 'sqlite',
  casing: 'snake_case',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
})
