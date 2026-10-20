import type { Project } from '#shared/types/cms'
import { isSlug } from '#shared/utils/slug'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: unknown; slug?: unknown }>(event)
  const name = typeof body?.name === 'string' ? body.name.trim() : ''
  if (!name) throw createError({ statusCode: 400, statusMessage: 'Name is required' })
  if (!isSlug(body?.slug)) throw createError({ statusCode: 400, statusMessage: 'Slug may hold a–z, 0–9 and dashes' })
  if (await getProject(body.slug)) throw createError({ statusCode: 409, statusMessage: 'Slug is taken' })

  const project: Project = { slug: body.slug, name, token: newToken(), createdAt: new Date().toISOString() }
  await insertProject(project)
  setResponseStatus(event, 201)
  return project
})
