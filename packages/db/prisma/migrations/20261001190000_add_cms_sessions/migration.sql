-- CreateTable
CREATE TABLE "cms_sessions" (
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMP(3) NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "cms_sessions_pkey" PRIMARY KEY ("token_hash")
);

-- CreateIndex
CREATE INDEX "cms_sessions_user_id_last_seen_at_idx" ON "cms_sessions"("user_id", "last_seen_at");

-- CreateIndex
CREATE INDEX "cms_sessions_expires_at_idx" ON "cms_sessions"("expires_at");

-- AddForeignKey
ALTER TABLE "cms_sessions" ADD CONSTRAINT "cms_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "cms_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
