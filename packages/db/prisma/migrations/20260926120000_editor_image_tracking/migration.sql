-- How the featured image is framed; '{}' means the default, so no NULLs.
ALTER TABLE "articles" ADD COLUMN "featured_image_layout" JSONB NOT NULL DEFAULT '{}';

CREATE TYPE "site_page" AS ENUM ('ABOUT', 'ADVERTISE', 'PRIVACY');

CREATE TABLE "article_media" (
    "article_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,

    CONSTRAINT "article_media_pkey" PRIMARY KEY ("article_id","media_id")
);

CREATE TABLE "site_page_media" (
    "page" "site_page" NOT NULL,
    "media_id" TEXT NOT NULL,

    CONSTRAINT "site_page_media_pkey" PRIMARY KEY ("page","media_id")
);

CREATE INDEX "article_media_media_id_idx" ON "article_media"("media_id");
CREATE INDEX "site_page_media_media_id_idx" ON "site_page_media"("media_id");

ALTER TABLE "article_media" ADD CONSTRAINT "article_media_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "article_media" ADD CONSTRAINT "article_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "site_page_media" ADD CONSTRAINT "site_page_media_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Pictures already placed in existing bodies were never tracked. Body images
-- have only ever stored a delivery URL, which always contains the asset's
-- storage key, so a substring match finds every one of them.
INSERT INTO "article_media" ("article_id", "media_id")
SELECT a."id", m."id"
FROM "articles" a
JOIN "media_assets" m ON position(m."storage_key" in a."content"::text) > 0;

INSERT INTO "site_page_media" ("page", "media_id")
SELECT p."page"::"site_page", m."id"
FROM "site_settings" s
CROSS JOIN LATERAL (VALUES
  ('ABOUT', coalesce(s."about_content"::text, '') || coalesce(s."about_content_kannada"::text, '')),
  ('ADVERTISE', coalesce(s."advertise_content"::text, '')),
  ('PRIVACY', coalesce(s."privacy_content"::text, ''))
) AS p("page", "body")
JOIN "media_assets" m ON position(m."storage_key" in p."body") > 0;
