-- AlterTable
ALTER TABLE "cms_users" ADD COLUMN     "totp_enabled_at" TIMESTAMP(3),
ADD COLUMN     "totp_last_step" INTEGER,
ADD COLUMN     "totp_secret" TEXT;

-- CreateTable
CREATE TABLE "cms_recovery_codes" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cms_recovery_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cms_recovery_codes_code_hash_key" ON "cms_recovery_codes"("code_hash");

-- CreateIndex
CREATE INDEX "cms_recovery_codes_user_id_idx" ON "cms_recovery_codes"("user_id");

-- AddForeignKey
ALTER TABLE "cms_recovery_codes" ADD CONSTRAINT "cms_recovery_codes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cms_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
