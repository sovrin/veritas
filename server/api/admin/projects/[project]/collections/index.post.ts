import type { Collection } from '#shared/types/cms'
import { isSlug } from '#shared/utils/slug'

export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const body = await readBody(event)
  if (!isSlug(body?.slug)) throw createError({ statusCode: 400, statusMessage: 'Slug may hold a–z, 0–9 and dashes' })
  if (await getCollection(project.slug, body.slug)) throw createError({ statusCode: 409, statusMessage: 'A collection with this slug exists' })

  const collection: Collection = { slug: body.slug, ...readCollectionInput(body), createdAt: new Date().toISOString() }
  await insertCollection(project.slug, collection)
  setResponseStatus(event, 201)
  return collection
})
