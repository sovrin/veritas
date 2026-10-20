export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  await deleteCollection(project.slug, collection.slug)
  setResponseStatus(event, 204)
})
