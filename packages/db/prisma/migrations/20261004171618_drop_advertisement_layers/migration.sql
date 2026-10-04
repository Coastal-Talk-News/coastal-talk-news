-- Removes advertisement_layers: another developer's in-progress, unused
-- "composed ad" work (see the AdvertisementLayer model that used to sit in
-- schema.prisma) - no application code in this repo ever read or wrote it,
-- and the product owner confirmed it should be dropped rather than kept
-- around unused.
--
-- `prisma migrate diff` also proposed dropping the two full-text-search
-- indexes and the search_vector generated column's default - that is the
-- same recurring false positive documented on the two migrations before
-- this one (Prisma can't see indexes/expressions on an `Unsupported`
-- tsvector column from the schema side), not a real part of this change,
-- so only the statements that actually belong to this change are kept.

-- DropForeignKey
ALTER TABLE "advertisement_layers" DROP CONSTRAINT "advertisement_layers_advertisement_id_fkey";

-- DropForeignKey
ALTER TABLE "advertisement_layers" DROP CONSTRAINT "advertisement_layers_media_id_fkey";

-- DropTable
DROP TABLE "advertisement_layers";
