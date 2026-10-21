import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { entryInputSchema, readFields } from '../../../../../../../../../shared/contracts'
import { getEntry, updateEntry } from '../../../../../../../../core/content'
import { routeCollection, routeEntry, projectSpace } from '../../../../../../../../utils/veritas'

/** A new title, values and status. The slug stays: the API addresses the entry by it. */
export default defineEventHandler(async (event) => {
  const { project } = projectSpace(event)
  const collection = routeCollection(event, project.id)
  const { slug } = routeEntry(event, project.id, collection.slug)
  const body = entryInputSchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  const read = readFields(collection, body.data.fields)
  if ('issues' in read) throw invalid(read.issues)
  const db = nexitasDatabase()
  updateEntry(db, project.id, collection.slug, { ...body.data, slug, fields: read.fields })
  announceChange()
  return getEntry(db, project.id, collection.slug, slug)
})
