import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { newCollectionSchema } from '../../../../../../shared/contracts'
import { createCollection } from '../../../../../core/content'
import { projectSpace } from '../../../../../utils/veritas'

export default defineEventHandler(async (event) => {
  const { project } = projectSpace(event)
  const body = newCollectionSchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  if (!createCollection(nexitasDatabase(), project.id, body.data))
    throw createError({
      statusCode: 409,
      statusMessage: 'A collection with this slug exists already.',
    })
  announceChange()
  setResponseStatus(event, 201)
  return body.data
})
