-- Old slugs of published articles, so links shared before an editor changed
-- a slug keep arriving. Additive: the API already deployed never reads it.

-- CreateTable
CREATE TABLE "article_slug_redirects" (
    "slug" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_slug_redirects_pkey" PRIMARY KEY ("slug")
);

-- CreateIndex
CREATE INDEX "article_slug_redirects_article_id_idx" ON "article_slug_redirects"("article_id");

-- AddForeignKey
ALTER TABLE "article_slug_redirects" ADD CONSTRAINT "article_slug_redirects_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
