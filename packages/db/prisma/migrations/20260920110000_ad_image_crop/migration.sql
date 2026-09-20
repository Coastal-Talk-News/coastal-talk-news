-- Replaces the fit/focal pair with a crop frame: the CMS now pans and zooms
-- the creative inside the slot instead of choosing between two fit modes.
ALTER TABLE "advertisements" DROP COLUMN "image_fit",
DROP COLUMN "focal_x",
DROP COLUMN "focal_y",
ADD COLUMN "zoom" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN "offset_x" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "offset_y" INTEGER NOT NULL DEFAULT 0;

DROP TYPE "AdFit";
