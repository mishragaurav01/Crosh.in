import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";

export async function addProductToCollection(params: {
  collectionId: string;
  productId: string;
  prisma: PrismaClient;
}): Promise<{ id: string; productId: string; collectionId: string; createdAt: Date }> {
  const { collectionId, productId, prisma } = params;

  const [collection, product] = await Promise.all([
    prisma.collection.findUnique({ where: { id: collectionId } }),
    prisma.product.findUnique({ where: { id: productId } }),
  ]);

  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }
  if (!product) {
    throw new CatalogError("PRODUCT_NOT_FOUND", "Product not found", 404);
  }

  try {
    return await prisma.productCollection.create({
      data: { collectionId, productId },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError(
        "DUPLICATE_COLLECTION_MEMBERSHIP",
        "Product is already in this collection",
        409,
      );
    }
    throw error;
  }
}

export async function removeProductFromCollection(params: {
  collectionId: string;
  productId: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { collectionId, productId, prisma } = params;

  const membership = await prisma.productCollection.findUnique({
    where: { productId_collectionId: { productId, collectionId } },
  });

  if (!membership) {
    throw new CatalogError(
      "DUPLICATE_COLLECTION_MEMBERSHIP",
      "Product is not in this collection",
      404,
    );
  }

  await prisma.productCollection.delete({
    where: { productId_collectionId: { productId, collectionId } },
  });
}

export async function listCollectionProducts(params: {
  collectionId: string;
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<{ data: Array<{ id: string; productId: string; collectionId: string; createdAt: Date }>; total: number; page: number; limit: number }> {
  const { collectionId, page, limit, prisma } = params;

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.productCollection.findMany({
      where: { collectionId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.productCollection.count({ where: { collectionId } }),
  ]);

  return { data, total, page, limit };
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
