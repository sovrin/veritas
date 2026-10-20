/** All entries of a collection, drafts included, newest first. With their fields: the admin shows them as table columns. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const collection = await requireCollection(event, project)
  return listEntries(project.slug, collection.slug)
})
