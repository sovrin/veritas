# Agent notes for veritas

Conventions for working on veritas, in code and in the interface.

## Code

- veritas is a module of [nexitas](https://github.com/sovrin/nexitas): a plain Nuxt layer that
  nexitas extends. The owner's sign-in, the `/api` guard, live updates, the database, projects and
  the page shell are there, and plug-in points are its interfaces (`shared/modules.ts`). veritas
  registers itself in `server/core/module.ts`. What every module needs belongs in nexitas; what only
  veritas needs, here.
- A project's content belongs to one nexitas project: its delivery token, its collections, their
  entries. Its panel on a project's page is `app/components/global/VeritasProject.vue`.
- Import by relative path (or `#nexitas/...`): `~` and `#shared` resolve against nexitas, the app
  around this layer. Nothing app-wide lives here: no name, logo, favicon or sign-in lines.
- Keep comprehension debt low: explicit control flow, small modules, framework conventions, no
  speculative abstractions. Comments say why, not what.
- Every rule about input lives once, in `shared/contracts.ts` (zod), and is checked at runtime on
  the server: a collection's fields and each entry's values. The admin's forms use the same rules.
- Data access is plain SQL in `server/core/*.ts`: functions that take the database first, no ORM.
  Schema changes are a new step in `migrations` in `server/core/module.ts`; never edit a released
  step.
- Slugs and field keys are addresses: once saved they never change, and a field keeps its type,
  so what is stored always matches what the API promises.
- `/api/p/<project>/content/*` is the owner's (nexitas' security middleware), and its handlers
  take the project from `requestProject(event)`. The delivery API, `/v1/content/*`,
  is public through `publicRoutes` in `server/core/module.ts`: read-only, published entries only,
  any origin, a project's bearer token. Sites and builds out there read it, so it only grows (new
  fields optional, nothing renamed or removed).
- The admin is live: whatever changes what it shows calls `announceChange()`, and every view that
  shows data passes its refresh to `useLive`.

## UI

- Built only from aequitas: semantic HTML plus its classes, `data-*` variants and ARIA state.
- The look: nexitas' shell (navbar, one small column, statusbar); inside a page, compact density,
  square corners, no cards, panels or sidebar. Colour only reports state, always next to a word.
  Slugs, keys and API paths are mono. Text actions first, at most one primary button per view.
- Lint changed Vue files: `node ../aequitas/dist/aequitas-check.mjs --css ../nexitas/app/assets/nexitas.css <files>`.

## Checks

`pnpm check`, `pnpm lint` and `pnpm format:check` must stay green here, and `pnpm check` and
`pnpm build` in nexitas with this checkout in its `.modules/`.

## Commits and releases

Commit messages are [conventional](https://www.conventionalcommits.org):
`feat(entries): …`, `fix: …`, `docs(readme): …`. Give a scope or leave the parentheses out; never
write `feat(): …`. release-please can't parse an empty scope and silently drops the commit from
the next version and the changelog. Before 1.0, `feat` and `fix` bump the patch version and a
change marked `!` the minor. Mark a change that breaks the public `/v1` API with `!`
(`feat(api)!: …`), since sites and builds out there depend on it. Don't edit the version in
`package.json` or `CHANGELOG.md` by hand; the release PR does that.
