import { announceChange } from '#nexitas/server/utils/changes'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { deleteCollection } from '../../../../../core/content'
import { routeCollection, routeSpace } from '../../../../../utils/veritas'

/** Deletes the collection with every entry in it. */
export default defineEventHandler((event) => {
  const { project } = routeSpace(event)
  deleteCollection(nexitasDatabase(), project.id, routeCollection(event, project.id).slug)
  announceChange()
  return { ok: true }
})
