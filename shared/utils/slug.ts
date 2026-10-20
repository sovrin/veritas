/** Projects, collections and entries are all addressed by slugs: safe in URLs and as storage keys. */
export const SLUG = /^[a-z0-9](?:[a-z0-9\-]{0,62}[a-z0-9])?$/

export const isSlug = (s: unknown): s is string => typeof s === 'string' && SLUG.test(s)

/** "Hello, World!" → "hello-world" */
export function slugify(s: string): string {
  return s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
    .replace(/-+$/, '')
}

