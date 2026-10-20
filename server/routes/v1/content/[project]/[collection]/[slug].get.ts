import { deliver } from '../../../../../../shared/contracts'
import { requireToken, routeCollection, routeEntry } from '../../../../../utils/veritas'

/** One published entry. A draft is a 404, as if it were not there. */
export default defineEventHandler((event) => {
  const project = requireToken(event)
  const collection = routeCollection(event, project.id)
  const entry = routeEntry(event, project.id, collection.slug)
  if (!entry.published)
    throw createError({ statusCode: 404, statusMessage: 'There is no such entry.' })
  return deliver(entry, collection)
})
