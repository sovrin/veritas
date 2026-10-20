import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { and, asc, count, desc, eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { Collection, Entry, Field, Project } from '#shared/types/cms'
import { coerce, emptyValue, FIELD_EXPECTS, FIELD_KEY, FIELD_TYPES, RESERVED_KEYS } from '#shared/utils/fields'
import { isSlug } from '#shared/utils/slug'
import { collections, entries, projects } from '../db/schema'

// Projects own collections, collections own entries (see server/db/schema.ts). Deletes cascade down that chain.

const fail = (statusCode: number, statusMessage: string) => createError({ statusCode, statusMessage })
const strip = <T extends { project?: string }>({ project, ...rest }: T) => rest

// ── Projects

export const newToken = () => `vt_${randomBytes(24).toString('base64url')}`

export const listProjects = async (): Promise<Project[]> =>
  (await useDb()).select().from(projects).orderBy(asc(projects.name))

export const getProject = async (slug: string): Promise<Project | undefined> =>
  (await useDb()).query.projects.findFirst({ where: eq(projects.slug, slug) })

export const insertProject = async (p: Project) => { await (await useDb()).insert(projects).values(p) }

export const updateProject = async (p: Project) => {
  await (await useDb()).update(projects).set({ name: p.name, token: p.token }).where(eq(projects.slug, p.slug))
}

export const deleteProject = async (slug: string) => { await (await useDb()).delete(projects).where(eq(projects.slug, slug)) }

// ── Collections

/** A project's collections by name, each with its number of entries. */
export async function listCollections(project: string): Promise<(Collection & { entries: number })[]> {
  const db = await useDb()
  const [rows, counts] = await Promise.all([
    db.select().from(collections).where(eq(collections.project, project)).orderBy(asc(collections.name)),
    db.select({ collection: entries.collection, n: count() }).from(entries).where(eq(entries.project, project)).groupBy(entries.collection),
  ])
  const n = new Map(counts.map(c => [c.collection, c.n]))
  return rows.map(c => ({ ...strip(c), entries: n.get(c.slug) ?? 0 }))
}

export async function getCollection(project: string, slug: string): Promise<Collection | undefined> {
  const row = await (await useDb()).query.collections.findFirst({ where: and(eq(collections.project, project), eq(collections.slug, slug)) })
  return row && strip(row)
}

export const insertCollection = async (project: string, c: Collection) => {
  await (await useDb()).insert(collections).values({ project, ...c })
}

export const updateCollection = async (project: string, c: Collection) => {
  await (await useDb()).update(collections).set({ name: c.name, fields: c.fields })
    .where(and(eq(collections.project, project), eq(collections.slug, c.slug)))
}

export const deleteCollection = async (project: string, slug: string) => {
  await (await useDb()).delete(collections).where(and(eq(collections.project, project), eq(collections.slug, slug)))
}

/** Validates a collection's name and field list. Keys must be unique, usable in code, and not shadow an entry's own keys. */
export function readCollectionInput(body: any): Pick<Collection, 'name' | 'fields'> {
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) throw fail(400, 'Name is required')
  if (!Array.isArray(body.fields) || body.fields.length > 50) throw fail(400, 'Fields must be a list of at most 50')

  const seen = new Set<string>()
  const fields: Field[] = body.fields.map((f: any) => {
    const label = typeof f?.label === 'string' ? f.label.trim() : ''
    if (!label) throw fail(400, 'Every field needs a label')
    if (typeof f.key !== 'string' || !FIELD_KEY.test(f.key)) throw fail(400, `"${label}" needs a key in camelCase, like heroImage`)
    if (RESERVED_KEYS.includes(f.key)) throw fail(400, `"${f.key}" is built in. Pick another key for "${label}"`)
    if (seen.has(f.key)) throw fail(400, `Two fields use the key "${f.key}"`)
    if (!(f.type in FIELD_TYPES)) throw fail(400, `"${label}" has an unknown type`)
    seen.add(f.key)
    return { key: f.key, label, type: f.type }
  })
  return { name, fields }
}

// ── Entries

const entryIs = (project: string, collection: string, slug: string) =>
  and(eq(entries.project, project), eq(entries.collection, collection), eq(entries.slug, slug))

/** Newest first. Pass `published` to get only what the API may deliver. */
export async function listEntries(project: string, collection: string, published?: boolean): Promise<Entry[]> {
  const where = [eq(entries.project, project), eq(entries.collection, collection)]
  if (published) where.push(eq(entries.published, true))
  const rows = await (await useDb()).select().from(entries).where(and(...where)).orderBy(desc(entries.updatedAt))
  return rows.map(strip)
}

export async function getEntry(project: string, collection: string, slug: string): Promise<Entry | undefined> {
  const row = await (await useDb()).query.entries.findFirst({ where: entryIs(project, collection, slug) })
  return row && strip(row)
}

export const insertEntry = async (project: string, e: Entry) => { await (await useDb()).insert(entries).values({ project, ...e }) }

export const updateEntry = async (project: string, e: Entry) => {
  await (await useDb()).update(entries).set({ title: e.title, fields: e.fields, published: e.published, updatedAt: e.updatedAt })
    .where(entryIs(project, e.collection, e.slug))
}

export const deleteEntry = async (project: string, collection: string, slug: string) => {
  await (await useDb()).delete(entries).where(entryIs(project, collection, slug))
}

/** Validates the editable part of an entry against its collection. Keys the collection doesn't define are dropped. */
export function readEntryInput(body: any, collection: Collection): Pick<Entry, 'title' | 'fields' | 'published'> {
  if (typeof body?.title !== 'string' || !body.title.trim()) throw fail(400, 'Title is required')
  const fields: Record<string, unknown> = {}
  for (const f of collection.fields) {
    const value = coerce(f.type, body.fields?.[f.key])
    if (value === undefined) throw fail(400, `"${f.label}" must be ${FIELD_EXPECTS[f.type]}`)
    fields[f.key] = value
  }
  return { title: body.title.trim(), fields, published: Boolean(body.published) }
}

/** An entry as the API delivers it: flat, with exactly the collection's current fields. */
export function deliver(entry: Entry, collection: Collection) {
  const out: Record<string, unknown> = { slug: entry.slug, title: entry.title }
  for (const f of collection.fields) out[f.key] = entry.fields[f.key] ?? emptyValue(f.type)
  out.updatedAt = entry.updatedAt
  return out
}

// ── Request helpers

/** A route parameter that must be a slug. Anything else cannot exist, so it is a 404. */
export function slugParam(event: H3Event, name: string): string {
  const value = getRouterParam(event, name)
  if (!isSlug(value)) throw fail(404, 'Not found')
  return value
}

export async function requireProject(event: H3Event): Promise<Project> {
  const project = await getProject(slugParam(event, 'project'))
  if (!project) throw fail(404, 'Project not found')
  return project
}

export async function requireCollection(event: H3Event, project: Project): Promise<Collection> {
  const collection = await getCollection(project.slug, slugParam(event, 'collection'))
  if (!collection) throw fail(404, 'Collection not found')
  return collection
}

/** The project of a delivery request, if its bearer token matches. Unknown project and wrong token look the same. */
export async function requireToken(event: H3Event): Promise<Project> {
  const project = await getProject(slugParam(event, 'project'))
  const token = getRequestHeader(event, 'authorization')?.replace(/^Bearer\s+/i, '') ?? ''
  if (!project || !safeEqual(token, project.token)) {
    setResponseHeader(event, 'WWW-Authenticate', 'Bearer')
    throw fail(401, 'Invalid token')
  }
  return project
}

/** Compares secrets in constant time, whatever their lengths. */
export function safeEqual(a: string, b: string): boolean {
  const h = (s: string) => createHash('sha256').update(s).digest()
  return timingSafeEqual(h(a), h(b))
}
