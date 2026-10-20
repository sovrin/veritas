/** Renames the project and/or rotates its token. The slug is its address and never changes. */
export default defineEventHandler(async (event) => {
  const project = await requireProject(event)
  const body = await readBody<{ name?: unknown; rotateToken?: unknown }>(event)

  if (body?.name !== undefined) {
    if (typeof body.name !== 'string' || !body.name.trim()) throw createError({ statusCode: 400, statusMessage: 'Name is required' })
    project.name = body.name.trim()
  }
  if (body?.rotateToken === true) project.token = newToken()

  await updateProject(project)
  return project
})
