import type { H3Event } from 'h3'
import { createLimiter } from '#nexitas/server/core/limits'
import { getProject } from '#nexitas/server/core/projects'
import {
  capability,
  nexitasDatabase,
  nexitasOrigin,
  requestSender,
} from '#nexitas/server/utils/nexitas'
import { requestProject } from '#nexitas/server/utils/projects'
import { requireBearer } from '#nexitas/server/utils/auth'
import {
  FIELD_NEEDS,
  FIELD_TYPES,
  deliveredFile,
  isSlug,
  type Collection,
  type Field,
} from '#self/shared/contracts'
import { getCollection, getEntry, getSpace } from '#self/server/core/content'

/** A route parameter that must be a slug. Anything else cannot exist, so it is a 404. */
function slugParam(event: H3Event, name: string) {
  const value = getRouterParam(event, name)
  if (!isSlug(value)) throw createError({ statusCode: 404, statusMessage: 'Not found.' })
  return value
}

/** The request's project with its content, or a 404: the panel and the content page read that as
 *  not started yet. */
export function projectSpace(event: H3Event) {
  const project = requestProject(event)
  const space = getSpace(nexitasDatabase(), project.id)
  if (!space) throw createError({ statusCode: 404, statusMessage: 'This project has no content.' })
  return { project, token: space.token }
}

export function routeCollection(event: H3Event, projectId: string) {
  const collection = getCollection(nexitasDatabase(), projectId, slugParam(event, 'collection'))
  if (!collection)
    throw createError({ statusCode: 404, statusMessage: 'There is no such collection.' })
  return collection
}

export function routeEntry(event: H3Event, projectId: string, collection: string) {
  const entry = getEntry(nexitasDatabase(), projectId, collection, slugParam(event, 'slug'))
  if (!entry) throw createError({ statusCode: 404, statusMessage: 'There is no such entry.' })
  return entry
}

// Generous for a site's build, which reads every entry at once; it only stops a flood.
const perSender = createLimiter(600, 60 * 1000)

/** The project of a delivery request, if its bearer token matches. An unknown project and a wrong
 *  token look the same. */
export function requireToken(event: H3Event) {
  if (!perSender.hit(requestSender(event)))
    throw createError({ statusCode: 429, statusMessage: 'Too many requests. Try again later.' })
  const db = nexitasDatabase()
  const id = getRouterParam(event, 'project') ?? ''
  requireBearer(event, getSpace(db, id)?.token)
  return getProject(db, id)!
}

/** What the API delivers for a file field's id: the project's file from whichever module provides
 *  files, or null while none does or the file is gone. */
export function fileReader(projectId: string) {
  const files = capability('files')
  const db = nexitasDatabase()
  const origin = nexitasOrigin()
  return (id: string) => {
    const file = files?.get(db, projectId, id)
    return file ? deliveredFile(origin, file) : null
  }
}

/** Checks an entry's file fields: a file must be one of the project's own. While nothing provides
 *  files, nothing can check a new value, so a file field keeps what it held (`before`). */
export function checkFiles(
  projectId: string,
  collection: Pick<Collection, 'fields'>,
  fields: Record<string, unknown>,
  before: Record<string, unknown> = {},
) {
  const files = capability('files')
  const issues: { path: string; message: string }[] = []
  for (const field of collection.fields) {
    if (FIELD_NEEDS[field.type] !== 'files') continue
    const id = fields[field.key]
    if (!files) fields[field.key] = before[field.key] ?? null
    else if (typeof id === 'string' && !files.get(nexitasDatabase(), projectId, id))
      issues.push({ path: `fields.${field.key}`, message: "Pick one of this project's files." })
  }
  return issues
}

/** New fields of a type whose capability no switched-on module provides. A saved field stays. */
export function unavailableFields(fields: Field[], before?: Pick<Collection, 'fields'>) {
  const saved = new Set(before?.fields.map((field) => field.key))
  return fields.flatMap((field, index) => {
    const needs = FIELD_NEEDS[field.type]
    if (!needs || saved.has(field.key) || capability(needs)) return []
    return [
      {
        path: `fields.${index}.type`,
        message: `${FIELD_TYPES[field.type]} fields need a module that provides ${needs}. Switch one on under Modules.`,
      },
    ]
  })
}
