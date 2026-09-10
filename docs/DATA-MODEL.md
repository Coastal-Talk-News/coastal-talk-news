# Data Model — Coastal Talk News

**Source of truth is `packages/db` (the Prisma schema), not this file.** This document
mirrors the ER diagram, updated for the decisions locked in `docs/PROJECT-SCOPE.md`. Items
below marked "needs migration" are not yet in the original diagram — confirm and apply
them in Prisma before building the feature that depends on them.

## Entities

### Article

`id`, `category_id` (FK → Category), `media_id` (FK → Media Asset, featured image),
`language`, `headline`, `summary`, `content`, `youtube_url`, `tags`, `priority`,
`status` (→ `ArticleStatus`), `publication_date`, `created_at`, `updated_at`, `seo_title`,
`meta_description`, `og_image_id` (FK → Media Asset)

`summary` is required — shown in article listings and social previews. Distinct from
`meta_description`, which is SEO-specific and optional.

`tags` is a plain string array, entered freely by the author. Not a controlled vocabulary
and not a separate entity — no `Tag` table, no foreign key. No filtering/search by tag in
V1; if that's needed later, revisit whether a real entity is warranted then.

No `slug` field exists. Public article URLs are not yet scoped — this is a known gap, not
an oversight; revisit before the public article page is built.

`category_id` is nullable at the database level — a change applied directly to the shared
dev database (alongside the Media Library work) rather than through this doc's process.
The API still requires a category on Create/Edit News (see the field table below); a null
category can only occur for a row written outside that path. Confirm with whoever made
this change whether Category is meant to become genuinely optional product-wise — if so,
that's a bigger change to the CMS form and this doc, not just a schema-nullability fix.

**`scheduled_deletion_at` — needs migration (remove).** The original diagram had this
field for scheduling archival at a future time. Under the simplified lifecycle, archive
and delete are explicit immediate admin actions, not scheduled ones — this field is no
longer used. Drop it, or repurpose only if a real future need appears.

### ArticleStatus (enum) — needs migration (simplify)

Was `DRAFT / SCHEDULED / PUBLISHED / ARCHIVED`. Now: **`DRAFT`, `PUBLISHED`, `ARCHIVED`** —
`SCHEDULED` is removed since there is no future-dated auto-publish in V1. Publishing sets
`status = PUBLISHED` and `publication_date = now()` in the same action.

`ARCHIVED` is reached via the explicit Archive action (soft — row stays). A hard **Delete**
is a different, separate action that removes the row entirely rather than setting a status
— see "Article deletion & media integrity" below.

### ArticlePriority (enum) — confirmed

`Lead Story`, `Featured`, `Normal`. Verify the exact Prisma enum name/casing before wiring
up UI or filters.

### Category

`id`, `media_id` (FK → Media Asset), `name`, `description`, `is_active`, `display_order`,
`created_at`, `updated_at`

**Deletion rule (backend-enforced, no schema change needed):** reject deleting a Category
while any `Article.category_id` still references it.

### Breaking News

`id`, `headline`, `article_url` (plain URL, **not** a foreign key — confirmed intentional:
breaking news can point outside the article system), `start_at`, `end_at`, `created_at`,
`updated_at`

There is **no `is_active` database field.** The backend derives the active state from the
schedule:

- `is_active = true` when the current time is within `start_at` / `end_at`.
- `is_active = false` when the item has not started yet or its `end_at` has passed.

The computed `is_active` value may be included in API responses for CMS filtering and
display, but it is never persisted — recompute it on every read.

### Advertisement

`id`, `media_id` (FK → Media Asset), `advertiser_name`, `destination_url`, `placement`,
`priority`, `start_at`, `end_at`, `created_at`, `updated_at`

There is **no `is_active` database field**, for the same reason as Breaking News. The
backend derives the active state from the schedule:

- `is_active = true` when the current time is within `start_at` / `end_at`.
- `is_active = false` when the advertisement has not started yet or its `end_at` has passed.

The computed `is_active` value may be included in API responses so the CMS can separate
active advertisements from inactive/expired ones.

**`placement`** — values are examples pending final UI design (homepage top/middle/sidebar,
article sidebar/bottom, category page). Don't hardcode a closed set until confirmed; design
the schema/API so adding a placement doesn't require rewriting the ad system.

### Media Asset

`id`, `filename`, `storage_key` (the stored image key), `mime_type`, `file_size`, `created_at`

Binary image data is **never** stored in PostgreSQL — only this reference row.

### CMS User

`id`, `name`, `email`, `password` (bcrypt hash — never plaintext, never logged),
`created_at`, `updated_at`

No role/permission field — single-tier admin access, confirmed for V1.

### Site Settings

`id`, `site_name`, `tagline`, `description`, `logo_media_id` (FK), `favicon_media_id` (FK),
`contact_email`, `contact_phone`, `facebook_url`, `instagram_url`, `youtube_url`, `x_url`,
`default_ui_language`, `default_seo_title`, `default_meta_description`,
`default_og_image_id` (FK), `created_at`, `updated_at`

Effectively a singleton — expect exactly one row.

`default_ui_language` can stay as-is even though there's no reader-facing switcher in V1 —
it just becomes a fixed configuration value (defaulting to Kannada per
`docs/PROJECT-SCOPE.md`) rather than something a switcher reads at runtime.

**`address` — needs migration (add), still open.** The About/Contact page and Settings →
General both require a postal address; no field exists for it yet. Confirm field name
(e.g. `contact_address`) before building the Settings/Contact UI.

## Relationships

- `Article.category_id → Category.id`
- `Article.media_id`, `Article.og_image_id → MediaAsset.id`
- `Category.media_id → MediaAsset.id`
- `Advertisement.media_id → MediaAsset.id`
- `SiteSettings.logo_media_id`, `favicon_media_id`, `default_og_image_id → MediaAsset.id`
- `BreakingNews` does **not** FK to `Article` — it stores a raw URL string

## Field types

The diagram is product-level and doesn't specify SQL/Prisma types. Always confirm exact
types, enum identifiers, and nullability against `packages/db/prisma/schema.prisma` before
writing TypeBox validation schemas or API DTOs — don't infer types from this document.

## Article deletion & media reference integrity

Two distinct actions exist on an Article, and they behave differently for media:

- **Archive** — `status → ARCHIVED`. The row stays, so `media_id`/`og_image_id` stay
  referenced. No media cleanup happens.
- **Delete** — the row is removed entirely. Any media it referenced must then be checked:
  if no other Article, Category, Advertisement, or Site Settings row still references that
  Media Asset, delete it from both PostgreSQL and Cloudinary. If anything else still
  references it, the asset must remain untouched.

This "is this Media Asset still referenced anywhere?" check must live in **one** central
backend mechanism that every delete path calls — not reimplemented separately for
Articles, Categories, and Advertisements. See `docs/DEVELOPMENT.md` for the enforcement
rule.

## Media flow

```text
Upload → validate (real file content, not just client-supplied MIME/extension)
       → process/optimize with Sharp
       → store object in Cloudinary
       → save { filename, storage_key, mime_type, file_size } as a Media Asset row
```

The architecture diagram shows the client talking to Cloudinary directly on two paths, in addition
to the API↔Cloudinary path — this suggests either a presigned-upload flow, direct public reads of
stored images, or both. Confirm the actual implementation in `apps/api`/`apps/cms` and
update this section once you have.

## API ↔ database access pattern

Client → API → PostgreSQL (via Prisma) for all structured data. The public API must filter
server-side:

- `status = PUBLISHED` for Articles
- `is_active = true` for Categories
- current time within `start_at` / `end_at` for Breaking News
- current time within `start_at` / `end_at` for Advertisements

Breaking News and Advertisement `is_active` values are **computed response fields, not
database columns.** The public API must never rely on the client to filter out expired or
inactive content — the database query itself should exclude anything outside its schedule
window, not fetch everything and let the frontend hide it.
