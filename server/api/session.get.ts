export default defineEventHandler(async event => ({ admin: await isAdmin(event) }))
