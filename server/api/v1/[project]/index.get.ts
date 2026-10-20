/** The project and its collections: their fields, and how many published entries each serves. */
export default defineEventHandler(async (event) => {
  const project = await requireToken(event)
  const collections = await Promise.all((await listCollections(project.slug)).map(async c => ({
    slug: c.slug,
    name: c.name,
    fields: c.fields.map(({ key, type }) => ({ key, type })),
    entries: (await listEntries(project.slug, c.slug, true)).length,
  })))
  return { slug: project.slug, name: project.name, collections }
})
