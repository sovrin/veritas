import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { summarizeEntries } from '../../../../../core/content'
import { routeCollection, routeSpace } from '../../../../../utils/veritas'

/** The collection, and its entries without their fields, newest first. */
export default defineEventHandler((event) => {
  const { project } = routeSpace(event)
  const collection = routeCollection(event, project.id)
  return {
    ...collection,
    entries: summarizeEntries(nexitasDatabase(), project.id, collection.slug),
  }
})
