/** Published entries of one collection, newest first. */
export default defineEventHandler(async (event) => {
  const project = await requireToken(event)
  const collection = await requireCollection(event, project)
  return (await listEntries(project.slug, collection.slug, true)).map(e => deliver(e, collection))
})
