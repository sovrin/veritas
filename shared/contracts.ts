// Every rule about what veritas accepts lives here, shared by the admin pages and the server. The
// owner's sign-in and the projects are nexitas'.
import { z } from 'zod'

/** Collections and entries are addressed by slugs: safe in URLs, and never changed once made. */
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/
export const isSlug = (value: unknown): value is string =>
  typeof value === 'string' && SLUG.test(value)
export const slugSchema = z.string().regex(SLUG, 'Use a–z, 0–9 and dashes, not at either end.')

/** "Hello, World!" → "hello-world" */
export function slugify(text: string) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '')
}

/** The kinds of field a collection can have, with the name the admin shows for each. */
export const FIELD_TYPES = {
  text: 'Text',
  markdown: 'Markdown',
  number: 'Number',
  boolean: 'Yes / no',
  date: 'Date',
} as const
export type FieldType = keyof typeof FIELD_TYPES

/** How an error names what a field takes. */
const FIELD_EXPECTS: Record<FieldType, string> = {
  text: 'text',
  markdown: 'text',
  number: 'a number',
  boolean: 'on or off',
  date: 'a date',
}

/** Field keys are what API consumers type: camelCase, starting with a letter. */
export const FIELD_KEY = /^[a-z][a-zA-Z0-9]{0,39}$/
/** Every delivered entry has these already, so no field may take their name. */
export const RESERVED_KEYS = ['slug', 'title', 'collection', 'updatedAt', 'published']

/** "Hero image" → "heroImage" */
export function fieldKey(label: string) {
  const words =
    label
      .normalize('NFKD')
      .replace(/\p{M}/gu, '')
      .toLowerCase()
      .match(/[a-z0-9]+/g) ?? []
  return words
    .map((word, index) => (index ? word[0]!.toUpperCase() + word.slice(1) : word))
    .join('')
    .replace(/^[0-9]+/, '')
    .slice(0, 40)
}

export const fieldSchema = z
  .object({
    key: z
      .string()
      .regex(FIELD_KEY, 'Use camelCase, like heroImage.')
      .refine((key) => !RESERVED_KEYS.includes(key), 'Every entry has this already; pick another.'),
    label: z.string().trim().min(1, 'Give the field a label.').max(60),
    type: z.enum(Object.keys(FIELD_TYPES) as [FieldType, ...FieldType[]]),
  })
  .strict()
export type Field = z.infer<typeof fieldSchema>

/** What can change about a collection: its name and fields. A field's key and type are fixed once
 *  saved, so what is stored always matches what the API promises. */
export const collectionSettingsSchema = z
  .object({
    name: z.string().trim().min(1, 'Give the collection a name.').max(60),
    fields: z
      .array(fieldSchema)
      .max(50)
      .refine(
        (fields) => new Set(fields.map((field) => field.key)).size === fields.length,
        'Each key once.',
      ),
  })
  .strict()
export const newCollectionSchema = collectionSettingsSchema.extend({ slug: slugSchema }).strict()
export type CollectionSettings = z.infer<typeof collectionSettingsSchema>

/** A kind of content, such as Posts or Pages. Its fields decide what every entry in it holds. */
export interface Collection extends CollectionSettings {
  slug: string
}

/** The editable part of an entry; its fields are checked against the collection (readFields). */
export const entryInputSchema = z
  .object({
    title: z.string().trim().min(1, 'Give the entry a title.').max(200),
    fields: z.record(z.string(), z.unknown()).default({}),
    published: z.boolean(),
  })
  .strict()
export const newEntrySchema = entryInputSchema.extend({ slug: slugSchema }).strict()

/** One piece of content. Drafts are seen in the admin only. */
export interface Entry {
  slug: string
  title: string
  /** Values for the collection's fields, by key. */
  fields: Record<string, unknown>
  published: boolean
  updatedAt: number
}

/** What an entry holds for a field nobody has filled in yet. */
export function emptyValue(type: FieldType): unknown {
  return type === 'number' ? null : type === 'boolean' ? false : ''
}

/** The value as the field's type stores it, or undefined when it cannot be one. */
export function coerce(type: FieldType, value: unknown): unknown {
  if (value === undefined || value === null) return emptyValue(type)
  switch (type) {
    case 'text':
    case 'markdown':
      return typeof value === 'string' ? value : undefined
    case 'number':
      if (value === '') return null
      return typeof value === 'number' && Number.isFinite(value) ? value : undefined
    case 'boolean':
      return typeof value === 'boolean' ? value : undefined
    case 'date':
      return value === '' || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
        ? value
        : undefined
  }
}

/** The values for exactly the collection's fields, or the problem with each that does not fit.
 *  Keys the collection does not define are dropped. */
export function readFields(
  collection: Pick<Collection, 'fields'>,
  values: Record<string, unknown>,
): { fields: Record<string, unknown> } | { issues: { path: string; message: string }[] } {
  const fields: Record<string, unknown> = {}
  const issues: { path: string; message: string }[] = []
  for (const field of collection.fields) {
    const value = coerce(field.type, values[field.key])
    if (value === undefined)
      issues.push({ path: `fields.${field.key}`, message: `Enter ${FIELD_EXPECTS[field.type]}.` })
    else fields[field.key] = value
  }
  return issues.length ? { issues } : { fields }
}

/** An entry as the API delivers it: flat, with exactly the collection's current fields. */
export function deliver(entry: Entry, collection: Pick<Collection, 'fields'>) {
  const out: Record<string, unknown> = { slug: entry.slug, title: entry.title }
  for (const field of collection.fields)
    out[field.key] = entry.fields[field.key] ?? emptyValue(field.type)
  out.updatedAt = new Date(entry.updatedAt).toISOString()
  return out
}

/** A collection on the admin's lists: its entries counted, all and published. */
export interface CollectionSummary extends Collection {
  entries: number
  published: number
}

/** An entry on a collection's list, without its fields. */
export type EntrySummary = Omit<Entry, 'fields'>

/** A project's content: its delivery token and its collections. */
export interface ContentSpace {
  projectId: string
  name: string
  token: string
  collections: CollectionSummary[]
}
