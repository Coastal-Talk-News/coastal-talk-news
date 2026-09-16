-- AlterEnum
ALTER TYPE "AdPlacement" ADD VALUE 'MASTHEAD';

-- AlterTable
ALTER TABLE "advertisements" ADD COLUMN     "description" JSONB,
ADD COLUMN     "description_text" TEXT,
ADD COLUMN     "detail_media_id" TEXT,
ALTER COLUMN "destination_url" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "advertisements" ADD CONSTRAINT "advertisements_detail_media_id_fkey" FOREIGN KEY ("detail_media_id") REFERENCES "media_assets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
