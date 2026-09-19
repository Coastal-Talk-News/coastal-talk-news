-- description: the About page now holds its own content, which left this as a
-- duplicate of default_meta_description that shipped in every page's payload.
-- Verified empty (NULL) before removal.
--
-- about_/advertise_ email and phone: there is one newsroom and one set of
-- contact details, kept in the Contact settings. Per-page overrides were
-- unused fields carrying no information.
ALTER TABLE "site_settings" DROP COLUMN "description",
DROP COLUMN "about_email",
DROP COLUMN "about_phone",
DROP COLUMN "advertise_email",
DROP COLUMN "advertise_phone";
