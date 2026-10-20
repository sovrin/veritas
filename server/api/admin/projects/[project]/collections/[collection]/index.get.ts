export default defineEventHandler(async event => requireCollection(event, await requireProject(event)))
