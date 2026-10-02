-- Additive only: every new column is nullable, so the API version already
-- deployed (which knows nothing of these) keeps writing rows without them.
-- Slugs for existing rows are filled by `pnpm db:backfill-slugs` (apps/api);
-- a unique index allows any number of NULLs while that runs.

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "meta_description" TEXT,
ADD COLUMN     "seo_title" TEXT,
ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN     "google_site_verification" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "articles_slug_key" ON "articles"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "categories"("slug");
