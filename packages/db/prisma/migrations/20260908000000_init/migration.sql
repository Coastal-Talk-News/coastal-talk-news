-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Hosted Postgres providers differ on where extensions live: Supabase installs
-- them into an "extensions" schema, most others into "public". Without that
-- schema on the search path, the gin_trgm_ops operator class at the bottom of
-- this file cannot be resolved and index creation fails.
--
-- Setting a search_path entry for a schema that does not exist is not an error
-- in Postgres, so this is safe on providers that use "public".
SET search_path TO public, extensions;

-- Trigram matching, used to catch near-miss headline searches that strict
-- full-text matching would drop.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('ENGLISH', 'KANNADA');

-- CreateEnum
CREATE TYPE "ArticleStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArticlePriority" AS ENUM ('LEAD_STORY', 'FEATURED', 'NORMAL');

-- CreateTable
CREATE TABLE "media_assets" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "storage_key" TEXT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "width" INTEGER NOT NULL,
    "height" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "media_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "media_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "articles" (
    "id" TEXT NOT NULL,
    "category_id" TEXT NOT NULL,
    "media_id" TEXT,
    "og_image_id" TEXT,
    "language" "Language" NOT NULL,
    "headline" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "content_text" TEXT NOT NULL,
    "youtube_url" TEXT,
    "priority" "ArticlePriority" NOT NULL DEFAULT 'NORMAL',
    "status" "ArticleStatus" NOT NULL DEFAULT 'DRAFT',
    "publication_date" TIMESTAMP(3),
    "seo_title" TEXT,
    "meta_description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "articles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "breaking_news" (
    "id" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "article_url" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "breaking_news_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "advertisements" (
    "id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "advertiser_name" TEXT NOT NULL,
    "destination_url" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advertisements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cms_users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cms_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "site_settings" (
    "id" TEXT NOT NULL,
    "site_name" TEXT NOT NULL,
    "tagline" TEXT,
    "description" TEXT,
    "logo_media_id" TEXT,
    "favicon_media_id" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "contact_address" TEXT,
    "facebook_url" TEXT,
    "instagram_url" TEXT,
    "youtube_url" TEXT,
    "x_url" TEXT,
    "default_ui_language" "Language" NOT NULL DEFAULT 'KANNADA',
    "default_seo_title" TEXT,
    "default_meta_description" TEXT,
    "default_og_image_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "media_assets_storage_key_key" ON "media_assets"("storage_key");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE INDEX "categories_is_active_display_order_idx" ON "categories"("is_active", "display_order");

-- CreateIndex
CREATE INDEX "articles_status_publication_date_idx" ON "articles"("status", "publication_date" DESC);

-- CreateIndex
CREATE INDEX "articles_category_id_status_publication_date_idx" ON "articles"("category_id", "status", "publication_date" DESC);

-- CreateIndex
CREATE INDEX "articles_status_priority_publication_date_idx" ON "articles"("status", "priority", "publication_date" DESC);

-- CreateIndex
CREATE INDEX "articles_language_idx" ON "articles"("language");

-- CreateIndex
CREATE INDEX "breaking_news_start_at_end_at_idx" ON "breaking_news"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "advertisements_start_at_end_at_idx" ON "advertisements"("start_at", "end_at");

-- CreateIndex
CREATE INDEX "advertisements_priority_created_at_idx" ON "advertisements"("priority" DESC, "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "cms_users_email_key" ON "cms_users"("email");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "articles" ADD CONSTRAINT "articles_og_image_id_fkey" FOREIGN KEY ("og_image_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_logo_media_id_fkey" FOREIGN KEY ("logo_media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_media_id_fkey" FOREIGN KEY ("favicon_media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_default_og_image_id_fkey" FOREIGN KEY ("default_og_image_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Full-text search over articles.
--
-- Kept as a Postgres GENERATED column rather than maintained by the API so the
-- index can never drift from the row it describes.
--
-- The 'simple' text search configuration is deliberate: 'english' would apply
-- English stemming and stop-word removal, which is wrong for the Kannada half
-- of the corpus and would silently drop legitimate matches. 'simple' just
-- lowercases and tokenises, which behaves correctly for both languages.
--
-- Headline is weighted 'A' above body text 'B' so a query matching a headline
-- outranks one that only appears deep in an article body.
ALTER TABLE "articles"
    ADD COLUMN "search_vector" tsvector
    GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', coalesce("headline", '')), 'A') ||
        setweight(to_tsvector('simple', coalesce("content_text", '')), 'B')
    ) STORED;

-- CreateIndex
CREATE INDEX "articles_search_vector_idx" ON "articles" USING GIN ("search_vector");

-- CreateIndex
CREATE INDEX "articles_headline_trgm_idx" ON "articles" USING GIN ("headline" gin_trgm_ops);
