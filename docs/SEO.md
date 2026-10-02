TASK: REPLACE ONLY ARTICLE UUID URLs WITH SEO-FRIENDLY SLUG URLs

IMPORTANT:
All other SEO work is ALREADY COMPLETED.

DO NOT modify or rebuild:
- SEO metadata
- sitemap
- robots.txt
- canonical implementation
- Open Graph
- Twitter metadata
- NewsArticle schema
- Breadcrumb schema
- Organization schema
- WebSite schema
- category SEO
- homepage SEO
- existing performance architecture

Your ONLY task is to replace the public article URL identifier from UUID to slug.

==================================================
1. CURRENT ARTICLE URL
==================================================

Current:

/article/{uuid}

Example:

/article/550e8400-e29b-41d4-a716-446655440000

Change it to:

/article/{slug}

Example:

/article/udupi-heavy-rain-alert

==================================================
2. KEEP UUID AS DATABASE PRIMARY KEY
==================================================

DO NOT remove or replace the existing Article UUID.

Keep:

id UUID PRIMARY KEY

Add/use:

slug

The relationship must be:

id   → internal database identifier
slug → public article URL identifier

Do NOT change existing UUID relationships, foreign keys, or database references.

==================================================
3. SLUG FIELD
==================================================

Add `slug` to the existing Article model only if it does not already exist.

Requirements:

- string
- unique
- indexed
- lowercase
- ASCII only
- hyphen-separated
- URL-safe

Example:

"Udupi Heavy Rain Alert 2026"

→

"udupi-heavy-rain-alert-2026"

Allowed format:

[a-z0-9]+(?:-[a-z0-9]+)*

Do not allow:

- spaces
- underscores
- Kannada Unicode characters
- emojis
- special characters
- duplicate hyphens
- leading/trailing hyphens

==================================================
4. KANNADA ARTICLE SLUG
==================================================

VERY IMPORTANT:

Kannada article URLs MUST use an ENGLISH/ASCII slug.

Example Kannada headline:

ಉಡುಪಿ ಜಿಲ್ಲೆಯಲ್ಲಿ ಭಾರಿ ಮಳೆ

Do NOT create:

/article/ಉಡುಪಿ-ಜಿಲ್ಲೆಯಲ್ಲಿ-ಭಾರಿ-ಮಳೆ

Create:

/article/udupi-heavy-rain

or another meaningful English slug.

Slug generation priority:

1. Existing English headline, if available
2. Existing English SEO title, if available
3. CMS-provided English slug
4. Otherwise generate a concise English slug during article creation/editing
5. Admin will add the URLSLUG for kannada articles

DO NOT call a translation service when a visitor opens an article.

Translation/slug generation must NEVER happen during normal article page loading.

==================================================
5. SLUG GENERATION
==================================================

Create/reuse ONE centralized slug-generation utility.

Example:

generateSlug(title)

It should:

- lowercase
- normalize
- convert spaces to hyphens
- remove unsafe characters
- collapse duplicate hyphens
- remove leading/trailing hyphens
- guarantee ASCII output
- produce deterministic output

Do not create different slug-generation logic in multiple places.

==================================================
6. UNIQUE SLUG
==================================================

Slugs must be unique.

Example:

Article 1:

heavy-rain-alert

Article 2:

heavy-rain-alert

Second becomes:

heavy-rain-alert-2

Use the database UNIQUE constraint as the final protection.

Do not perform unnecessary repeated database queries.

Only check for collisions when creating/changing a slug.

==================================================
7. DO NOT CHANGE SLUG WHEN HEADLINE CHANGES
==================================================

Once an article is published:

headline:

Udupi Heavy Rain Alert

slug:

udupi-heavy-rain-alert

If the headline later changes to:

Heavy Rain Expected Across Udupi District

KEEP the existing slug.

Do not automatically regenerate it.

This prevents unnecessary URL changes.

==================================================
8. ARTICLE ROUTE
==================================================

Change the public article route from:

/article/[uuid]

to:

/article/[slug]

The normal article request must directly query:

WHERE slug = ?

Do NOT:

fetch all articles
→ search in JavaScript
→ find matching slug

Use the indexed slug column.

==================================================
9. BANDWIDTH REQUIREMENT — CRITICAL
==================================================

The purpose of this change is NOT to increase bandwidth usage.

DO NOT introduce additional API calls for slug handling.

Do NOT create:

/api/article-slug
/api/slug
/api/check-slug
/api/article-by-slug

for normal article page loading.

The article page should perform the same or fewer requests than the current implementation.

For:

/article/udupi-heavy-rain-alert

perform ONE normal article lookup using the slug, wherever possible.

Do not:

slug request
→ UUID request
→ article request

Avoid duplicate database/API requests.

==================================================
10. DATABASE QUERY OPTIMIZATION
==================================================

Ensure `slug` is indexed.

Normal article lookup:

WHERE slug = ?

must use the index.

Do not use SELECT * if the existing implementation can select only required fields.

Do not introduce N+1 queries.

Do not fetch the article once for slug resolution and again for rendering.

Reuse the article data already retrieved.

==================================================
11. CMS
==================================================

Only modify the article CMS functionality necessary for slug support.

When creating an article:

Headline:

Udupi Heavy Rain Alert

Automatically generate:

Slug:

udupi-heavy-rain-alert

Allow the editor to manually modify the slug.

For Kannada:

Headline:

ಉಡುಪಿ ಜಿಲ್ಲೆಯಲ್ಲಿ ಭಾರಿ ಮಳೆ

Generate/show:

Slug:

udupi-heavy-rain

Validate before saving.

Do not check slug availability on every keystroke.

If live validation is already present, debounce it.

Prefer server-side validation when saving.

==================================================
12. OLD UUID URL COMPATIBILITY
==================================================

Existing UUID URLs may already be indexed or shared.

Therefore preserve:

/article/{uuid}

as a backward-compatible route.

When an old UUID URL is requested:

1. Detect that the parameter is a UUID.
2. Look up the article by UUID.
3. Obtain its slug.
4. Permanently redirect directly to:

/article/{slug}

Example:

/article/550e8400-e29b-41d4-a716-446655440000

↓

301/308

↓

/article/udupi-heavy-rain-alert

Do NOT redirect to the homepage.

Do NOT use JavaScript redirects.

Do NOT use meta refresh.

Do NOT create redirect chains.

==================================================
13. REDIRECT BANDWIDTH OPTIMIZATION
==================================================

The UUID compatibility route may require one UUID lookup.

That is acceptable.

But the new slug route MUST NOT do:

slug → UUID lookup → article lookup

Instead:

slug → article lookup → render

Only old UUID URLs should require UUID resolution.

==================================================
14. CHANGED SLUG REDIRECTS
==================================================

If an already-published article's slug is manually changed:

OLD:

/article/udupi-heavy-rain

NEW:

/article/udupi-heavy-rain-alert

Create a permanent redirect:

old slug → new slug

Do not break existing links.

Do not create redirect chains.

If the existing project already has a redirect/history mechanism, reuse it.

Do not create a new system if one already exists.

==================================================
15. INTERNAL LINKS
==================================================

Change existing internal article links from:

/article/{uuid}

to:

/article/{slug}

Update only the article URL generation.

Do NOT modify unrelated navigation.

Check:

- homepage article cards
- latest articles
- featured articles
- category article cards
- related articles
- Editor's Choice
- search results
- breaking news links
- article recommendations

Internal links should point directly to the slug URL.

Do not intentionally link to the old UUID URL.

==================================================
16. DO NOT CHANGE OTHER ROUTES
==================================================

Do NOT modify:

/category/{slug}

/search

/preview

/admin

/cms

or any unrelated route.

This task concerns ARTICLE URLs only.

==================================================
17. EXISTING SEO IMPLEMENTATION
==================================================

The existing SEO implementation is already complete.

Only ensure that article URL generation now uses:

/article/{slug}

instead of:

/article/{uuid}

Do NOT rebuild the SEO system.

Do NOT create duplicate metadata fetching.

Do NOT create a separate SEO request for the slug.

Reuse the existing article data.

==================================================
18. PERFORMANCE REQUIREMENT
==================================================

Before making changes, inspect the current request flow.

After making changes, compare:

BEFORE:
- HTTP requests
- API requests
- database queries
- response size
- article page load

AFTER:
- HTTP requests
- API requests
- database queries
- response size
- article page load

The slug implementation must NOT add unnecessary requests.

Particularly avoid:

- extra slug API request
- extra article API request
- extra metadata API request
- extra translation API request
- extra database query for the same article
- client-side slug resolution

==================================================
19. DO NOT STORE ARTICLE CONTENT IN URL
==================================================

The slug should be descriptive but reasonably short.

Do not generate extremely long URLs from the entire article headline.

For example:

BAD:

/article/udupi-district-receives-heavy-rainfall-following-weather-department-warning-for-next-three-days

Prefer:

/article/udupi-heavy-rain-alert

Keep enough meaningful words to identify the article.

==================================================
20. DATABASE MIGRATION
==================================================

Before modifying the database:

1. Inspect the existing Article model.
2. Confirm whether `slug` already exists.
3. If absent, add it.
4. Add a unique index.
5. Generate slugs for existing articles.
6. Verify collisions.
7. Verify every published article has a valid slug.

Do NOT remove UUID IDs.

Do NOT change existing foreign keys.

Do NOT recreate the Article table unnecessarily.

Do NOT lose existing article data.

==================================================
21. EXISTING ARTICLES
==================================================

Every existing published article must receive a unique slug.

For English articles:

headline:

"Heavy Rain Alert in Udupi"

slug:

"heavy-rain-alert-in-udupi"

For Kannada articles:

headline:

"ಉಡುಪಿಯಲ್ಲಿ ಭಾರಿ ಮಳೆ"

slug:

"heavy-rain-in-udupi"

The generated Kannada slug MUST remain ASCII English.

If an accurate English translation cannot be generated automatically, use an existing English title/SEO title or provide a CMS-editable slug rather than producing a Kannada Unicode URL.

==================================================
22. VALIDATION
==================================================

Test all of these:

English article:

/article/udupi-heavy-rain-alert

Kannada article:

/article/udupi-heavy-rain

Old UUID:

/article/{uuid}

Invalid slug:

/article/does-not-exist

Duplicate slug

Changed slug

Draft article

Published article

Deleted article

Verify:

- valid slug → article
- old UUID → permanent redirect
- invalid slug → real 404
- duplicate slug → rejected
- changed slug → old URL redirects
- draft → remains protected/not publicly indexable
- deleted article → does not incorrectly redirect to homepage

==================================================
23. FINAL REQUIREMENT
==================================================

Make the SMALLEST possible code/database changes necessary to implement:

UUID internal ID
+
SEO-friendly slug public URL

Do not refactor unrelated code.

Do not rebuild existing SEO.

Do not add unnecessary APIs.

Do not increase database bandwidth.

Do not increase client requests.

Do not add translation requests during page loading.

Do not remove UUID support for old URLs.

Final architecture:

DATABASE:

id = UUID primary key
slug = unique indexed public identifier

PUBLIC:

/article/{slug}

BACKWARD COMPATIBILITY:

/article/{uuid}
        ↓
permanent redirect
        ↓
/article/{slug}

KANNADA:

Kannada headline
        ↓
English/ASCII slug
        ↓
/article/english-slug

PERFORMANCE:

slug lookup
        ↓
single efficient article retrieval
        ↓
reuse existing article data
        ↓
render page

Do not add any unnecessary request between these steps.

After implementation, provide a concise report containing:

1. Files changed
2. Database migration performed
3. New URL example
4. Kannada URL example
5. UUID redirect behavior
6. Number of additional API requests introduced (must be 0 if possible)
7. Number of additional database queries introduced for normal slug article pages (must be 0 if possible)
8. Any risks or migration issues found