// What an assistant can do with a project's content over MCP: read the collections and their
// entries, make and change collections, and write entries. Publishing stays the owner's, on the
// Content page, and so does deleting a collection.
import type { DatabaseSync } from 'node:sqlite'
import { z } from 'zod'
import { transaction } from '#nexitas/server/core/database'
import type { Capabilities } from '#nexitas/shared/capabilities'
import { tool } from '#nexitas/server/utils/mcp'
import {
  collectionSettingsSchema,
  entryInputSchema,
  newCollectionSchema,
  readFields,
  slugSchema,
  type Collection,
} from '#self/shared/contracts'
import { checkFiles, unavailableFields } from '#self/server/utils/veritas'
import {
  changedTypes,
  createCollection,
  createEntry,
  deleteEntry,
  getCollection,
  getEntry,
  listCollections,
  listEntries,
  updateCollection,
  updateEntry,
} from './content'

const MAX_ENTRIES = 100

export const instructions = `veritas holds this project's content: collections (such as posts or pages), each with fields of a type (text, markdown, number, boolean, date, list, image, file), and entries in them with a value per field.
Slugs and field keys are addresses sites read: once saved they never change, and a field keeps its type.
Entries you make are drafts; nothing new reaches a site until the owner publishes it on the Content page. A change to a published entry shows on sites at once.`

const iso = (ms: number | null) => (ms ? new Date(ms).toISOString() : undefined)

/** The project's tools, each bound to it. `changed` runs after a write, to tell open pages. */
export function contentTools(
  db: DatabaseSync,
  projectId: string,
  provided: Partial<Capabilities> = {},
  changed = () => {},
) {
  const collection = (slug: string): Collection => {
    const found = getCollection(db, projectId, slug)
    if (!found) throw new Error(`There is no collection ${slug}. list_collections names them.`)
    return found
  }
  const problems = (issues: { path: string; message: string }[], at = '') =>
    new Error(issues.map((issue) => `${at}${issue.path}: ${issue.message}`).join('\n'))

  return [
    tool({
      name: 'list_collections',
      description:
        "The project's collections: each one's slug, name and fields (key, label, type), and its entries counted, all and published.",
      input: z.object({}),
      run: () =>
        listCollections(db, projectId).map((found) => ({
          slug: found.slug,
          name: found.name,
          fields: found.fields,
          entries: found.entries,
          published: found.published,
          updatedAt: iso(found.updatedAt),
        })),
    }),
    tool({
      name: 'list_entries',
      description:
        "A collection's fields and its entries, newest first: each one's slug, title, whether it is published and when it was saved. With `fields`, each entry's values too.",
      input: z.object({
        collection: slugSchema,
        state: z.enum(['all', 'drafts', 'published']).default('all'),
        fields: z.boolean().default(false).describe("Include each entry's field values"),
      }),
      run: ({ collection: slug, state, fields }) => {
        const found = collection(slug)
        const entries = listEntries(db, projectId, slug).filter(
          (entry) => state === 'all' || entry.published === (state === 'published'),
        )
        return {
          slug,
          name: found.name,
          fields: found.fields,
          entries: entries.map((entry) => ({
            slug: entry.slug,
            title: entry.title,
            published: entry.published,
            updatedAt: iso(entry.updatedAt),
            ...(fields ? { fields: entry.fields } : {}),
          })),
        }
      },
    }),
    tool({
      name: 'get_entry',
      description: 'One entry: its title, its value for every field, and whether it is published.',
      input: z.object({ collection: slugSchema, slug: slugSchema }),
      run: ({ collection: slug, slug: entrySlug }) => {
        collection(slug)
        const entry = getEntry(db, projectId, slug, entrySlug)
        if (!entry) throw new Error(`${slug} has no entry ${entrySlug}.`)
        return { ...entry, updatedAt: iso(entry.updatedAt) }
      },
    }),
    tool({
      name: 'create_collection',
      description:
        "Makes a collection with its fields. The slug and each field key are addresses sites read: they never change. Keys are camelCase; slug, title, collection, updatedAt and published are every entry's already. Image and file fields need a module that provides files.",
      input: newCollectionSchema,
      run: (input) => {
        const unavailable = unavailableFields(provided, input.fields)
        if (unavailable.length) throw problems(unavailable)
        if (!createCollection(db, projectId, input))
          throw new Error(`There is a collection ${input.slug} already.`)
        changed()
        return input
      },
    }),
    tool({
      name: 'update_collection',
      description:
        'Gives a collection a new name and field list. Send every field it keeps: a field left out is removed, with its value in every entry. A saved field keeps its key and type; add a field with a new key instead. Labels may change.',
      input: collectionSettingsSchema.extend({ collection: slugSchema }).strict(),
      run: ({ collection: slug, ...settings }) => {
        const before = collection(slug)
        const retyped = changedTypes(before, settings)
        if (retyped.length)
          throw new Error(
            `${retyped.map((field) => field.key).join(', ')} keep their type once saved. Add a field with a new key instead.`,
          )
        const unavailable = unavailableFields(provided, settings.fields, before)
        if (unavailable.length) throw problems(unavailable)
        updateCollection(db, projectId, slug, settings)
        changed()
        return {
          ...collection(slug),
          removed: before.fields
            .filter((field) => !settings.fields.some((kept) => kept.key === field.key))
            .map((field) => field.key),
        }
      },
    }),
    tool({
      name: 'save_entries',
      description: `Creates entries in a collection and changes them, up to ${MAX_ENTRIES} at a time, all or none. A new entry needs a title and is a draft. An entry that exists keeps the title and the field values you leave out, and whether it is published: a published one changes on sites at once. Values follow the field's type: text and markdown a string, number a number, boolean true or false, date "YYYY-MM-DD", list an array of strings, image and file the id of one of the project's files.`,
      input: z.object({
        collection: slugSchema,
        entries: z
          .array(
            z.object({
              slug: slugSchema,
              title: entryInputSchema.shape.title.optional(),
              fields: z.record(z.string(), z.unknown()).default({}),
            }),
          )
          .min(1)
          .max(MAX_ENTRIES)
          .refine(
            (entries) => new Set(entries.map((entry) => entry.slug)).size === entries.length,
            'Each slug once.',
          ),
      }),
      run: ({ collection: slug, entries }) => {
        const found = collection(slug)
        // Every entry checked before any is written, so a failure leaves nothing half saved.
        const ready = entries.map((input) => {
          const before = getEntry(db, projectId, slug, input.slug)
          const title = input.title ?? before?.title
          if (!title) throw new Error(`${input.slug}: a new entry needs a title.`)
          const read = readFields(found, { ...before?.fields, ...input.fields })
          if ('issues' in read) throw problems(read.issues, `${input.slug}: `)
          const fileIssues = checkFiles(
            db,
            provided.files,
            projectId,
            found,
            read.fields,
            before?.fields,
          )
          if (fileIssues.length) throw problems(fileIssues, `${input.slug}: `)
          const entry = {
            slug: input.slug,
            title,
            fields: read.fields,
            published: before?.published ?? false,
          }
          return { entry, created: !before }
        })
        transaction(db, () => {
          for (const { entry, created } of ready)
            if (created) createEntry(db, projectId, slug, entry)
            else updateEntry(db, projectId, slug, entry)
        })
        changed()
        return ready.map(({ entry, created }) => ({
          slug: entry.slug,
          saved: created ? 'created' : 'updated',
          published: entry.published,
        }))
      },
    }),
    tool({
      name: 'delete_entries',
      description: `Deletes entries from a collection, up to ${MAX_ENTRIES} at a time; a deleted entry cannot be brought back, and a published one is gone from sites at once.`,
      input: z.object({
        collection: slugSchema,
        slugs: z.array(slugSchema).min(1).max(MAX_ENTRIES),
      }),
      run: ({ collection: slug, slugs }) => {
        collection(slug)
        const deleted = slugs.filter((entry) => getEntry(db, projectId, slug, entry))
        for (const entry of deleted) deleteEntry(db, projectId, slug, entry)
        if (deleted.length) changed()
        return { deleted, notFound: slugs.filter((entry) => !deleted.includes(entry)) }
      },
    }),
  ]
}
