import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { summarizeEntries } from '#self/server/core/content'
import { routeCollection, projectSpace } from '#self/server/utils/veritas'

/** The collection, and its entries without their fields, newest first. */
export default defineEventHandler((event) => {
  const { project } = projectSpace(event)
  const collection = routeCollection(event, project.id)
  return {
    ...collection,
    entries: summarizeEntries(nexitasDatabase(), project.id, collection.slug),
  }
})
