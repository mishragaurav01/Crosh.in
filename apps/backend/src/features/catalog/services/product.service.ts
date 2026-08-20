import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";

export async function createProduct(params: {
  name: string;
  description?: string | null;
  slug: string;
  categoryId: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; categoryId: string; createdAt: Date; updatedAt: Date }> {
  const { name, description, slug, categoryId, prisma } = params;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category) {
    throw new CatalogError("INVALID_CATEGORY", "Category does not exist", 400);
  }

  try {
    return await prisma.product.create({
      data: { name, description: description ?? null, slug, categoryId },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SLUG", "A product with this slug already exists", 409);
    }
    throw error;
  }
}

export async function listProducts(params: {
  page: number;
  limit: number;
  categoryId?: string;
  prisma: PrismaClient;
}): Promise<{ data: Array<{ id: string; name: string; description: string | null; slug: string; categoryId: string; createdAt: Date; updatedAt: Date }>; total: number; page: number; limit: number }> {
  const { page, limit, categoryId, prisma } = params;
  const skip = (page - 1) * limit;

  const where = categoryId ? { categoryId } : undefined;

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return { data, total, page, limit };
}

export async function getProduct(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; categoryId: string; createdAt: Date; updatedAt: Date }> {
  const { id, prisma } = params;

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) {
    throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
  }
  return product;
}

export async function updateProduct(params: {
  id: string;
  name?: string;
  description?: string | null;
  slug?: string;
  categoryId?: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; categoryId: string; createdAt: Date; updatedAt: Date }> {
  const { id, name, description, slug, categoryId, prisma } = params;

  await getProduct({ id, prisma });

  if (categoryId !== undefined) {
    const category = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      throw new CatalogError("INVALID_CATEGORY", "Category does not exist", 400);
    }
  }

  try {
    return await prisma.product.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(slug !== undefined && { slug }),
        ...(categoryId !== undefined && { categoryId }),
      },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SLUG", "A product with this slug already exists", 409);
    }
    throw error;
  }
}

export async function deleteProduct(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { id, prisma } = params;

  await getProduct({ id, prisma });

  const variantCount = await prisma.variant.count({ where: { productId: id } });
  if (variantCount > 0) {
    throw new CatalogError(
      "PRODUCT_HAS_VARIANTS",
      "Cannot delete product while variants reference it",
      409,
    );
  }

  await prisma.productCollection.deleteMany({ where: { productId: id } });
  await prisma.product.delete({ where: { id } });
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
