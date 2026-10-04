-- Reconciliation migration: this file did not exist in git history, but the
-- shared Supabase database's own `_prisma_migrations` table already recorded
-- a migration with this exact name as applied (built by another developer,
-- never committed). This content is reconstructed from the live database's
-- actual schema via `prisma migrate diff`, not from the original file, so it
-- represents the net change rather than necessarily the original statements.

ALTER TYPE "public"."AdPlacement" ADD VALUE 'FOOTER';
