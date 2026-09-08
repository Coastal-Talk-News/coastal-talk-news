# Prompt Templates — Coastal Talk News

Copy-paste these into Claude Code as-is (fill in the bracketed parts). Both developers
should use the same templates so the two Claude sessions behave consistently.

---

## 1. Onboarding / repo-analysis prompt

Use this the first time Claude Code opens this repo, and again after a large change to the
schema or architecture. **Do not skip this even if Claude "already knows" the project from
a previous session summary** — the repo is the source of truth, not the summary.

```text
Before writing or modifying any code, understand this project and the existing
repository completely. Do not start implementation yet.

First read:
- CLAUDE.md
- docs/PROJECT-SCOPE.md
- docs/DATA-MODEL.md
- docs/DEVELOPMENT.md

Then inspect the actual repository. It's a pnpm + Turborepo monorepo containing
apps/api, apps/cms, apps/web, and shared packages under packages/. Understand how
the codebase is actually structured rather than assuming it matches the docs —
flag any place where the docs and the real code disagree.

Inspect: package structure and app boundaries, shared packages, API structure and
routing, the Prisma schema, authentication, validation, shared types, shared UI,
data fetching patterns, error handling, env configuration, image/media handling,
existing components and utilities, existing coding patterns, existing tests, and
the lint/type/build configuration.

Search the repository for existing implementations before deciding something needs
to be created. Do not invent product features, fields, or entities beyond what's
documented — treat docs/PROJECT-SCOPE.md and docs/DATA-MODEL.md as the requirements,
and flag any conflicts you find rather than resolving them yourself.

Do not modify any code. At the end, give me a concise report:
1. Repository structure and any drift from the docs
2. What each app is responsible for, as actually implemented
3. What each shared package actually contains
4. Current database structure vs. docs/DATA-MODEL.md
5. Current API structure and conventions
6. Current authentication approach
7. Frontend architecture for web and cms
8. Reusable components/utilities I should know about
9. What's already implemented vs. incomplete
10. Any conflicts between the codebase and the documented scope
11. Any architectural concerns worth addressing before I start assigning features
12. Anything I need to configure manually outside the repo
```

---

## 2. New feature / page implementation prompt

Use this per feature, with a design image or written description attached.

```text
Implement [feature/page name].

[Attach the design image, or describe the page/feature here.]

Before implementing:
1. Read CLAUDE.md and the relevant docs/ files if you haven't already this session.
2. Inspect the existing [web/cms] app and identify which existing components, API
   calls, types, utilities, and shared UI components should be reused.
3. Identify exactly what data this needs from the API, and whether the API already
   supports it or needs a new/extended endpoint.

Implement against the actual backend and database — no mock data in the final
version. Follow every rule in CLAUDE.md and docs/DEVELOPMENT.md, in particular:
- responsive behavior across desktop/tablet/mobile
- loading, error, and empty states
- server-side validation and authorization
- scheduled/expiring content uses the backend's computed active state; do not introduce
  client-side or database-managed active/inactive state unless explicitly documented
- no duplicated logic — reuse packages/ui, packages/validation, packages/types
- minimal comments, only where genuinely non-obvious

Do not change unrelated parts of the application. Do not add fields, pages, or
behavior beyond what's described here or in docs/PROJECT-SCOPE.md — if something
seems missing, ask me instead of adding it.

Before finishing, verify with the actual type check, lint, build, and test commands
for every app you touched. If something needs setup outside this repo, tell me
exactly what to do.

When complete, give me:
1. What was implemented
2. What was verified
3. Any manual setup required
4. A recommended conventional commit message

Do not create the commit — I'll do that myself.
```

---

## 3. Change / iteration request prompt

Use this for tweaks to something already built.

```text
Change [page/component]: [describe the change, or attach an updated design].

Inspect the current implementation first. Make the smallest clean change that
achieves this — don't rebuild the page or component from scratch, and don't touch
unrelated code. Preserve everything that currently works correctly.

Verify the change with the relevant type check, lint, and build before reporting
back. Give me a short summary of what changed and a recommended commit message.
```

---

## 4. Bug fix prompt

```text
Bug: [describe the bug, exact steps to reproduce, and what you expected instead].

Investigate the actual root cause in [app/area] before changing anything — don't
guess. Check whether the same bug pattern exists elsewhere in the codebase (e.g.
the same unvalidated field used in another endpoint). Fix only what's needed to
resolve the root cause, not a broader refactor unless the bug can't be fixed
without one — if that's the case, tell me before doing it.

Verify the fix and confirm the original repro steps no longer trigger it. Give me
a short root-cause explanation and a recommended commit message (fix(...): ...).
```

---

## 5. Cross-cutting / shared-package change prompt

Use this specifically when a change touches `packages/*`, the Prisma schema, or an
existing API response shape — since the other developer's Claude session depends on the
same contract.

```text
This change affects [shared package / Prisma schema / API contract for X].

Before changing anything: search the whole repo for every consumer of this
[type/endpoint/schema/component] across apps/api, apps/cms, and apps/web, and list
them for me. Tell me what would break for each consumer if you proceed.

Then implement the change so every consumer keeps working, updating each one as
needed. If a consumer can't be safely updated without more context from me, stop
and ask rather than guessing.

Update docs/DATA-MODEL.md or docs/DEVELOPMENT.md if this change alters something
they document, so the other developer's Claude session stays in sync.

Verify across every affected app before reporting back, and give me a recommended
commit message.
```
