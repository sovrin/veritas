import { routeCollection, routeEntry, routeSpace } from '../../../../../../../utils/veritas'

export default defineEventHandler((event) => {
  const { project } = routeSpace(event)
  return routeEntry(event, project.id, routeCollection(event, project.id).slug)
})
