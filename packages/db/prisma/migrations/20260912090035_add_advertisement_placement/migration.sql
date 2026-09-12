-- CreateEnum
CREATE TYPE "AdPlacement" AS ENUM ('TOP', 'SIDEBAR');

-- AlterTable
ALTER TABLE "advertisements" ADD COLUMN     "placement" "AdPlacement" NOT NULL DEFAULT 'SIDEBAR';

-- CreateIndex
CREATE INDEX "advertisements_placement_idx" ON "advertisements"("placement");
