// A project's content: its delivery token, its collections and their entries. A project's content
// owns its collections, a collection its entries; deleting one deletes what it owns (foreign keys
// cascade, see module.ts).
import { randomBytes } from 'node:crypto'
import type { DatabaseSync } from 'node:sqlite'
import type {
  Collection,
  CollectionSettings,
  CollectionSummary,
  Entry,
  EntrySummary,
} from '../../shared/contracts'

/** A read token for the delivery API. Shown to the owner, so it is kept as it is. */
export const newToken = () => `vt_${randomBytes(24).toString('base64url')}`

// ── A project's content

export function getSpace(db: DatabaseSync, projectId: string) {
  return (
    (db
      .prepare('SELECT project_id, token FROM content_projects WHERE project_id = ?')
      .get(projectId) as { project_id: string; token: string } | undefined) ?? null
  )
}

/** Starts content for a project. False when it has content already. */
export function createSpace(db: DatabaseSync, projectId: string, now = Date.now()) {
  return (
    db
      .prepare(
        'INSERT OR IGNORE INTO content_projects (project_id, token, created_at) VALUES (?, ?, ?)',
      )
      .run(projectId, newToken(), now).changes === 1
  )
}

/** A new token; the old one stops working at once. */
export function rotateToken(db: DatabaseSync, projectId: string) {
  db.prepare('UPDATE content_projects SET token = ? WHERE project_id = ?').run(
    newToken(),
    projectId,
  )
}

/** Deletes a project's content: every collection and entry in it. */
export function deleteSpace(db: DatabaseSync, projectId: string) {
  db.prepare('DELETE FROM content_projects WHERE project_id = ?').run(projectId)
}

// ── Collections

interface CollectionRow {
  slug: string
  name: string
  fields: string
}

const toCollection = (row: CollectionRow): Collection => ({
  slug: row.slug,
  name: row.name,
  fields: JSON.parse(row.fields),
})

/** A project's collections by name, each with its entries counted. */
export function listCollections(db: DatabaseSync, projectId: string): CollectionSummary[] {
  const rows = db
    .prepare(
      `SELECT c.slug, c.name, c.fields,
        (SELECT COUNT(*) FROM entries e WHERE e.project_id = c.project_id AND e.collection = c.slug) AS entries,
        (SELECT COUNT(*) FROM entries e WHERE e.project_id = c.project_id AND e.collection = c.slug AND e.published) AS published
      FROM collections c WHERE c.project_id = ? ORDER BY c.name, c.slug`,
    )
    .all(projectId) as unknown as (CollectionRow & { entries: number; published: number })[]
  return rows.map((row) => ({
    ...toCollection(row),
    entries: row.entries,
    published: row.published,
  }))
}

export function getCollection(db: DatabaseSync, projectId: string, slug: string) {
  const row = db
    .prepare('SELECT slug, name, fields FROM collections WHERE project_id = ? AND slug = ?')
    .get(projectId, slug) as CollectionRow | undefined
  return row ? toCollection(row) : null
}

/** False when the project has a collection with this slug already. */
export function createCollection(
  db: DatabaseSync,
  projectId: string,
  collection: Collection,
  now = Date.now(),
) {
  return (
    db
      .prepare(
        `INSERT OR IGNORE INTO collections (project_id, slug, name, fields, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(projectId, collection.slug, collection.name, JSON.stringify(collection.fields), now, now)
      .changes === 1
  )
}

export function updateCollection(
  db: DatabaseSync,
  projectId: string,
  slug: string,
  settings: CollectionSettings,
  now = Date.now(),
) {
  db.prepare(
    'UPDATE collections SET name = ?, fields = ?, updated_at = ? WHERE project_id = ? AND slug = ?',
  ).run(settings.name, JSON.stringify(settings.fields), now, projectId, slug)
}

/** Deletes the collection and its entries. */
export function deleteCollection(db: DatabaseSync, projectId: string, slug: string) {
  db.prepare('DELETE FROM collections WHERE project_id = ? AND slug = ?').run(projectId, slug)
}

// ── Entries

interface EntryRow {
  slug: string
  title: string
  fields: string
  published: number
  updated_at: number
}

const toEntry = (row: EntryRow): Entry => ({
  slug: row.slug,
  title: row.title,
  fields: JSON.parse(row.fields),
  published: Boolean(row.published),
  updatedAt: row.updated_at,
})

/** Newest first. `publishedOnly` gives what the API may deliver. */
export function listEntries(
  db: DatabaseSync,
  projectId: string,
  collection: string,
  publishedOnly = false,
): Entry[] {
  const rows = db
    .prepare(
      `SELECT slug, title, fields, published, updated_at FROM entries
      WHERE project_id = ? AND collection = ? ${publishedOnly ? 'AND published' : ''}
      ORDER BY updated_at DESC, slug`,
    )
    .all(projectId, collection) as unknown as EntryRow[]
  return rows.map(toEntry)
}

/** The collection's entries for its list in the admin, without their fields. */
export const summarizeEntries = (
  db: DatabaseSync,
  projectId: string,
  collection: string,
): EntrySummary[] =>
  listEntries(db, projectId, collection).map(({ fields: _fields, ...summary }) => summary)

export function getEntry(db: DatabaseSync, projectId: string, collection: string, slug: string) {
  const row = db
    .prepare(
      `SELECT slug, title, fields, published, updated_at FROM entries
      WHERE project_id = ? AND collection = ? AND slug = ?`,
    )
    .get(projectId, collection, slug) as EntryRow | undefined
  return row ? toEntry(row) : null
}

/** False when the collection has an entry with this slug already. */
export function createEntry(
  db: DatabaseSync,
  projectId: string,
  collection: string,
  entry: Omit<Entry, 'updatedAt'>,
  now = Date.now(),
) {
  return (
    db
      .prepare(
        `INSERT OR IGNORE INTO entries
        (project_id, collection, slug, title, fields, published, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        projectId,
        collection,
        entry.slug,
        entry.title,
        JSON.stringify(entry.fields),
        entry.published ? 1 : 0,
        now,
        now,
      ).changes === 1
  )
}

export function updateEntry(
  db: DatabaseSync,
  projectId: string,
  collection: string,
  entry: Omit<Entry, 'updatedAt'>,
  now = Date.now(),
) {
  db.prepare(
    `UPDATE entries SET title = ?, fields = ?, published = ?, updated_at = ?
    WHERE project_id = ? AND collection = ? AND slug = ?`,
  ).run(
    entry.title,
    JSON.stringify(entry.fields),
    entry.published ? 1 : 0,
    now,
    projectId,
    collection,
    entry.slug,
  )
}

export function deleteEntry(db: DatabaseSync, projectId: string, collection: string, slug: string) {
  db.prepare('DELETE FROM entries WHERE project_id = ? AND collection = ? AND slug = ?').run(
    projectId,
    collection,
    slug,
  )
}

/** The fields whose type a change would alter: a saved field keeps its type, so stored values
 *  always match what the API promises. */
export function changedTypes(before: Collection, after: CollectionSettings) {
  const types = new Map(before.fields.map((field) => [field.key, field.type]))
  return after.fields.filter((field) => types.has(field.key) && types.get(field.key) !== field.type)
}
