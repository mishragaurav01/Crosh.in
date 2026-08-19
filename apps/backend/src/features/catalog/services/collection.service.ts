import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";

export async function createCollection(params: {
  name: string;
  description?: string | null;
  slug: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }> {
  const { name, description, slug, prisma } = params;

  try {
    return await prisma.collection.create({
      data: { name, description: description ?? null, slug },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SLUG", "A collection with this slug already exists", 409);
    }
    throw error;
  }
}

export async function listCollections(params: {
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<{ data: Array<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }>; total: number; page: number; limit: number }> {
  const { page, limit, prisma } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.collection.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.collection.count(),
  ]);

  return { data, total, page, limit };
}

export async function getCollection(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }> {
  const { id, prisma } = params;

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }
  return collection;
}

export async function updateCollection(params: {
  id: string;
  name?: string;
  description?: string | null;
  slug?: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }> {
  const { id, name, description, slug, prisma } = params;

  await getCollection({ id, prisma });

  try {
    return await prisma.collection.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(slug !== undefined && { slug }),
      },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SLUG", "A collection with this slug already exists", 409);
    }
    throw error;
  }
}

export async function deleteCollection(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { id, prisma } = params;

  await getCollection({ id, prisma });

  await prisma.collection.delete({ where: { id } });
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
