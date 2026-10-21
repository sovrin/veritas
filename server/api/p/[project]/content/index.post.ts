import { announceChange } from '#nexitas/server/utils/changes'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { requestProject } from '#nexitas/server/utils/projects'
import { createSpace } from '../../../../core/content'

/** Starts content for the project: a read token, and room for collections. */
export default defineEventHandler((event) => {
  const project = requestProject(event)
  if (!createSpace(nexitasDatabase(), project.id))
    throw createError({ statusCode: 409, statusMessage: 'This project has content already.' })
  announceChange()
  setResponseStatus(event, 201)
  return { projectId: project.id }
})
