import { getProject } from '#nexitas/server/core/projects'
import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { newSpaceSchema } from '../../../shared/contracts'
import { createSpace } from '../../core/content'

/** Starts content for a project: a read token, and room for collections. */
export default defineEventHandler(async (event) => {
  const body = newSpaceSchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  const db = nexitasDatabase()
  if (!getProject(db, body.data.projectId))
    throw createError({ statusCode: 404, statusMessage: 'There is no such project.' })
  if (!createSpace(db, body.data.projectId))
    throw createError({ statusCode: 409, statusMessage: 'This project has content already.' })
  announceChange()
  setResponseStatus(event, 201)
  return { projectId: body.data.projectId }
})
