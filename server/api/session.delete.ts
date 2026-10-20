export default defineEventHandler(async (event) => {
  await (await adminSession(event)).clear()
  return { admin: false }
})
