import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { deliver } from '../../../../../../shared/contracts'
import { listEntries } from '../../../../../core/content'
import { fileReader, requireToken, routeCollection } from '../../../../../utils/veritas'

/** Published entries of one collection, newest first. */
export default defineEventHandler((event) => {
  const project = requireToken(event)
  const collection = routeCollection(event, project.id)
  const file = fileReader(project.id)
  return listEntries(nexitasDatabase(), project.id, collection.slug, true).map((entry) =>
    deliver(entry, collection, file),
  )
})
