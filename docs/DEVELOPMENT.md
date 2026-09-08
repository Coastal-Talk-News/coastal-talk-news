# Development Workflow — Coastal Talk News

Detailed reference for how Claude should work in this repo. `CLAUDE.md` is the short
always-loaded contract; this file is the expanded version it points to.

## 1. Before writing any code

1. Read `CLAUDE.md`, `docs/PROJECT-SCOPE.md`, `docs/DATA-MODEL.md`.
2. Inspect the actual repository — package structure, app boundaries, shared packages,
   API routing, Prisma schema, auth, validation, shared types/UI, data fetching, error
   handling, env config, existing tests, lint/type/build config.
3. Search for an existing implementation before assuming something needs to be built from
   scratch.
4. Confirm whether the task affects another app or a shared package before starting.
5. If the task touches the article lifecycle, breaking news/ad scheduling, or media
   deletion, check the Prisma schema for the migrations flagged in `docs/DATA-MODEL.md`
   (`ArticleStatus` simplification, the `address` field) before assuming they've already
   been applied — and confirm Breaking News/Advertisement "active" state is computed at
   query time rather than read from a stored column.

## 2. API architecture pattern

Fastify route handlers should stay thin. Separate concerns:

```text
route (HTTP method, path, TypeBox schema)
  → auth/authz check
  → request validation (TypeBox/JSON Schema)
  → service / business logic
  → repository / Prisma call
  → response shaping
```

Check the current `apps/api` structure for the exact folder convention already in use and
follow it rather than introducing a new layout per feature.

- REST-style, resource-oriented routes; consistent naming across resources.
- No two endpoints that do essentially the same thing.
- Document every route with Swagger/OpenAPI via the TypeBox schema.
- Avoid unnecessary round trips.

## 3. Validation

- Validate on the backend always — frontend validation is UX only, never the security
  boundary.
- Validate required fields, string formats, enums, IDs, URLs, dates, uploaded files,
  request bodies, query params, and route params.
- Use TypeBox/JSON Schema consistently; factor a shape into `packages/validation` when it's
  genuinely shared between apps.

## 4. Deletion & reference integrity

This is a cross-cutting rule, not a per-feature one — get it wrong once and it's wrong in
three different places.

**Media reference check.** A Media Asset can be referenced by an Article (`media_id` or
`og_image_id`), a Category, an Advertisement, or Site Settings, all at once. Build **one**
backend function that answers "is this Media Asset still referenced by anything?" — every
delete or update path that could orphan a media reference must call it, rather than each
resource re-implementing its own check. Only delete the Media Asset (DB row + R2 object)
when that check returns zero references. This applies whenever a resource is hard-deleted
or has its media reference changed — archiving an Article does _not_ trigger it, since the
row and its reference stay in place.

**Category deletion guard.** Reject deleting a Category while any Article still has that
`category_id`. Enforce this in the service layer, not just by disabling the delete button
in the CMS — the API must reject it independently of what the frontend does.

**Article delete vs. archive.** These are two distinct endpoints/actions with different
effects:

- Archive → `status = ARCHIVED`, row and media references untouched.
- Delete → row removed permanently, triggers the media reference check above for any
  image it referenced. Treat this as irreversible; consider requiring explicit
  confirmation and a distinct permission/audit trail even though V1 has a single admin tier.

**Unused media.** No scheduled/automatic cleanup in V1. Support a manual "delete this
asset" action from the Media Library, and optionally an explicit "clean up unused assets
now" action triggered by the admin — don't build a background sweep unless asked to.

## 5. Security checklist

- Authentication and authorization enforced on every protected route, server-side, every
  time.
- Passwords: bcrypt, never plaintext, never in logs or responses.
- File uploads: validate actual file content, not just the client-supplied filename or MIME
  type; enforce size/type limits server-side.
- Rich content (Tiptap output) rendered on the public site: treat as untrusted, sanitize or
  render through a method that can't execute injected markup (XSS).
- Never expose passwords, password hashes, secrets, internal stack traces, or raw env vars
  in any API response.
- Scope CORS per environment/app.
- All secrets via environment variables, never hardcoded, never committed.

## 6. Error handling & logging

- Consistent API error response shape across all routes.
- Never leak internal implementation details (stack traces, query text, file paths) to the
  client; log that detail server-side instead.
- Frontends show a useful, human message, not a raw error dump.
- Pino for backend logging. Log operationally useful information; never log passwords,
  tokens, secrets, or full request bodies containing sensitive fields.

## 7. Frontend conventions

- `apps/web` (Next.js) and `apps/cms` (Vite) are separate apps, sharing only what's
  genuinely common via `packages/ui`.
- CMS server state goes through TanStack Query — follow the existing query/mutation
  conventions already in the codebase.
- Tiptap is the only rich-text editor. Be deliberate about how its output is rendered on
  the public site (see security checklist).
- Before creating a UI component: search the repo, check `packages/ui`, check the current
  app, then reuse/extend before creating something new.
- No language-switcher component needed anywhere — the UI renders in a single fixed
  language per `docs/PROJECT-SCOPE.md`. Don't build toggle infrastructure for this.
- CMS list views for Breaking News and Advertisements should visually separate active vs.
  inactive/expired items using the API's computed `is_active` field, so the admin can spot
  and clean up expired entries at a glance.

## 8. Search, scheduling, and images

- Full-text search uses PostgreSQL FTS + `pg_trgm`. The content-language filter (All /
  English / Kannada) is a query filter on `Article.language`, unrelated to UI language.
- **No article publish scheduling in V1** — publishing is immediate, so there is no cron
  job flipping `Article.status` on a timer.
- Breaking News and Advertisement visibility is determined from their `start_at` and
  `end_at` schedule at query time.
- Do **not** store `is_active` as a database column for Breaking News or Advertisements.
- The API may expose a computed `is_active` field in their responses for CMS display and
  filtering.
- The CMS should separate currently active items from inactive/expired items using the
  computed response value.
- Do not use a cron job to update an active/inactive database field. The current time and
  schedule are the source of truth, recomputed on every read.
- `node-cron` is not required for article publishing, Breaking News visibility, or
  Advertisement visibility in V1. Do not build scheduled infrastructure around it unless
  another concrete V1 requirement needs it. If it's already installed in the repo, don't
  remove it reflexively — confirm during the repo audit whether anything actually uses it.
- Image pipeline: validate → Sharp processing/optimization → R2 → Media Asset row. Don't
  create redundant copies unless there's a real requirement.

## 9. Performance

Prioritize efficient Prisma queries and appropriate indexes, optimized images, and avoiding
unnecessary client-side JS or redundant API calls. Don't introduce caching layers or
premature optimizations without a concrete, current bottleneck.

## 10. Two-developer collaboration protocol

Both of you run Claude Code against the same repository and the same `CLAUDE.md`/`docs/`.

- Don't modify code outside the scope of the current task.
- Treat any change to `packages/*`, the Prisma schema, or an existing API response shape as
  cross-cutting — search for every consumer in both `apps/cms` and `apps/web` first.
- Flag a shared-context conflict rather than resolving it unilaterally — e.g. if you find
  code that still assumes the old `Scheduled` article status, the old
  `scheduled_deletion_at` field, or a stored `is_active` column on Breaking News/
  Advertisement, that's drift from a documented decision, not a new decision to make on
  your own.
- Don't introduce a second pattern for something that already has one.

## 11. Verification before reporting completion

For every app touched, check `package.json`/`turbo.json` for the real script names and run
type checking, linting, build, and tests. For API changes, confirm the OpenAPI/Swagger doc
still reflects the endpoint. If something can't be verified in this environment, say so
plainly.

## 12. Feature completion report

Before saying a task is done, check for: duplicated code, unnecessary dependencies or
files, unnecessary abstractions, type safety gaps, missing validation/authorization,
security issues, API/DB consistency, missing loading/error/empty states, responsive
behavior, and impact on the other app. Then report:

1. What was implemented
2. Files/areas changed
3. What was verified (and how)
4. Any manual setup still required, with exact steps/values
5. A recommended commit message

## 13. Git & commit conventions

Never commit automatically unless explicitly told to. Use conventional commits describing
the completed change:

```text
feat(web): add responsive article detail page
feat(cms): separate active and expired advertisements in the list view
feat(api): compute is_active for breaking news and advertisements from schedule
fix(cms): prevent category deletion while articles remain attached
refactor(api): extract shared media-reference-check service
chore(db): simplify ArticleStatus enum, drop scheduled_deletion_at
```

Only suggest a commit message once the feature is actually complete and verified.
