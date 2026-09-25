# Project Scope — Coastal Talk News

> **Status: confirmed — this revision supersedes all earlier versions of this file.**
> Three product decisions were locked in an earlier pass (UI language, publishing model,
> article deletion — see the table below). This revision refines how Breaking News and
> Advertisement "active" state works: it's computed from the schedule, not stored.

## Decisions locked in this revision

**Revision note (2026-09-12):** the "no runtime language switcher" UI-language decision below
is reversed — see the row itself for what replaced it. Article publishing and deletion are
unchanged from the original pass.

**Revision note (2026-09-16):** the header EN/Kannada toggle now also filters which language's
articles the homepage and category pages display (previously both languages appeared together,
unsegregated). Search is unaffected — it already had its own independent content-language
filter, which stays as-is.

| Topic              | Decision                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI language        | **Runtime English/Kannada toggle.** A header control lets a reader switch the interface chrome (nav labels, buttons, empty states, dates) between English and Kannada; the choice takes effect immediately and lasts only for that visit — it is held in a session cookie that is also reset whenever someone arrives from outside the site (a typed address, bookmark, search result or shared link), so every visit starts in English. The exception is an article link, which opens in the language the article is written in. This is real translation of a small, hand-maintained UI-string dictionary (`apps/web/lib/i18n`) — not machine translation, and no Google Translate–style page-rewriting widget (those mutate the DOM outside of React and are a well-known source of crashes on frameworks like this one). Article headline, summary and body content are never translated and always render exactly as the newsroom wrote them. As of the 2026-09-16 revision, the same toggle also controls which `Article.language` the homepage and category pages display — switching to EN shows only English articles, switching to Kannada shows only Kannada articles. |
| Article publishing | **Simple: Draft → Published only.** No `Scheduled` status, no future-dated auto-publish. Hitting Publish sets `publication_date` to the current time immediately.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Article deletion   | **Both actions available**, on any article: **Archive** (soft — status becomes `Archived`, row stays in the DB, hidden from the public site) and **Delete** (hard — the row is permanently removed, subject to the media reference rule in §9 below).                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## Overview

A local news product covering Udupi, Manipal, Mangalore, Karnataka, and India more broadly.
Two front doors against one API: the public website (readers) and the CMS (the internal
publication team). The CMS publishes both Kannada and English articles side by side; the
site interface itself is single-language. Fully responsive.

## Public website

### Header & navigation

Common header across the main pages: logo, site name, main nav, search, mobile menu, an
English/Kannada UI-language toggle. Navigation reflects the _active_ categories from the
CMS — deactivating a category (`Category.is_active = false`) must remove it from public
navigation immediately.

### Homepage

**Revision note (2026-09-17):** the homepage feed is priority- and date-driven again,
superseding the 2026-09-11 note below it. `Article.priority` (Lead Story / Featured / Normal,
set per-article in the CMS) now drives the top of the page directly, and category browsing
moves out of the homepage entirely — the header nav already covers it, so repeating it mid-page
was redundant.

<details>
<summary>2026-09-11 note (superseded)</summary>

the homepage feed is category-driven, not priority-driven. `Article.priority`
(Lead Story / Featured) remains a CMS field editors can set, but the public homepage no
longer reads it — this supersedes the priority-based Lead Story / Featured / Latest News
layout described in earlier revisions of this file.

</details>

- **Breaking News** — prominent strip, only items currently within their `start_at`/`end_at`
  window, scrolling continuously; each item links out via its own `article_url`
- **Advertisements** — a horizontal band of predefined placements, responsive, proportions
  preserved
- **Lead Stories** — the hero banner is the single most recent `LEAD_STORY` article; a compact
  strip beside/below it carries the next few. A "View all Lead Stories" link opens the
  dedicated `/lead-stories` page (same lead-card-plus-grid layout as a category page,
  paginated). If no article has been marked a lead story yet, the hero falls back to whatever
  article is most recent overall, so the homepage is never empty on day one.
- **Featured** — a grid of the most recent `FEATURED` articles, with its own "View all
  Featured" link to a dedicated `/featured` page (same layout as Lead Stories').
- **Category preview rows** — one row per active category that has a published article (every
  one, not a chosen few), each showing a handful of its own most recent articles and a "View
  all in {Category}" link to that category's existing page. An article already shown in Lead
  Stories or Featured doesn't repeat in its own category's row.

There is no category-browsing block on the homepage itself — categories live only in the
header nav.

Every "View all" link is conditional: it appears only when the page behind it actually holds
more than the homepage already shows, so a link never leads to a page the reader has just
finished looking at. Section grids size their columns to the number of cards in them (three
cards in a three-column row, not four columns with a hole at the end).

Articles are filtered to the reader's active UI-language (the header EN/Kannada toggle) —
switching languages switches which language's articles populate every section above.
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
published articles (newest first, filtered to the active UI-language same as the homepage),
ads in defined locations.

### Lead Stories & Featured pages

Two dedicated pages, `/lead-stories` and `/featured`, reached from their "View all" link on
the homepage — a static heading/description instead of a category's own, otherwise identical
in layout and behaviour to a category page: lead card plus grid, paginated, filtered to the
active UI-language.

### Search

Free-text search over published articles. Results show headline, image (when available),
category, publication date. Has a proper no-results state. Includes a content-language
filter — All / English / Kannada. This filters _which language of article_ appears in
results; it is not the same thing as a UI language switcher, and stays in scope.

### About, Contact & Advertise

Three separate pages, each with its own tab in Settings rather than sharing Settings →
General (revised 2026-09-19 — they were previously one combined page).

- **About Us** — heading, introduction and a rich-text body written in the same editor as
  a news article, so the newsroom can use headings, lists and links without a deploy.
- **Contact Us** — heading, introduction, and the single set of contact details (email,
  phone, address, office hours) that the footer and the other pages also read.
- **Advertise** — heading, introduction and a rich-text body, with the currently running
  advertisements listed underneath.

Every field is optional and falls back to a site-wide value, so the pages render before
anyone has filled them in. No contact form in V1.

**Privacy Policy** (added 2026-09-25) is a fourth standalone page with its own Settings tab:
a single rich-text body, no editable heading or introduction. It is reached from a
"Privacy Policy" link under the footer's Contact details, at `/privacy-policy`, and shows a
short "not added yet" note until the newsroom writes it.

### Website states

404 (with a clear way back), search no-results, empty category, loading state. Pure
frontend behavior, no CMS management needed.

## CMS (admin panel)

Sections: Login, Dashboard, News, Create/Edit News, Categories, Breaking News,
Advertisements, Media Library, Settings. No separate Users/roles management in V1.

### Login

Email + password, then a second factor. Only authenticated CMS users can reach the admin area.

- **First sign-in:** after the password, the user sets up an authenticator app (scan the QR
  code, confirm with a 6-digit code, save 10 one-time recovery codes) and lands on the
  dashboard. Nothing is seeded into the database; enrolment happens through this flow.
- **Every later sign-in:** password, then a 6-digit code or a recovery code.
- **Settings → Security:** reset the authenticator (needs password + a current code or
  recovery code; other sessions are signed out) and generate a new set of recovery codes.
- **Lost phone and recovery codes:** an operator runs `pnpm --filter @coastal-talk-news/db
db:reset-2fa <email>`; the user enrols again on next sign-in.

### Dashboard

A light overview with shortcuts: create news, manage news, scheduled/recent items,
breaking news, advertisements, media, categories. No analytics dashboard — no Most
Viewed, Most Read, or reader traffic analytics of any kind.

### News (list/manage)

View, search, and filter articles by language (All / English / Kannada), status (Draft /
Published / Archived — `Scheduled` no longer exists), and category.

### Create/Edit News

| Field                                     | Required | Notes                                                                            |
| ----------------------------------------- | -------- | -------------------------------------------------------------------------------- |
| Field                                     | Required | Notes                                                                            |
| ----------------------------------------- | -------- | ---------------------------------------------------                              |
| Language                                  | Yes      | English or Kannada                                                               |
| Category                                  | Yes      | one category per article                                                         |
| Headline                                  | Yes      |                                                                                  |
| Summary                                   | Yes      | shown in listings and social previews; distinct from SEO meta description        |
| Content                                   | Yes      |                                                                                  |
| Featured image                            | No       | from Media Library or new upload                                                 |
| YouTube URL                               | No       | renders inline on the article page if set                                        |
| Tags                                      | No       | free text, author-entered; no controlled taxonomy, no filtering in V1            |
| Editorial priority                        | —        | Lead Story / Featured / Normal — drives homepage placement, see Homepage section |
| Status                                    | —        | Draft or Published — no Scheduled option                                         |
| SEO title / meta description / OG image   | No       | set alongside the article, no separate screen                                    |

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

Fields: advertiser name, banner image, detail image (optional), description (optional
rich text), destination URL (optional), placement, start/end datetime. Order within a
placement is not a field the admin fills in — see below.

**Every advertisement has its own page** on the reader site at `/advertisement/{id}`,
with all of them listed at `/advertisements`. A banner in any zone links to that page
rather than straight out to the advertiser; the advertiser's own URL is a button on the
page. Advertisements form one fixed "Advertisement" section, hardcoded on the reader site
rather than stored as a Category, so it never appears in category navigation.

**`placement` chooses the ad's zone: Masthead, Top or Right Side (Sidebar).** The CMS
create/edit form offers all three (default Right Side). Masthead is the single premium
slot beside the site name, capped at 1. Top is a 320.57×73.88 band capped at 3. Right
Side is a 250×300 rail with no cap. Each zone is priced separately, which is why
placement is a stored field rather than a rendering detail. Caps count only bookings
whose run **overlaps** the one being saved, enforced server-side (409 Conflict), so a
finished booking frees its slot. This reverses the earlier "no placement field,
confirmed" decision recorded here and in DATA-MODEL.md; the reversal is final.

**Order within Top and Right Side is set by dragging, not by typing a number.** The
Advertisements page is organised as one tab per placement; within the Top and Right Side
tabs the admin drags a row to reorder it, and that order is what the reader site shows,
top to bottom — the same drag-to-reorder the Categories page already uses. Top and Right
Side are ordered independently of each other, per the client's explicit direction: they
are "not prioritized collectively." A tie (an ad nobody has manually positioned yet)
falls back to the most recently started campaign. Masthead has no manual order — its
capacity of 1 means only one ad is ever live regardless. An earlier version of this field
was a plain "priority" number the admin typed in, sorted highest-first across every zone
together; it was dropped because the admin had no way to see the resulting order without
comparing numbers row by row, and a shared number line for zones with different capacities
invited exactly that confusion.

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

Up to two images per ad - the banner shown in its zone, and an optional larger detail
image for the ad's own page - each any resolution, rendered responsively with aspect
ratio preserved. No separate desktop/tablet/mobile variants in V1. Optimized server-side on upload (Sharp).

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
- **Password & Security** — change the signed-in user's own password. Needs the current
  password. The new one must have at least 8 characters (72 at most, bcrypt's limit) with
  an uppercase letter, a lowercase letter, a number and a special character, and differ
  from the current one; the rules live in one place, `packages/validation`
  (`password-policy.ts`), so the API enforces exactly what the CMS shows as a live
  checklist. On success the current device stays signed in and every other device is
  signed out; the API also gives the current device a fresh session token. Five attempts
  per user per 15 minutes. (`POST /api/v1/cms/auth/change-password`; a wrong current
  password is a `400 INVALID_CURRENT_PASSWORD`, never a 401, so the CMS doesn't mistake a
  typo for an expired session.)

No CMS-side "Language Settings" screen is needed: the reader's UI-language choice is
per-visitor (a cookie set by the header toggle), not a site-wide setting an admin
configures. `Site Settings.default_ui_language` predates the toggle, is not read by it
(the toggle's own first-visit default is a fixed English), and remains unused — a
pre-existing, still-open cleanup item, not something this revision resolves.

## Public ↔ CMS mapping

Every editorial piece of content on the public site must be traceable to a CMS control.

| Public website                                | Managed from CMS                                  |
| --------------------------------------------- | ------------------------------------------------- |
| Website name, logo                            | Settings → General                                |
| Navigation categories                         | Categories                                        |
| Homepage Lead Stories / Featured              | News → Editorial priority (Lead Story / Featured) |
| Homepage category preview rows                | Categories order + News (automatic by recency)    |
| Category sections                             | Categories + News                                 |
| Breaking News                                 | Breaking News                                     |
| Article content / image / YouTube video / SEO | News + Media Library                              |
| Category name / cover image                   | Categories + Media Library                        |
| Search results                                | Published News                                    |
| About / Contact / Social                      | Settings → General                                |
| Advertisements + images                       | Advertisements + Media Library                    |

Pure website behavior needing no CMS control: responsive layout, loading states, 404,
search no-results, mobile menu behavior, image responsiveness.

## Explicitly out of scope for V1

- Reader accounts, reader login, comments, likes, bookmarks, following, notifications
- Reporter accounts, reporter approval workflows
- CMS user roles/permissions (single-tier admin access)
- Complex analytics dashboard, Most Read / Most Viewed, any reader traffic analytics
- Automatic article translation (the UI-language toggle — see decisions table above —
  translates chrome text only; it never translates or machine-translates article content)
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
2. **Advertisement `placement` — resolved, field added.** The schema now has a
   `placement` enum column (`TOP` / `SIDEBAR`, default `SIDEBAR`). The CMS exposes a
   Top / Right Side choice; Top is capped at exactly 3 active ads, enforced
   server-side with a 409 Conflict. This reverses the earlier "no placement field"
   resolution recorded above — see the Advertisements section for the current design.
3. **Article lifecycle schema cleanup** — with `Scheduled` publishing removed,
   `ArticleStatus` should be `DRAFT / PUBLISHED / ARCHIVED`, and `scheduled_deletion_at`
   is no longer needed. Apply these changes in Prisma before building the dependent features.
4. **Computed `is_active` for Breaking News and Advertisements** — do **not** add
   `is_active` columns to either table. The backend computes `is_active` from the
   start/end schedule and may include it in API responses for CMS display/filtering.
