-- Restores the two indexes backing article search. They were dropped from the
-- shared database by a failed `migrate dev` run, whose DROP INDEX statements
-- committed before a later statement in the same run failed.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "articles_search_vector_idx"
    ON "articles" USING GIN ("search_vector");

CREATE INDEX IF NOT EXISTS "articles_headline_trgm_idx"
    ON "articles" USING GIN ("headline" gin_trgm_ops);
