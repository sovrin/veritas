export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  const entry = await getEntry(project.slug, collection.slug, slugParam(event, 'slug'))
  if (!entry) throw createError({ statusCode: 404, statusMessage: 'Entry not found' })
  return entry
})
