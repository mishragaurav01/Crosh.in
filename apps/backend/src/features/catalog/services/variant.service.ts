import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";

export async function createVariant(params: {
  productId: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  prisma: PrismaClient;
}): Promise<{ id: string; sku: string; size: string; color: string; price: number; stock: number; productId: string; createdAt: Date; updatedAt: Date }> {
  const { productId, sku, size, color, price, stock, prisma } = params;

  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new CatalogError("INVALID_PRODUCT", "Product does not exist", 400);
  }

  try {
    return await prisma.variant.create({
      data: { sku, size, color, price, stock, productId },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SKU", "A variant with this SKU already exists", 409);
    }
    throw error;
  }
}

export async function listVariants(params: {
  productId: string;
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<{ data: Array<{ id: string; sku: string; size: string; color: string; price: number; stock: number; productId: string; createdAt: Date; updatedAt: Date }>; total: number; page: number; limit: number }> {
  const { productId, page, limit, prisma } = params;

  await requireProduct(productId, prisma);

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.variant.findMany({
      where: { productId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.variant.count({ where: { productId } }),
  ]);

  return { data, total, page, limit };
}

export async function getVariant(params: {
  productId: string;
  variantId: string;
  prisma: PrismaClient;
}): Promise<{ id: string; sku: string; size: string; color: string; price: number; stock: number; productId: string; createdAt: Date; updatedAt: Date }> {
  const { productId, variantId, prisma } = params;

  await requireProduct(productId, prisma);

  const variant = await prisma.variant.findFirst({
    where: { id: variantId, productId },
  });
  if (!variant) {
    throw new CatalogError("VARIANT_NOT_FOUND", "Variant not found", 404);
  }
  return variant;
}

export async function updateVariant(params: {
  productId: string;
  variantId: string;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  stock?: number;
  prisma: PrismaClient;
}): Promise<{ id: string; sku: string; size: string; color: string; price: number; stock: number; productId: string; createdAt: Date; updatedAt: Date }> {
  const { productId, variantId, sku, size, color, price, stock, prisma } = params;

  await getVariant({ productId, variantId, prisma });

  try {
    return await prisma.variant.update({
      where: { id: variantId },
      data: {
        ...(sku !== undefined && { sku }),
        ...(size !== undefined && { size }),
        ...(color !== undefined && { color }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
      },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SKU", "A variant with this SKU already exists", 409);
    }
    throw error;
  }
}

export async function deleteVariant(params: {
  productId: string;
  variantId: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { productId, variantId, prisma } = params;

  await getVariant({ productId, variantId, prisma });

  await prisma.variant.delete({ where: { id: variantId } });
}

async function requireProduct(productId: string, prisma: PrismaClient): Promise<void> {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    throw new CatalogError("INVALID_PRODUCT", "Product does not exist", 400);
  }
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
