import { announceChange } from '#nexitas/server/utils/changes'
import { invalid } from '#nexitas/server/utils/invalid'
import { nexitasDatabase } from '#nexitas/server/utils/nexitas'
import { collectionSettingsSchema } from '../../../../../../../shared/contracts'
import { changedTypes, getCollection, updateCollection } from '../../../../../../core/content'
import { invalidFields, routeCollection, projectSpace } from '../../../../../../utils/veritas'

/** A new name and field list. A saved field keeps its type; removing one stops its delivery. */
export default defineEventHandler(async (event) => {
  const { project } = projectSpace(event)
  const collection = routeCollection(event, project.id)
  const body = collectionSettingsSchema.safeParse(await readBody(event))
  if (!body.success) throw invalid(body.error)
  const changed = changedTypes(collection, body.data)
  if (changed.length)
    throw invalidFields(
      changed.map((field) => ({
        path: `fields.${body.data.fields.indexOf(field)}.type`,
        message: `"${field.key}" keeps its type once saved. Add a field with a new key instead.`,
      })),
    )
  const db = nexitasDatabase()
  updateCollection(db, project.id, collection.slug, body.data)
  announceChange()
  return getCollection(db, project.id, collection.slug)
})
