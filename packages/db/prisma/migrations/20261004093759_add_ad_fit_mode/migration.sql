-- CreateEnum
CREATE TYPE "AdFitMode" AS ENUM ('FILL', 'FIT_SHRINK', 'FIT_SPACE', 'FIT_BACKGROUND');

-- AlterTable
ALTER TABLE "advertisements" ADD COLUMN     "fit_mode" "AdFitMode" NOT NULL DEFAULT 'FIT_SHRINK';
