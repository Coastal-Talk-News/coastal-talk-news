-- CreateTable
CREATE TABLE "article_views" (
    "id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "article_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "article_views_viewed_at_idx" ON "article_views"("viewed_at");

-- CreateIndex
CREATE INDEX "article_views_article_id_idx" ON "article_views"("article_id");

-- AddForeignKey
ALTER TABLE "article_views" ADD CONSTRAINT "article_views_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
