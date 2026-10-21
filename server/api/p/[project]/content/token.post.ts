import { announceChange } from '#nexitas/server/utils/changes'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { rotateToken } from '../../../../core/content'
import { projectSpace } from '../../../../utils/veritas'

/** Replaces the read token; the old one stops working at once. */
export default defineEventHandler((event) => {
  rotateToken(nexitasDatabase(), projectSpace(event).project.id)
  announceChange()
  return { ok: true }
})
