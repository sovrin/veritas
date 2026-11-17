import { requireBearer } from '#nexitas/server/utils/auth'
import { announceChange } from '#nexitas/server/utils/changes'
import { answerMcp } from '#nexitas/server/utils/mcp'
import { capability, nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { getSpace } from '#self/server/core/content'
import { contentTools, instructions } from '#self/server/core/tools'

/** The project's content for an assistant, over MCP, with the project's MCP token. An unknown
 *  project, MCP switched off and a wrong token look the same. */
export default defineEventHandler((event) => {
  const db = nexitasDatabase()
  const id = getRouterParam(event, 'project') ?? ''
  requireBearer(event, getSpace(db, id)?.mcpToken ?? undefined)
  return answerMcp(event, {
    name: 'veritas',
    instructions,
    tools: contentTools(db, id, { files: capability('files') }, announceChange),
  })
})
