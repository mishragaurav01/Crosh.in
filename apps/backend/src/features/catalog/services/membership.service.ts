import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";

export async function requireVariantsExist(params: {
  variantIds: string[];
  prisma: PrismaClient;
}): Promise<void> {
  const { variantIds, prisma } = params;
  const uniqueIds = [...new Set(variantIds)];

  if (uniqueIds.length === 0) {
    return;
  }

  const found = await prisma.variant.findMany({
    where: { id: { in: uniqueIds } },
    select: { id: true },
  });

  if (found.length !== uniqueIds.length) {
    const foundIds = new Set(found.map((variant) => variant.id));
    const missing = uniqueIds.filter((id) => !foundIds.has(id));
    throw new CatalogError("VARIANT_NOT_FOUND", `Variant not found: ${missing[0]}`, 404);
  }
}

export async function addVariantToCollection(params: {
  collectionId: string;
  variantId: string;
  prisma: PrismaClient;
}): Promise<{ id: string; variantId: string; collectionId: string; createdAt: Date }> {
  const { collectionId, variantId, prisma } = params;

  const [collection, variant] = await Promise.all([
    prisma.collection.findUnique({ where: { id: collectionId } }),
    prisma.variant.findUnique({ where: { id: variantId } }),
  ]);

  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }
  if (!variant) {
    throw new CatalogError("VARIANT_NOT_FOUND", "Variant not found", 404);
  }

  try {
    return await prisma.variantCollection.create({
      data: { collectionId, variantId },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError(
        "DUPLICATE_COLLECTION_MEMBERSHIP",
        "Variant is already in this collection",
        409,
      );
    }
    throw error;
  }
}

export async function removeVariantFromCollection(params: {
  collectionId: string;
  variantId: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { collectionId, variantId, prisma } = params;

  const membership = await prisma.variantCollection.findUnique({
    where: { variantId_collectionId: { variantId, collectionId } },
  });

  if (!membership) {
    throw new CatalogError(
      "DUPLICATE_COLLECTION_MEMBERSHIP",
      "Variant is not in this collection",
      404,
    );
  }

  await prisma.variantCollection.delete({
    where: { variantId_collectionId: { variantId, collectionId } },
  });
}

export async function listCollectionVariants(params: {
  collectionId: string;
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<{ data: Array<{ id: string; variantId: string; collectionId: string; createdAt: Date }>; total: number; page: number; limit: number }> {
  const { collectionId, page, limit, prisma } = params;

  const collection = await prisma.collection.findUnique({ where: { id: collectionId } });
  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }

  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.variantCollection.findMany({
      where: { collectionId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.variantCollection.count({ where: { collectionId } }),
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
