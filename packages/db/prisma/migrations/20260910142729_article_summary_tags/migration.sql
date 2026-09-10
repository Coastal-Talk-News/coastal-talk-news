-- summary is required going forward. Existing rows are backfilled to '' via
-- the DEFAULT on the ADD COLUMN itself (the standard NOT NULL-with-existing-rows
-- idiom), then the default is dropped so new writes must supply it explicitly —
-- matching headline/content, which have no DB-level default either.
ALTER TABLE "articles" ADD COLUMN "summary" TEXT NOT NULL DEFAULT '';
ALTER TABLE "articles" ALTER COLUMN "summary" DROP DEFAULT;

-- tags: free text, author-entered — no controlled taxonomy, defaults to empty.
ALTER TABLE "articles" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- endAt nullable: an admin can run a breaking-news item indefinitely from
-- startAt and take it down by deleting the row instead of scheduling an end.
ALTER TABLE "breaking_news" ALTER COLUMN "end_at" DROP NOT NULL;
