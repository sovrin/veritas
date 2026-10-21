import { routeCollection, routeEntry, projectSpace } from '../../../../../../../../utils/veritas'

export default defineEventHandler((event) => {
  const { project } = projectSpace(event)
  return routeEntry(event, project.id, routeCollection(event, project.id).slug)
})
