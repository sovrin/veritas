import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { mcpAccessSchema } from '#self/shared/contracts'
import { setMcpAccess } from '#self/server/core/content'
import { projectSpace } from '#self/server/utils/veritas'

/** Lets assistants edit the content over MCP with a new token, or stops them. */
export default defineEventHandler(async (event) => {
  const body = mcpAccessSchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  setMcpAccess(nexitasDatabase(), projectSpace(event).project.id, body.data.on)
  announceChange()
  return { ok: true }
})
