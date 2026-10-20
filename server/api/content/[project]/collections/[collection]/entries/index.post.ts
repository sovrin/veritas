import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { newEntrySchema, readFields } from '../../../../../../../shared/contracts'
import { createEntry, getEntry } from '../../../../../../core/content'
import { invalidFields, routeCollection, routeSpace } from '../../../../../../utils/veritas'

export default defineEventHandler(async (event) => {
  const { project } = routeSpace(event)
  const collection = routeCollection(event, project.id)
  const body = newEntrySchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  const read = readFields(collection, body.data.fields)
  if ('issues' in read) throw invalidFields(read.issues)
  const db = nexitasDatabase()
  if (!createEntry(db, project.id, collection.slug, { ...body.data, fields: read.fields }))
    throw createError({ statusCode: 409, statusMessage: 'An entry with this slug exists already.' })
  announceChange()
  setResponseStatus(event, 201)
  return getEntry(db, project.id, collection.slug, body.data.slug)
})
