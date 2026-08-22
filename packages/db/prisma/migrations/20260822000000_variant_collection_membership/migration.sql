-- CreateTable
CREATE TABLE "VariantCollection" (
    "id" TEXT NOT NULL,
    "variantId" TEXT NOT NULL,
    "collectionId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VariantCollection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VariantCollection_collectionId_idx" ON "VariantCollection"("collectionId");

-- CreateIndex
CREATE UNIQUE INDEX "VariantCollection_variantId_collectionId_key" ON "VariantCollection"("variantId", "collectionId");

-- AddForeignKey
ALTER TABLE "VariantCollection" ADD CONSTRAINT "VariantCollection_variantId_fkey" FOREIGN KEY ("variantId") REFERENCES "Variant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariantCollection" ADD CONSTRAINT "VariantCollection_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "Collection"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- MigrateData
-- Copy each existing Product -> Collection membership to every Variant of that Product.
INSERT INTO "VariantCollection" ("id", "variantId", "collectionId", "createdAt")
SELECT
    'mig_' || pc."id" || '_' || v."id",
    v."id",
    pc."collectionId",
    pc."createdAt"
FROM "ProductCollection" pc
JOIN "Variant" v ON v."productId" = pc."productId";

-- DropForeignKey
ALTER TABLE "ProductCollection" DROP CONSTRAINT "ProductCollection_collectionId_fkey";

-- DropForeignKey
ALTER TABLE "ProductCollection" DROP CONSTRAINT "ProductCollection_productId_fkey";

-- DropTable
DROP TABLE "ProductCollection";
