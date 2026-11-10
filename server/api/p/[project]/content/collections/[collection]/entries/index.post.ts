import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { newEntrySchema, readFields } from '#self/shared/contracts'
import { createEntry, getEntry } from '#self/server/core/content'
import { checkFiles, routeCollection, projectSpace } from '#self/server/utils/veritas'

export default defineEventHandler(async (event) => {
  const { project } = projectSpace(event)
  const collection = routeCollection(event, project.id)
  const body = newEntrySchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  const read = readFields(collection, body.data.fields)
  if ('issues' in read) throw invalid(read.issues)
  const fileIssues = checkFiles(project.id, collection, read.fields)
  if (fileIssues.length) throw invalid(fileIssues)
  const db = nexitasDatabase()
  if (!createEntry(db, project.id, collection.slug, { ...body.data, fields: read.fields }))
    throw createError({ statusCode: 409, statusMessage: 'An entry with this slug exists already.' })
  announceChange()
  setResponseStatus(event, 201)
  return getEntry(db, project.id, collection.slug, body.data.slug)
})
