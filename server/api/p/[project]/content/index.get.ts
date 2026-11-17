import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import type { ContentSpace } from '#self/shared/contracts'
import { listCollections } from '#self/server/core/content'
import { projectSpace } from '#self/server/utils/veritas'

export default defineEventHandler((event): ContentSpace => {
  const { project, token, mcpToken } = projectSpace(event)
  return {
    projectId: project.id,
    name: project.name,
    token,
    mcpToken,
    collections: listCollections(nexitasDatabase(), project.id),
  }
})
