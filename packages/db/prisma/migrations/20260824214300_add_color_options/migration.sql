-- AlterTable
ALTER TABLE "Variant" ADD COLUMN     "colorId" TEXT;

-- CreateTable
CREATE TABLE "ColorOption" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hex" CHAR(7) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColorOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ColorOption_name_key" ON "ColorOption"("name");

-- CreateIndex
CREATE INDEX "Variant_colorId_idx" ON "Variant"("colorId");

-- AddForeignKey
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_colorId_fkey" FOREIGN KEY ("colorId") REFERENCES "ColorOption"("id") ON DELETE SET NULL ON UPDATE CASCADE;
