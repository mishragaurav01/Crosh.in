-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT';

-- Data migration: pre-existing products were live in the storefront and must
-- stay visible; only rows created after this migration default to DRAFT.
UPDATE "Product" SET "status" = 'PUBLISHED';
