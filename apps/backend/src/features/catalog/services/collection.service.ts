import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";
import { deleteImagesForOwner } from "./image.service.js";
import { requireVariantsExist } from "./membership.service.js";

export type CollectionWithVariants = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
  variantIds: string[];
};

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function createCollection(params: {
  name: string;
  description?: string | null;
  slug: string;
  variantIds?: string[];
  prisma: PrismaClient;
}): Promise<CollectionWithVariants> {
  const { name, description, slug, variantIds, prisma } = params;
  const ids = [...new Set(variantIds ?? [])];

  await requireVariantsExist({ variantIds: ids, prisma });

  try {
    const collection = await createInTransaction({ data: { name, description: description ?? null, slug }, variantIds: ids, prisma });
    return await mapWithVariantIds(collection, prisma);
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
}): Promise<{ data: CollectionWithVariants[]; total: number; page: number; limit: number }> {
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

  const memberships = await loadMembershipMap(
    data.map((collection) => collection.id),
    prisma,
  );

  return {
    data: data.map((collection) => withVariantIds(collection, memberships)),
    total,
    page,
    limit,
  };
}

export async function getCollection(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<CollectionWithVariants> {
  const { id, prisma } = params;

  const collection = await prisma.collection.findUnique({ where: { id } });
  if (!collection) {
    throw new CatalogError("COLLECTION_NOT_FOUND", "Collection not found", 404);
  }

  return mapWithVariantIds(collection, prisma);
}

export async function updateCollection(params: {
  id: string;
  name?: string;
  description?: string | null;
  slug?: string;
  variantIds?: string[];
  prisma: PrismaClient;
}): Promise<CollectionWithVariants> {
  const { id, name, description, slug, variantIds, prisma } = params;

  await getCollection({ id, prisma });

  const ids = variantIds !== undefined ? [...new Set(variantIds)] : undefined;

  if (ids !== undefined) {
    await requireVariantsExist({ variantIds: ids, prisma });
  }

  try {
    const collection =
      ids !== undefined
        ? await replaceMembershipsInTransaction({ id, data: { ...(name !== undefined && { name }), ...(description !== undefined && { description: description ?? null }), ...(slug !== undefined && { slug }) }, variantIds: ids, prisma })
        : await prisma.collection.update({
            where: { id },
            data: {
              ...(name !== undefined && { name }),
              ...(description !== undefined && { description: description ?? null }),
              ...(slug !== undefined && { slug }),
            },
          });

    return await mapWithVariantIds(collection as CollectionRow, prisma);
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

  await deleteImagesForOwner({ ownerType: "collection", ownerId: id, prisma });

  await prisma.$transaction(async (tx) => {
    await tx.variantCollection.deleteMany({ where: { collectionId: id } });
    await tx.collection.delete({ where: { id } });
  });
}

async function createInTransaction(params: {
  data: { name: string; description: string | null; slug: string };
  variantIds: string[];
  prisma: PrismaClient;
}): Promise<CollectionRow> {
  const { data, variantIds, prisma } = params;

  if (variantIds.length === 0) {
    return prisma.collection.create({ data });
  }

  return prisma.$transaction(async (tx) => {
    const created = await tx.collection.create({ data });
    await tx.variantCollection.createMany({
      data: variantIds.map((variantId) => ({ variantId, collectionId: created.id })),
    });
    return created;
  });
}

async function replaceMembershipsInTransaction(params: {
  id: string;
  data: { name?: string; description?: string | null; slug?: string };
  variantIds: string[];
  prisma: PrismaClient;
}): Promise<CollectionRow> {
  const { id, data, variantIds, prisma } = params;

  return prisma.$transaction(async (tx) => {
    const updated = await tx.collection.update({ where: { id }, data });
    await tx.variantCollection.deleteMany({ where: { collectionId: id } });
    if (variantIds.length > 0) {
      await tx.variantCollection.createMany({
        data: variantIds.map((variantId) => ({ variantId, collectionId: id })),
      });
    }
    return updated;
  });
}

async function loadMembershipMap(
  collectionIds: string[],
  prisma: PrismaClient,
): Promise<Map<string, string[]>> {
  if (collectionIds.length === 0) {
    return new Map();
  }

  const rows = await prisma.variantCollection.findMany({
    where: { collectionId: { in: collectionIds } },
    select: { collectionId: true, variantId: true },
    orderBy: { createdAt: "asc" },
  });

  const map = new Map<string, string[]>();
  for (const row of rows) {
    const ids = map.get(row.collectionId) ?? [];
    ids.push(row.variantId);
    map.set(row.collectionId, ids);
  }
  return map;
}

async function mapWithVariantIds(
  collection: CollectionRow,
  prisma: PrismaClient,
): Promise<CollectionWithVariants> {
  const memberships = await loadMembershipMap([collection.id], prisma);
  return withVariantIds(collection, memberships);
}

function withVariantIds(
  collection: CollectionRow,
  memberships: Map<string, string[]>,
): CollectionWithVariants {
  return { ...collection, variantIds: memberships.get(collection.id) ?? [] };
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
