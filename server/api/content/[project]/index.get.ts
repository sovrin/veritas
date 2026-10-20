import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import type { ContentSpace } from '../../../../shared/contracts'
import { listCollections } from '../../../core/content'
import { routeSpace } from '../../../utils/veritas'

export default defineEventHandler((event): ContentSpace => {
  const { project, token } = routeSpace(event)
  return {
    projectId: project.id,
    name: project.name,
    token,
    collections: listCollections(nexitasDatabase(), project.id),
  }
})
