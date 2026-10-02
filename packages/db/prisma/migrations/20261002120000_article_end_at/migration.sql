-- Optional scheduled end for an article. Additive and nullable: the API
-- already deployed never reads it, so every article simply has no end.

-- AlterTable
ALTER TABLE "articles" ADD COLUMN     "end_at" TIMESTAMP(3);
