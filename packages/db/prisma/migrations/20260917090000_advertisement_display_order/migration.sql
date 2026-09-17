-- Ordering moves from a single "priority" number (same scale across every
-- zone, sorted highest-first) to a per-placement position set only by
-- dragging in the CMS. The column is renamed to say what it now means, and
-- the ordering runs ascending: position 0 is first.
ALTER TABLE "advertisements" RENAME COLUMN "priority" TO "display_order";

DROP INDEX "advertisements_priority_created_at_idx";
DROP INDEX "advertisements_placement_idx";

CREATE INDEX "advertisements_placement_display_order_idx" ON "advertisements"("placement", "display_order");

-- Give every existing row a dense position within its own placement, in its
-- prior priority order (ties broken by start date), so nothing's relative
-- position changes on this migration.
WITH ranked AS (
  SELECT id, row_number() OVER (
    PARTITION BY placement
    ORDER BY display_order DESC, start_at DESC
  ) - 1 AS new_order
  FROM "advertisements"
)
UPDATE "advertisements" AS a
SET display_order = ranked.new_order
FROM ranked
WHERE a.id = ranked.id;
