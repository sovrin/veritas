import type { Entry } from '#shared/types/cms'

/** Replaces the content of an existing entry. Its slug is its address and stays as it is. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  const slug = slugParam(event, 'slug')
  if (!(await getEntry(project.slug, collection.slug, slug))) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })

  const entry: Entry = { collection: collection.slug, slug, ...readEntryInput(await readBody(event), collection), updatedAt: new Date().toISOString() }
  await updateEntry(project.slug, entry)
  return entry
})
