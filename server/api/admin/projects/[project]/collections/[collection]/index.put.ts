/** Renames the collection and replaces its fields. Values of removed fields stay stored but are no longer delivered. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  const updated = { ...collection, ...readCollectionInput(await readBody(event)) }
  await updateCollection(project.slug, updated)
  return updated
})
