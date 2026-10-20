export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  await deleteProject(project.slug)
  setResponseStatus(event, 204)
})
