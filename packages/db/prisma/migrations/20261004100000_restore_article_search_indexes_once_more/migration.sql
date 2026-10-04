-- The previous migration (20261004093759_add_ad_fit_mode) was unrelated to
-- search, but Prisma's auto-generated diff can't see indexes on an
-- `Unsupported` tsvector column from the schema side, so it incorrectly
-- proposed dropping these two - and did, before failing on a later
-- statement it also shouldn't have included (altering a generated column
-- the same wrong way). The underlying `search_vector` generated column and
-- its data were never affected; only these two indexes were actually lost.
-- Restoring them exactly as the original 20260911090000 migration defined
-- them.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "articles_search_vector_idx"
    ON "articles" USING GIN ("search_vector");

CREATE INDEX IF NOT EXISTS "articles_headline_trgm_idx"
    ON "articles" USING GIN ("headline" gin_trgm_ops);
