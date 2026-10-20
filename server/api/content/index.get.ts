import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { listSpaces } from '../../core/content'

/** Every project with content, with how much each holds. */
export default defineEventHandler(() => listSpaces(nexitasDatabase()))
