-- AlterTable
ALTER TABLE "categories" ADD COLUMN "parent_id" TEXT;

-- CreateIndex
CREATE INDEX "categories_parent_id_display_order_idx" ON "categories"("parent_id", "display_order");

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
