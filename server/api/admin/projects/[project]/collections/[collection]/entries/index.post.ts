import type { Entry } from '#shared/types/cms'
import { isSlug } from '#shared/utils/slug'

export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  const body = await readBody(event)
  if (!isSlug(body?.slug)) throw createError({ statusCode: 400, statusMessage: 'Slug may hold a–z, 0–9 and dashes' })
  if (await getEntry(project.slug, collection.slug, body.slug))
    throw createError({ statusCode: 409, statusMessage: `${collection.name} already has an entry with this slug` })

  const entry: Entry = { collection: collection.slug, slug: body.slug, ...readEntryInput(body, collection), updatedAt: new Date().toISOString() }
  await insertEntry(project.slug, entry)
  setResponseStatus(event, 201)
  return entry
})
