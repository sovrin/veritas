// veritas as a nexitas module: its schema, the read-only delivery API sites and build steps call,
// and what it says about a project. The owner's sign-in, the /api guard and the projects are the
// core's.
import type { H3Event } from 'h3'
import type { NexitasModule } from '#nexitas/shared/modules'
import { deleteSpace, getSpace, listCollections } from './content'

export const veritas: NexitasModule = {
  id: 'veritas',
  migrations: [
    // A project's content holds its read token; it owns its collections, a collection its entries.
    // Keys are slugs, so they never change.
    `CREATE TABLE content_projects (
      project_id TEXT PRIMARY KEY REFERENCES projects(id), token TEXT NOT NULL,
      created_at INTEGER NOT NULL
    ) WITHOUT ROWID;
    CREATE TABLE collections (
      project_id TEXT NOT NULL REFERENCES content_projects(project_id) ON DELETE CASCADE,
      slug TEXT NOT NULL, name TEXT NOT NULL, fields TEXT NOT NULL,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      PRIMARY KEY (project_id, slug)
    ) WITHOUT ROWID;
    CREATE TABLE entries (
      project_id TEXT NOT NULL, collection TEXT NOT NULL, slug TEXT NOT NULL,
      title TEXT NOT NULL, fields TEXT NOT NULL, published INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL,
      PRIMARY KEY (project_id, collection, slug),
      FOREIGN KEY (project_id, collection) REFERENCES collections(project_id, slug) ON DELETE CASCADE
    ) WITHOUT ROWID;
    CREATE INDEX entries_newest ON entries(project_id, collection, updated_at);`,
  ],
  // Read by sites, apps and build steps anywhere, with the project's token instead of a cookie.
  publicRoutes: [
    { path: /^\/v1\/content\/([a-z0-9-]+)(?:\/[a-z0-9-]+){0,2}$/, json: true, guard: cors },
  ],
  // Everything veritas serves; switched off, all of it answers 404.
  paths: ['/content', '/api/content'],
  // An entry is mostly text; a long one can pass 64 kB.
  maxBody: 1024 * 1024,
  projectStatus: (db, projectId) => {
    if (!getSpace(db, projectId)) return []
    const collections = listCollections(db, projectId)
    const published = collections.reduce((sum, collection) => sum + collection.published, 0)
    const entries = collections.reduce((sum, collection) => sum + collection.entries, 0)
    return [
      {
        text: `${collections.length} ${collections.length === 1 ? 'collection' : 'collections'}`,
        to: `/p/${projectId}/content`,
      },
      { text: `${published} of ${entries} published` },
    ]
  },
  deleteProject: (db, projectId) => deleteSpace(db, projectId),
}

/** Any origin may read: the token, not a cookie, decides. Preflights are answered here. */
function cors(event: H3Event) {
  setHeaders(event, { 'Access-Control-Allow-Origin': '*', Vary: 'Origin' })
  if (event.method === 'OPTIONS') {
    setHeaders(event, {
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'authorization',
      'Access-Control-Max-Age': '600',
    })
    setResponseStatus(event, 204)
    return ''
  }
  if (event.method !== 'GET' && event.method !== 'HEAD')
    throw createError({ statusCode: 405, statusMessage: 'The content API only reads.' })
}
