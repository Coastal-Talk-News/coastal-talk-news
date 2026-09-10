-- Reconstructed from live-database drift, not authored against a local
-- migration diff: this migration was applied directly to the shared dev DB
-- (presumably alongside the Media Library work) without its file being
-- committed. The three statements below are exactly what Prisma's own drift
-- report named as already live — this file only brings migration history
-- back in sync with that reality; `prisma migrate resolve --applied` marks
-- it applied without re-running it.

-- AlterTable
ALTER TABLE "articles" ALTER COLUMN "category_id" DROP NOT NULL;

-- DropIndex
DROP INDEX IF EXISTS "articles_headline_trgm_idx";

-- DropIndex
DROP INDEX IF EXISTS "articles_search_vector_idx";
