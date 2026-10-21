import { announceChange } from '#nexitas/server/utils/changes'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { deleteCollection } from '../../../../../../core/content'
import { routeCollection, projectSpace } from '../../../../../../utils/veritas'

/** Deletes the collection with every entry in it. */
export default defineEventHandler((event) => {
  const { project } = projectSpace(event)
  deleteCollection(nexitasDatabase(), project.id, routeCollection(event, project.id).slug)
  announceChange()
  return { ok: true }
})
