import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { listCollections } from '../../../../core/content'
import { requireToken } from '../../../../utils/veritas'

/** The project and its collections: their fields, and how many published entries each serves. */
export default defineEventHandler((event) => {
  const project = requireToken(event)
  return {
    slug: project.id,
    name: project.name,
    collections: listCollections(nexitasDatabase(), project.id).map((collection) => ({
      slug: collection.slug,
      name: collection.name,
      fields: collection.fields.map(({ key, type }) => ({ key, type })),
      entries: collection.published,
    })),
  }
})
