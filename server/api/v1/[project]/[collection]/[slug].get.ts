export default defineEventHandler(async (event) => {
  const project = await requireToken(event)
  const collection = await requireCollection(event, project)
  const entry = await getEntry(project.slug, collection.slug, slugParam(event, 'slug'))
  if (!entry?.published) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  return deliver(entry, collection)
})
