# veritas

A very simple headless CMS. Model your content in collections, write entries, read them anywhere
through a JSON API.

**veritas is a module for [nexitas](https://github.com/sovrin/nexitas), not an app of its own.** It
ships inside nexitas, which builds it in from its `modules.json`, and an install's owner switches
it on as Content. To use it, install nexitas. nexitas brings the sign-in, the page shell, the
database and the projects (each site's name and origins); veritas adds:

- **content per project**: a project's collections, their entries, and a read token for its sites;
- the admin pages under Content: collections, entries, their fields and the API;
- a Content panel on each project's page: start its content, see how much is published;
- the delivery API, read by sites, apps and build steps.

## How it fits together

```
site or build ── GET /v1/content/<project>                     → its collections and fields
               ── GET /v1/content/<project>/<collection>        → published entries, newest first
               ── GET /v1/content/<project>/<collection>/<slug> → one published entry
owner         ── /content                                       every project's content (signed in)
               ── /content/<project>                             collections, the token and API
               ── /content/<project>/<collection>               entries; Fields; New entry
```

- **Collections** are kinds of content (Posts, Pages, Team members). Each defines the fields its
  entries have.
- **Entries** always have a title and a slug, plus the collection's fields. They are drafts until
  published.

### Field types

| Type     | Delivered as                                        |
| -------- | --------------------------------------------------- |
| Text     | string                                              |
| Markdown | string, as written; rendering is the consumer's job |
| Number   | number or `null`                                    |
| Yes / no | boolean                                             |
| Date     | `"YYYY-MM-DD"` or `""`                              |

A field's key (camelCase, like `heroImage`) is the name the API uses. Key and type are fixed once
saved, so stored values always match what the API promises. Removing a field stops it being
delivered. Collection and entry slugs are `a–z`, `0–9` and dashes; they are addresses, so they
never change.

## Delivery API

Read-only. Only published entries. Every request needs the project's token, which its Content page
shows (and can replace). Any origin may call it.

```bash
curl -H "Authorization: Bearer $TOKEN" https://nexitas.example.com/v1/content/<project>/<collection>
```

| Request                                      | Returns                                                                           |
| -------------------------------------------- | --------------------------------------------------------------------------------- |
| `GET /v1/content/:project`                   | `{ slug, name, collections: [{ slug, name, fields: [{ key, type }], entries }] }` |
| `GET /v1/content/:project/:collection`       | Published entries, newest first                                                   |
| `GET /v1/content/:project/:collection/:slug` | One entry                                                                         |

An entry is flat: its slug and title, then one key per field, then when it last changed.

```json
{
  "slug": "hello-world",
  "title": "Hello, world",
  "body": "# Hi\n\nFirst post.",
  "publishedOn": "2026-10-21",
  "featured": true,
  "updatedAt": "2026-10-21T13:47:29.294Z"
}
```

`401` means the token is wrong or the project has no content. `404` means the collection or entry
doesn't exist or isn't published. While Content is switched off, every route answers `404`.

## Admin API

The admin pages use it, under the owner's session; writes come from nexitas' own origin, like every
`/api` route. All paths start with `/api/content`.

| Request                                                          | Does                                                     |
| ---------------------------------------------------------------- | -------------------------------------------------------- |
| `GET · POST /`                                                   | Projects with content · start it for one `{ projectId }` |
| `GET /:project` · `POST /:project/token`                         | Its token and collections · replace the token            |
| `POST /:project/collections`                                     | Add one `{ slug, name, fields: [{ key, label, type }] }` |
| `GET · POST /:project/collections/:collection` · `POST …/delete` | Read with entries · replace name and fields · delete     |
| `POST /:project/collections/:collection/entries`                 | Add one `{ slug, title, fields, published }`             |
| `GET · POST …/entries/:slug` · `POST …/entries/:slug/delete`     | Read · replace `{ title, fields, published }` · delete   |

Deleting a project in nexitas deletes its content with it.

## Develop

veritas has no app, build or image of its own: it runs inside nexitas. Check out nexitas, aequitas
and veritas next to each other, build aequitas once (`cd ../aequitas && pnpm install && pnpm build`),
and put this checkout into nexitas' modules:

```sh
pnpm install
ln -s ../../veritas ../nexitas/.modules/veritas
cd ../nexitas && node scripts/modules.ts && pnpm install && pnpm dev
```

`node scripts/modules.ts` fetches the other modules nexitas lists and leaves the symlink to this
checkout as it is. Open http://localhost:3000, create the owner with the key in nexitas'
`.data/bootstrap-token`, and switch Content on, at setup or under Modules. The typecheck of the pages
and server runs in nexitas (`pnpm check` there); here `pnpm check` runs the unit tests.

## In an install

veritas runs wherever nexitas does: see nexitas' README for Compose, the proxy and the settings.
Content is the owner's own, so it is kept until they delete it. Off (under Modules), its pages and
both APIs answer 404; its content is kept.

## Not here yet

Users and roles, media uploads, references between entries, single-entry collections (a homepage),
versions, search in the API, pagination, webhooks.

## Checks

```sh
pnpm check         # the unit tests
pnpm lint
pnpm format:check
node ../aequitas/dist/aequitas-check.mjs --css ../nexitas/app/assets/nexitas.css app/**/*.vue
```
