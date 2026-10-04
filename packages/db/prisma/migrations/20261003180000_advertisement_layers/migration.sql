-- Reconciliation migration: this file did not exist in git history, but the
-- shared Supabase database's own `_prisma_migrations` table already recorded
-- a migration with this exact name as applied (built by another developer,
-- never committed, and currently unused by any application code). This
-- content is reconstructed from the live database's actual schema via
-- `prisma migrate diff`, not from the original file, so it represents the
-- net change rather than necessarily the original statements.

CREATE TABLE "public"."advertisement_layers" (
    "id" TEXT NOT NULL,
    "advertisement_id" TEXT NOT NULL,
    "media_id" TEXT NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "offset_x" INTEGER NOT NULL DEFAULT 0,
    "offset_y" INTEGER NOT NULL DEFAULT 0,
    "zoom" INTEGER NOT NULL DEFAULT 100,

    CONSTRAINT "advertisement_layers_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "advertisement_layers_advertisement_id_display_order_idx" ON "public"."advertisement_layers"("advertisement_id" ASC, "display_order" ASC);

CREATE INDEX "advertisement_layers_media_id_idx" ON "public"."advertisement_layers"("media_id" ASC);

ALTER TABLE "public"."advertisement_layers" ADD CONSTRAINT "advertisement_layers_advertisement_id_fkey" FOREIGN KEY ("advertisement_id") REFERENCES "public"."advertisements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "public"."advertisement_layers" ADD CONSTRAINT "advertisement_layers_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "public"."media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
