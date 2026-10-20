/** The project's collections, each with its number of entries. */
export default defineEventHandler(async event => listCollections((await requireProject(event)).slug))
