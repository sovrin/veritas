export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  await deleteEntry(project.slug, collection.slug, slugParam(event, 'slug'))
  setResponseStatus(event, 204)
})
