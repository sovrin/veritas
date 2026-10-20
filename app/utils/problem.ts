/** One sentence for a failed $fetch: the server's own message, or why there is none. */
export function problem(e: any): string {
  if (e?.statusCode === 429) return 'Too many attempts. Wait a moment and try again.'
  if (e?.statusMessage) return `${e.statusMessage}.`
  if (e?.statusCode) return 'The server could not do that. Try again in a moment.'
  return 'The server is unreachable. Check your connection and try again.'
}
