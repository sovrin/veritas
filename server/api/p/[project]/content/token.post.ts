import { announceChange } from '#nexitas/server/utils/changes'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { rotateToken } from '#self/server/core/content'
import { projectSpace } from '#self/server/utils/veritas'

/** Replaces the read token; the old one stops working at once. */
export default defineEventHandler((event) => {
  rotateToken(nexitasDatabase(), projectSpace(event).project.id)
  announceChange()
  return { ok: true }
})
