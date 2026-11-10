import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { deliver, selectFields } from '#self/shared/contracts'
import { listEntries } from '#self/server/core/content'
import { fileReader, requireToken, routeCollection } from '#self/server/utils/veritas'

/** Published entries of one collection, newest first; `?fields=title,date` delivers only those. */
export default defineEventHandler((event) => {
  const project = requireToken(event)
  const collection = routeCollection(event, project.id)
  const { only, unknown } = selectFields(
    [getQuery(event).fields ?? ''].flat().join(','),
    collection,
  )
  // A typo would otherwise quietly deliver nothing for that key.
  if (unknown.length)
    throw createError({ statusCode: 400, statusMessage: `No such field: ${unknown.join(', ')}.` })
  const file = fileReader(project.id)
  return listEntries(nexitasDatabase(), project.id, collection.slug, true).map((entry) =>
    deliver(entry, collection, file, only),
  )
})
