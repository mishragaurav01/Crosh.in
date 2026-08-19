import type { PrismaClient } from "db/client";
import { CatalogError } from "../types/catalog-errors.js";

export async function createCategory(params: {
  name: string;
  description?: string | null;
  slug: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }> {
  const { name, description, slug, prisma } = params;

  try {
    return await prisma.category.create({
      data: { name, description: description ?? null, slug },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SLUG", "A category with this slug already exists", 409);
    }
    throw error;
  }
}

export async function listCategories(params: {
  page: number;
  limit: number;
  prisma: PrismaClient;
}): Promise<{ data: Array<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }>; total: number; page: number; limit: number }> {
  const { page, limit, prisma } = params;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    prisma.category.findMany({
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.category.count(),
  ]);

  return { data, total, page, limit };
}

export async function getCategory(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }> {
  const { id, prisma } = params;

  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) {
    throw new CatalogError("CATEGORY_NOT_FOUND", "Category not found", 404);
  }
  return category;
}

export async function updateCategory(params: {
  id: string;
  name?: string;
  description?: string | null;
  slug?: string;
  prisma: PrismaClient;
}): Promise<{ id: string; name: string; description: string | null; slug: string; createdAt: Date; updatedAt: Date }> {
  const { id, name, description, slug, prisma } = params;

  await getCategory({ id, prisma });

  try {
    return await prisma.category.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description: description ?? null }),
        ...(slug !== undefined && { slug }),
      },
    });
  } catch (error: unknown) {
    if (isPrismaUniqueConstraintError(error)) {
      throw new CatalogError("DUPLICATE_SLUG", "A category with this slug already exists", 409);
    }
    throw error;
  }
}

export async function deleteCategory(params: {
  id: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { id, prisma } = params;

  await getCategory({ id, prisma });

  await prisma.category.delete({ where: { id } });
}

function isPrismaUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code: string }).code === "P2002"
  );
}
