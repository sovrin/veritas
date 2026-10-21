import { announceChange } from '#nexitas/server/utils/changes'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { deleteEntry } from '../../../../../../../../core/content'
import { routeCollection, routeEntry, projectSpace } from '../../../../../../../../utils/veritas'

export default defineEventHandler((event) => {
  const { project } = projectSpace(event)
  const collection = routeCollection(event, project.id)
  deleteEntry(
    nexitasDatabase(),
    project.id,
    collection.slug,
    routeEntry(event, project.id, collection.slug).slug,
  )
  announceChange()
  return { ok: true }
})
