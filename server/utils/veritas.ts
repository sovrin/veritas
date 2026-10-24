import type { H3Event } from 'h3'
import { createLimiter } from '#nexitas/server/core/limits'
import { getProject } from '#nexitas/server/core/projects'
import { nexitasDatabase, requestSender } from '#nexitas/server/utils/nexitas'
import { requestProject } from '#nexitas/server/utils/projects'
import { requireBearer } from '#nexitas/server/utils/auth'
import { isSlug } from '../../shared/contracts'
import { getCollection, getEntry, getSpace } from '../core/content'

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
