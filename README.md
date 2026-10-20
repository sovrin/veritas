# veritas

A very simple headless CMS. Model your content in collections, write entries in the admin, read them anywhere through a JSON API.

- **Projects** are separate spaces, one per site or app. Each has its own collections, entries and API token.
- **Collections** are kinds of content (Posts, Pages, Team members). Each defines the fields its entries have.
- **Entries** always have a title and a slug, plus the collection's fields. They are drafts until published.
- **Storage** is SQLite through [Drizzle](https://orm.drizzle.team): a single file, `.data/veritas.db`, by default.

## Run it

```bash
(cd ../aequitas && pnpm build)
cp .env.example .env   # then set NUXT_ADMIN_PASSWORD
npm install
npm run dev
```

Sign in at <http://localhost:3000>. The database is created and migrated on first use.

## Using the admin

Laid out like PocketBase: collections on the left, the open collection as a table (one row per entry, one column per
field), and a panel that slides in over the table to edit. You land in the project you used last.

| To | Do |
| --- | --- |
| Add a collection | *New collection* under the collections in the sidebar. Name it, add fields by type. |
| Change a collection's fields | The gear next to its name. |
| Write an entry | *New entry*, top right. |
| Edit an entry | Click its row. Esc or a click beside the panel closes it (it asks first if you have unsaved changes). |
| See what the API returns | *API preview*, top right, for the collection; the *API preview* tab in an entry for that entry. |
| Get the API token | *API & settings* at the bottom of the sidebar. |
| Switch or add projects | The project name at the top of the sidebar. |

### Field types

| Type | Delivered as |
| --- | --- |
| Text | string |
| Markdown | string, as written; rendering is the consumer's job |
| Number | number or `null` |
| Yes / no | boolean |
| Date | `"YYYY-MM-DD"` or `""` |

A field's key (camelCase, like `heroImage`) is the name the API uses. Key and type are fixed once saved, so stored
values always match what the API promises. Removing a field stops it being delivered.

## Delivery API

Read-only. Only published entries. Every request needs the project's token.
Any origin may call it (CORS `*`).

```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/api/v1/<project>/<collection>
```

| Request | Returns |
| --- | --- |
| `GET /api/v1/:project` | `{ slug, name, collections: [{ slug, name, fields: [{ key, type }], entries }] }` |
| `GET /api/v1/:project/:collection` | Published entries, newest first |
| `GET /api/v1/:project/:collection/:slug` | One entry |

An entry is flat: its slug and title, then one key per field, then when it last changed.

```json
{
  "slug": "hello-world",
  "title": "Hello, world",
  "excerpt": "The first post.",
  "body": "# Hi\n\nFirst post.",
  "publishedOn": "2026-10-06",
  "featured": true,
  "updatedAt": "2026-10-06T13:47:29.294Z"
}
```

`401` means the token is wrong or the project doesn't exist. `404` means the entry doesn't exist or isn't published.

## Admin API

The admin UI uses it, and so can scripts holding a session cookie (`POST /api/session` with `{ "password": "…" }`).
All paths start with `/api/admin/projects`.

| Request | Does |
| --- | --- |
| `GET · POST /` | List projects · create one `{ name, slug }` |
| `GET · PATCH · DELETE /:project` | Read · rename `{ name }` or replace the token `{ rotateToken: true }` · delete with everything in it |
| `GET · POST /:project/collections` | List collections (with entry counts) · create one `{ name, slug, fields: [{ key, label, type }] }` |
| `GET · PUT · DELETE /:project/collections/:collection` | Read · replace name and fields · delete with its entries |
| `GET · POST /:project/collections/:collection/entries` | List entries (without fields) · create one `{ slug, title, fields, published }` |
| `GET · PUT · DELETE /:project/collections/:collection/entries/:slug` | Read · replace `{ title, fields, published }` · delete |

Slugs are `a–z`, `0–9` and dashes. They are addresses, so they never change.

## Database

The schema is [server/db/schema.ts](server/db/schema.ts): `projects` → `collections` → `entries`, with deletes cascading
down. After changing it, generate a migration and commit it:

```bash
npm run db:generate
```

Migrations in `server/db/migrations` run automatically on startup, read relative to the working directory.

## Deployment

| Variable | Effect |
| --- | --- |
| `NUXT_ADMIN_PASSWORD` | The one admin password. Unset, nobody can sign in. Changing it signs everyone out. |
| `NUXT_DB_URL` | Default `file:.data/veritas.db`. A `libsql://` or `https://` URL uses a libsql server or Turso instead. |
| `NUXT_DB_TOKEN` | Auth token for a remote database. |
| `NUXT_TRUST_PROXY` | `true` to rate-limit sign-in by `X-Forwarded-For`. Set it only behind a proxy that overwrites that header. |

With the default file database, keep `.data/` on a volume and start the server from the project directory.

## Not in the PoC

Users and roles, media uploads, references between entries, single-entry collections (a homepage), versions,
search in the API, pagination, webhooks.

## UI

Styled with [aequitas](../aequitas), consumed from its built `dist/` in the sibling checkout.
Build it once before running this app, or point `AEQUITAS_DIST` at another `dist/` directory.
