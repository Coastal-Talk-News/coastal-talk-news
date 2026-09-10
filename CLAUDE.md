# Coastal Talk News — Project Context & Engineering Rules

This file is read automatically by Claude Code at the start of every session in this repo.
It is the shared contract between two developers who are each using Claude Code
independently on the same codebase. **Do not fork this file per developer.** If something
here needs to change, change it here so both sides stay in sync.

Detailed reference material lives in `docs/` — this file stays short and high-signal on
purpose; it points to the longer docs rather than duplicating them.

---

## 1. What this project is

Coastal Talk News is a local digital news product with two front ends against one API:

- `apps/web` — public reader-facing site (Next.js)
- `apps/cms` — private admin panel (React + Vite) used to manage everything the public
  site displays
- `apps/api` — the single backend both apps talk to (Fastify)

Content is authored in the CMS and consumed by the public site. There is no other content
pipeline. If a public feature can't be traced back to something the CMS controls, it
shouldn't exist yet — see `docs/PROJECT-SCOPE.md`.

## 2. Repository structure (current, do not assume otherwise)

```text
coastal-talk-news/
├── .github/workflows/
├── .husky/
├── .turbo/
├── apps/
│   ├── api/
│   ├── cms/
│   └── web/
├── packages/
│   ├── db/
│   ├── eslint-config/
│   ├── types/
│   ├── typescript-config/
│   ├── ui/
│   └── validation/
├── docs/                  ← this documentation layer
├── .gitignore / .npmrc / .prettierrc
├── commitlint.config.js
├── package.json / pnpm-lock.yaml / pnpm-workspace.yaml
└── turbo.json
```

Don't restructure this without a real reason. Before creating a new package, app, directory,
or abstraction, check whether one of the existing locations already covers it.

## 3. Tech stack (use it, don't add to it casually)

**Public website** — Next.js, TypeScript
**CMS** — React, Vite, TypeScript, Tiptap, TanStack Query
**UI** — Tailwind CSS, Radix UI, shared via `packages/ui`
**Backend** — Fastify, TypeScript, TypeBox + JSON Schema, Swagger/OpenAPI, Prisma, Sharp,
Cloudinary, bcrypt, PostgreSQL full-text search + `pg_trgm`, Pino
**Database** — PostgreSQL
**Media storage** — Cloudinary (resizing and format selection happen on delivery)
**Tooling** — pnpm workspaces, Turborepo, Prettier, ESLint, Husky + lint-staged, GitHub Actions

Do not introduce an alternative library or framework when the existing stack already solves
the problem, and don't add a dependency for convenience alone. `node-cron` is not currently
a required V1 component (see §13) — if it's already installed in the repo, don't remove it
reflexively during a repo audit; confirm whether it's actually used first.

## 4. Environments (development, not final infrastructure)

- Web: https://coastal-talk-news-web.vercel.app/
- CMS: https://coastal-talk-news-cms.netlify.app/
- API: https://coastal-talk-news-api.onrender.com/

Never hardcode these into application code — use the project's existing env/config approach.

**`.env` files live only in `apps/*`. Never create one under `packages/*`.**

All backend configuration — `DATABASE_URL`, `SESSION_SECRET`, `CORS_ORIGINS`, `CLOUDINARY_*`, and the
`SEED_*` values — lives in a single `apps/api/.env` (template: `apps/api/.env.example`).
`packages/db/prisma.config.ts` reads that file, so the Prisma CLI, the seed script, and
the running API always share one connection string. A duplicated `DATABASE_URL` is the
hazard this avoids: migrations and the API silently drift onto different databases, and
the resulting "column does not exist" looks like a code bug rather than a config one.

When a shared package needs configuration, read it from the consuming app's `.env` or
take it as an argument (as `createPrismaClient(url)` does) — don't give the package its
own `.env`. `apps/web` and `apps/cms` each get their own `.env` for the public API base
URL; that follows this rule rather than breaking it.

None of this affects deployment: Render, Vercel, and Netlify inject real environment
variables and no `.env` file is read there.

## 5. Non-negotiable rule: understand before you code

On any non-trivial task, before touching a file:

1. Read this file and the relevant docs under `docs/`.
2. Inspect the actual repo structure — don't assume it matches this doc if the doc looks stale.
3. Search for existing components, hooks, API routes, types, validation schemas, and DB
   queries that already do what's being asked, or something close to it.
4. Identify what can be reused vs. what genuinely needs to be created.
5. Check whether the task touches a shared package (`packages/*`) or another app.

Never assume something doesn't exist before searching for it. Use
`docs/PROMPT-TEMPLATES.md` for the exact prompt to open a session with.

## 6. Documentation layer

- `docs/PROJECT-SCOPE.md` — what the product does, page/module inventory, what's out of scope
- `docs/DATA-MODEL.md` — entities and relationships (human-readable mirror of the Prisma schema)
- `docs/DEVELOPMENT.md` — API architecture, security checklist, verification steps, git conventions
- `docs/PROMPT-TEMPLATES.md` — the exact prompts to paste for onboarding, new features, and change requests

These describe agreed decisions. If implementing a task would require changing the data
model, an API contract, an app boundary, or documented product behavior — **stop and say
so before making the change.** Don't silently resolve the conflict by picking a side.

## 7. Two developers, one contract

You are one of two Claude Code instances working on this repo at the same time.

- Don't touch code outside the app/feature you were asked about.
- Don't change anything in `packages/*` casually — it's shared by both apps and possibly
  by the other developer's in-flight work.
- Before renaming a shared type, changing an API response shape, or altering a Prisma
  model, search for every consumer across `apps/api`, `apps/cms`, and `apps/web`.
- Don't invent a new pattern (a new state management approach, a new folder convention, a
  new error-handling style) when the codebase already has one, even if you'd personally do
  it differently.
- If a change is genuinely cross-cutting, say so explicitly and describe the blast radius
  before making it.

## 8. Design-to-code workflow

When given a design image, screenshot, or written description for a page or component:

1. Understand the layout and intent, don't just replicate pixels.
2. Identify which existing components/utilities in `packages/ui` or the current app should
   be reused or extended.
3. Identify what data the page actually needs from the API.
4. Implement a real responsive UI (desktop/tablet/mobile) against live data — no mock data
   in the final implementation, no hardcoded coordinates copied off a screenshot.

For a follow-up change request ("move this section", "use this new design"), make the
smallest clean change that achieves it — don't rebuild the page from scratch, and preserve
working behavior that wasn't part of the request.

## 9. Scope discipline

Don't add fields, entities, pages, or dependencies that weren't requested, even if they're
common in other news/CMS products or feel like an obvious improvement. If something looks
genuinely missing or inconsistent with `docs/PROJECT-SCOPE.md` or `docs/DATA-MODEL.md`, say
so and ask — don't add it unilaterally. This matters more than usual here because a second
developer's Claude session is relying on the same documented scope.

## 10. Code quality bar

- **TypeScript**: strong types throughout; avoid `any`; don't use type assertions to
  silence real errors; put genuinely shared types in `packages/types` rather than
  duplicating an interface across apps.
- **Comments**: explain _why_, never _what_. No comments restating an obvious line. Comments
  are appropriate for a non-obvious business rule, a deliberate workaround, a
  performance-sensitive path, a security consideration, or an external limitation.
- **Structure**: small, focused functions and components; predictable file layout matching
  what already exists; avoid deeply nested conditionals and components with dozens of
  unrelated props.
- **Duplication**: search before writing. Reuse `packages/ui`, `packages/validation`,
  `packages/types`, and `packages/db` rather than reimplementing.

Full detail: `docs/DEVELOPMENT.md`.

## 11. API rules (short version — full version in docs/DEVELOPMENT.md)

Fastify + TypeBox + Swagger/OpenAPI. Separate request validation, auth/authz, business
logic, and database access — keep route handlers thin. Consistent REST-style resource
naming. No two endpoints doing the same thing.

## 12. Security baseline (non-negotiable)

- Every protected route enforces authentication and authorization on the backend —
  never trust the CMS frontend to gate access.
- Passwords via bcrypt, never plaintext, never logged.
- Validate uploaded files by content, not just the client-supplied filename/MIME type.
- Treat stored article/rich-text content as untrusted when rendering it publicly (XSS).
- No secrets, credentials, or stack traces in responses or logs. All secrets via env vars.
- Scope CORS correctly per app/environment.

## 13. Advertisement & Breaking News state

Breaking News and Advertisements do **not** store an `is_active` database field. Their
active state is derived by the backend from their `start_at`/`end_at` schedule:

- active = current time falls between `start_at` and `end_at`
- inactive = before `start_at`, or after `end_at` has passed

The API may include a computed `is_active` field in their responses so the CMS can separate
active items from inactive/expired ones for review and cleanup. Do not introduce a database
`is_active` column, and do not use a cron job (or any scheduled process) to flip a stored
active/inactive flag — the current time and the schedule are the source of truth, computed
at query time. Full detail: `docs/DATA-MODEL.md` and `docs/DEVELOPMENT.md` §8.

## 14. Verification before calling something done

Check `package.json` / `turbo.json` for the actual scripts (don't assume names) and run
lint, typecheck, build, and tests for every app you touched. If something can't be verified
in this environment, say so plainly instead of claiming it works.

## 15. Manual steps

When a task needs something outside the repo (provisioning Postgres, configuring the Cloudinary
bucket, setting env vars on Vercel/Netlify/Render, DNS, GitHub repo settings), implement
everything that _can_ live in the repo, then list the exact manual steps and values needed.
Never imply that kind of setup is done when it isn't.

## 16. Git & commits

Never commit automatically unless explicitly asked to. After a feature is implemented and
verified, output a conventional commit message describing the completed change:

```text
feat(web): add responsive article detail page
feat(cms): add advertisement scheduling form
fix(api): enforce publish window on breaking news query
refactor(db): extract media asset repository
```

## 17. Definition of done

A feature is complete only when the relevant end-to-end path works, not just the piece you
touched — e.g. an article field isn't "done" if the CMS can save it but the public API
doesn't return it. Before reporting completion: no dead code or duplication, proper loading
/ error / empty states, responsive layout, server-side validation and authorization, no
leaked internals, docs updated if scope or schema changed. Report format and full checklist:
`docs/DEVELOPMENT.md`.

## 18. Core principle

Ship the smallest, cleanest thing that satisfies the actual requirement — not the maximum
amount of code, and not a "future-proof" version of a feature nobody asked for. This file
plus `docs/` is the contract that keeps two people, and two Claude sessions, building one
consistent product. When something is genuinely ambiguous, ask rather than assume.
