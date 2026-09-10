# Project Scope — Coastal Talk News

> **Status: confirmed — this revision supersedes all earlier versions of this file.**
> Three product decisions were locked in an earlier pass (UI language, publishing model,
> article deletion — see the table below). This revision refines how Breaking News and
> Advertisement "active" state works: it's computed from the schedule, not stored.

## Decisions locked in this revision

| Topic              | Decision                                                                                                                                                                                                                                                                                                                     |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI language        | **No runtime language switcher.** The interface chrome (nav labels, buttons, etc.) renders in a single fixed language. `Article.language` is unaffected — every article is still tagged English or Kannada, and both appear mixed together on the same listing pages (homepage, category pages), not segregated by a toggle. |
| Article publishing | **Simple: Draft → Published only.** No `Scheduled` status, no future-dated auto-publish. Hitting Publish sets `publication_date` to the current time immediately.                                                                                                                                                            |
| Article deletion   | **Both actions available**, on any article: **Archive** (soft — status becomes `Archived`, row stays in the DB, hidden from the public site) and **Delete** (hard — the row is permanently removed, subject to the media reference rule in §9 below).                                                                        |

One assumption baked into the first row: the fixed UI language defaults to **Kannada**,
matching the local audience and the earlier design intent — it's just a static string
resource, not an architectural decision, so it's cheap to flip to English later if that
turns out to be wrong. Confirm if you want it the other way.

## Overview

A local news product covering Udupi, Manipal, Mangalore, Karnataka, and India more broadly.
Two front doors against one API: the public website (readers) and the CMS (the internal
publication team). The CMS publishes both Kannada and English articles side by side; the
site interface itself is single-language. Fully responsive.

## Public website

### Header & navigation

Common header across the main pages: logo, site name, main nav, search, mobile menu. No
language switcher. Navigation reflects the _active_ categories from the CMS — deactivating
a category (`Category.is_active = false`) must remove it from public navigation immediately.

### Homepage

- **Breaking News** — prominent strip, only items currently within their `start_at`/`end_at` window
- **Lead Story** — articles with `priority = Lead Story`
- **Featured News** — articles with `priority = Featured`
- **Latest News** — automatic, newest published first, no manual curation
- **Category News** — per active category, in the CMS-configured order
- **Advertisements** — predefined placements, responsive, proportions preserved

Articles of both languages appear together, unsegregated, throughout the homepage.
Responsive rule: desktop can use multiple columns, smaller screens rearrange, images are
never stretched or distorted, ads adapt to available width.

### Article page

Must be openable directly from a shared link (WhatsApp, social) and fully readable without
an account. Contains: category, headline, publication date/time, optional featured image,
full content, optional YouTube video (single embed inline — no separate video content
type), social sharing, article SEO (title/meta/OG image, set per-article in the CMS), and
ads in article-specific placements. Clean typography, responsive.

### Category page

One page per active category: name, optional cover image, optional description, its
published articles (newest first, mixed language), ads in defined locations.

### Search

Free-text search over published articles. Results show headline, image (when available),
category, publication date. Has a proper no-results state. Includes a content-language
filter — All / English / Kannada. This filters _which language of article_ appears in
results; it is not the same thing as a UI language switcher, and stays in scope.

### About & Contact

One combined page: About text, Contact (email, phone, address — see the open schema flag
in `docs/DATA-MODEL.md`), Social links — all sourced from Settings → General. No contact
form in V1.

### Website states

404 (with a clear way back), search no-results, empty category, loading state. Pure
frontend behavior, no CMS management needed.

## CMS (admin panel)

Sections: Login, Dashboard, News, Create/Edit News, Categories, Breaking News,
Advertisements, Media Library, Settings. No separate Users/roles management in V1.

### Login

Email + password. Only authenticated CMS users can reach the admin area.

### Dashboard

A light overview with shortcuts: create news, manage news, scheduled/recent items,
breaking news, advertisements, media, categories. No analytics dashboard — no Most
Viewed, Most Read, or reader traffic analytics of any kind.

### News (list/manage)

View, search, and filter articles by language (All / English / Kannada), status (Draft /
Published / Archived — `Scheduled` no longer exists), and category.

### Create/Edit News

| Field                                     | Required | Notes                                                                     |
| ----------------------------------------- | -------- | ------------------------------------------------------------------------- |
| Field                                     | Required | Notes                                                                     |
| ----------------------------------------- | -------- | ---------------------------------------------------                       |
| Language                                  | Yes      | English or Kannada                                                        |
| Category                                  | Yes      | one category per article                                                  |
| Headline                                  | Yes      |                                                                           |
| Summary                                   | Yes      | shown in listings and social previews; distinct from SEO meta description |
| Content                                   | Yes      |                                                                           |
| Featured image                            | No       | from Media Library or new upload                                          |
| YouTube URL                               | No       | renders inline on the article page if set                                 |
| Tags                                      | No       | free text, author-entered; no controlled taxonomy, no filtering in V1     |
| Editorial priority                        | —        | Lead Story / Featured / Normal                                            |
| Status                                    | —        | Draft or Published — no Scheduled option                                  |
| SEO title / meta description / OG image   | No       | set alongside the article, no separate screen                             |

No URL slug field — public article URLs aren't scoped yet. No other fields beyond this
table.

**Publishing**: Save as Draft, or Publish (immediate — sets `publication_date` to now).
Published articles remain editable afterward.

**Deleting/removing an article**: the admin gets both **Archive** (article disappears from
the public site, row stays in the database) and **permanent Delete** (row and its media
references are removed for good — see §9). Both actions are backend-enforced, not merely
UI affordances.

### Categories

Create, edit, activate/deactivate, order, description, cover image. Changes flow straight
into public nav, category pages, and homepage category rows.

**Deletion rule**: a category cannot be deleted while any article still references it. The
admin must reassign or remove those articles first. This is enforced **on the backend** —
not just by disabling the delete button in the CMS.

### Breaking News

CMS actions: Create, Edit, Delete. Fields: headline, a plain destination URL (**not** a
foreign key to Article — confirmed intentional; breaking news can point anywhere, including
outside the article system), start/end datetime.

Breaking News does not have a stored `is_active` field. Its active state is derived by the
backend from the schedule:

- `is_active = true` when the current time is within the `start_at` / `end_at` window.
- `is_active = false` when the item has not started yet or its `end_at` has passed.

The API may include the computed `is_active` value in Breaking News responses so the CMS
can separate active and inactive items. The CMS should display active and inactive items
separately so the admin can easily review expired items and permanently delete unwanted
ones. There is no separate manual activate/deactivate toggle — pulling an item early is
done by editing its `end_at` to the current time. The public site displays only currently
active Breaking News.

### Advertisements

Fields: advertiser name, image, destination URL, priority, start/end datetime.

**No `placement` field, confirmed.** The Prisma schema deliberately has no `placement`
column — the reader site defines its own ad zones and distributes active ads across them,
with `priority` as the sole editorial control over which ads land in the more prominent
zones. This section previously listed `placement` as a field; that was stale text never
reconciled with the schema's actual (and intentional) design. Don't reintroduce it without
updating the schema first.

Advertisements are scheduled using `start_at` and `end_at`. The advertisement does not have
a stored `is_active` field — its active state is derived by the backend from the schedule,
the same way as Breaking News:

- `is_active = true` when the current time is within the `start_at` / `end_at` window.
- `is_active = false` when the advertisement has not started yet or its `end_at` has passed.

The API may include the computed `is_active` value in advertisement responses so the CMS
can easily separate currently active advertisements from inactive/expired ones. The CMS
should display active and inactive advertisements separately so the admin can review
expired advertisements and permanently delete unwanted ones later.

### Advertisement images

One image per ad, any resolution, rendered responsively with aspect ratio preserved. No
separate desktop/tablet/mobile variants in V1. Optimized server-side on upload (Sharp).

### Media Library

Central upload/browse/reuse for images used as article featured images, category covers,
ad images, site logo, favicon, and the default SEO/OG image.

**Deletion rule** — a media asset can be referenced by multiple resources at once (an
article, a category, an ad, a settings field). Deleting one referencing resource must never
delete the underlying media asset while any other reference still exists. Only when the
**last** reference is removed does the asset get deleted, from both PostgreSQL and
Cloudinary. This must be one central backend mechanism, not reimplemented separately
per resource — see `docs/DEVELOPMENT.md` for the enforcement rule.

**Detaching counts as removing a reference — confirmed.** Swapping a category's cover
image, or clearing it, releases the previous asset: if nothing else references it, the row
and the stored image go immediately. It is not returned to the library as "unused". This was
raised explicitly because it means removing a cover image destroys the file, and confirmed
as the intended behaviour. The CMS must therefore say so at the point of the action, so the
loss is never a surprise.

Media uploaded but never attached to anything is the one case that lingers: there is no
scheduled sweep in V1. The admin deletes those from the library, or triggers the explicit
"clean up unused" action. Don't build a background sweep unless it's actually needed.

### Settings

- **General** — site name, tagline, description, logo, favicon, contact email/phone/address, social links (Facebook, Instagram, YouTube, X)
- **SEO** — default SEO title, default meta description, default OG image

A "Language Settings" screen is no longer needed as a _toggle_ — there's nothing to
switch. `Site Settings.default_ui_language` can still exist as a fixed configuration value
if useful for future i18n work, just without a reader-facing control.

## Public ↔ CMS mapping

Every editorial piece of content on the public site must be traceable to a CMS control.

| Public website                                | Managed from CMS               |
| --------------------------------------------- | ------------------------------ |
| Website name, logo                            | Settings → General             |
| Navigation categories                         | Categories                     |
| Homepage Lead Story / Featured                | News → Editorial Priority      |
| Homepage Latest News                          | Published News (automatic)     |
| Category sections                             | Categories + News              |
| Breaking News                                 | Breaking News                  |
| Article content / image / YouTube video / SEO | News + Media Library           |
| Category name / cover image                   | Categories + Media Library     |
| Search results                                | Published News                 |
| About / Contact / Social                      | Settings → General             |
| Advertisements + images                       | Advertisements + Media Library |

Pure website behavior needing no CMS control: responsive layout, loading states, 404,
search no-results, mobile menu behavior, image responsiveness.

## Explicitly out of scope for V1

- Reader accounts, reader login, comments, likes, bookmarks, following, notifications
- Reporter accounts, reporter approval workflows
- CMS user roles/permissions (single-tier admin access)
- Complex analytics dashboard, Most Read / Most Viewed, any reader traffic analytics
- Automatic article translation
- Runtime English/Kannada UI switching (see decisions table above)
- A separate "Videos" content type or section
- Separate News vs. Video search
- Contact form
- Separate desktop/tablet/mobile advertisement image variants
- A dedicated SEO management section (SEO lives inside the Article editor and Settings)
- A complex advertisement platform: bidding, auctions, advertiser accounts, billing, or
  complex ad-performance analytics
- Native mobile application
- Automatic background media garbage collection (manual/on-request cleanup only)
- A stored `is_active` flag or cron-based state updates for Breaking News/Advertisements
  (computed from the schedule instead — see the Breaking News and Advertisements sections)

## Open flags against the current schema

1. **Contact address — resolved, no schema change.** Confirmed against the actual schema:
   `Site Settings.contact_address` already exists as a nullable column. The Settings CMS
   page's General tab reads/writes it directly.
2. **Advertisement `placement` — resolved, no field.** Confirmed against the actual
   schema and CMS design: there is no `placement` column. `priority` is the only editorial
   control; the reader site distributes active ads across its own zones automatically.
3. **Article lifecycle schema cleanup** — with `Scheduled` publishing removed,
   `ArticleStatus` should be `DRAFT / PUBLISHED / ARCHIVED`, and `scheduled_deletion_at`
   is no longer needed. Apply these changes in Prisma before building the dependent features.
4. **Computed `is_active` for Breaking News and Advertisements** — do **not** add
   `is_active` columns to either table. The backend computes `is_active` from the
   start/end schedule and may include it in API responses for CMS display/filtering.
