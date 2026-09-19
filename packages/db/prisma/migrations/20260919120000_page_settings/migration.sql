-- AlterTable
ALTER TABLE "site_settings" ADD COLUMN "about_title" TEXT,
ADD COLUMN "about_intro" TEXT,
ADD COLUMN "about_content" JSONB,
ADD COLUMN "about_email" TEXT,
ADD COLUMN "about_phone" TEXT,
ADD COLUMN "contact_title" TEXT,
ADD COLUMN "contact_intro" TEXT,
ADD COLUMN "contact_hours" TEXT,
ADD COLUMN "advertise_title" TEXT,
ADD COLUMN "advertise_intro" TEXT,
ADD COLUMN "advertise_content" JSONB,
ADD COLUMN "advertise_email" TEXT,
ADD COLUMN "advertise_phone" TEXT;
