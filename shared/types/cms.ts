import type { FieldType } from '#shared/utils/fields'

/** A tenant: one site or app. Its collections, entries and read token are its own. */
export type Project = {
  slug: string
  name: string
  /** Bearer token for the delivery API. */
  token: string
  createdAt: string
}

/** One input on an entry's form, and one key in what the API delivers. */
export type Field = { key: string; label: string; type: FieldType }

/** A kind of content, such as Posts or Pages. Its fields decide what every entry in it holds. */
export type Collection = {
  slug: string
  name: string
  fields: Field[]
  createdAt: string
}

/** One piece of content. Addressed by project, collection and slug, which never change after creation. */
export type Entry = {
  collection: string
  slug: string
  title: string
  /** Values for the collection's fields, by key. */
  fields: Record<string, unknown>
  /** Drafts are visible in the admin only. */
  published: boolean
  updatedAt: string
}
