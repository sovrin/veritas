import { foreignKey, integer, primaryKey, sqliteTable, text } from 'drizzle-orm/sqlite-core'
import type { Field } from '#shared/types/cms'

// Three tables, nested by key: a project owns its collections, a collection owns its entries.
// Deleting a row deletes what it owns (foreign keys cascade).

export const projects = sqliteTable('projects', {
  slug: text().primaryKey(),
  name: text().notNull(),
  token: text().notNull(),
  createdAt: text().notNull(),
})

export const collections = sqliteTable('collections', {
  project: text().notNull().references(() => projects.slug, { onDelete: 'cascade' }),
  slug: text().notNull(),
  name: text().notNull(),
  fields: text({ mode: 'json' }).$type<Field[]>().notNull(),
  createdAt: text().notNull(),
}, t => [primaryKey({ columns: [t.project, t.slug] })])

export const entries = sqliteTable('entries', {
  project: text().notNull(),
  collection: text().notNull(),
  slug: text().notNull(),
  title: text().notNull(),
  fields: text({ mode: 'json' }).$type<Record<string, unknown>>().notNull(),
  published: integer({ mode: 'boolean' }).notNull().default(false),
  updatedAt: text().notNull(),
}, t => [
  primaryKey({ columns: [t.project, t.collection, t.slug] }),
  foreignKey({ columns: [t.project, t.collection], foreignColumns: [collections.project, collections.slug] }).onDelete('cascade'),
])
