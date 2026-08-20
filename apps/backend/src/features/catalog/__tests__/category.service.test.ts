import { describe, it, expect, mock } from "bun:test";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";
import { CatalogError } from "../types/catalog-errors.js";

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    category: {
      create: mock(() =>
        Promise.resolve({
          id: "cat-1",
          name: "Shirts",
          description: "All shirts",
          slug: "shirts",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      findUnique: mock(() =>
        Promise.resolve({
          id: "cat-1",
          name: "Shirts",
          description: "All shirts",
          slug: "shirts",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      update: mock(() =>
        Promise.resolve({
          id: "cat-1",
          name: "Updated",
          description: null,
          slug: "shirts",
          createdAt: new Date(),
          updatedAt: new Date(),
        }),
      ),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.category as object) ?? {}),
    },
    product: {
      count: mock(() => Promise.resolve(0)),
      ...((overrides.product as object) ?? {}),
    },
  } as any;
}

describe("createCategory", () => {
  it("creates and returns a category", async () => {
    const prisma = createMockPrisma();
    const result = await createCategory({
      name: "Shirts",
      slug: "shirts",
      prisma,
    });

    expect(result.id).toBe("cat-1");
    expect(result.name).toBe("Shirts");
    expect(prisma.category.create).toHaveBeenCalledTimes(1);
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      category: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      createCategory({ name: "Shirts", slug: "shirts", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("listCategories", () => {
  it("returns paginated results", async () => {
    const prisma = createMockPrisma();
    const result = await listCategories({ page: 1, limit: 20, prisma });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.page).toBe(1);
    expect(result.limit).toBe(20);
  });
});

describe("getCategory", () => {
  it("returns a category by id", async () => {
    const prisma = createMockPrisma();
    const result = await getCategory({ id: "cat-1", prisma });

    expect(result.id).toBe("cat-1");
  });

  it("throws CATEGORY_NOT_FOUND when not found", async () => {
    const prisma = createMockPrisma({
      category: {
        findUnique: mock(() => Promise.resolve(null)),
      },
    });

    await expect(getCategory({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("updateCategory", () => {
  it("updates and returns the category", async () => {
    const prisma = createMockPrisma();
    const result = await updateCategory({ id: "cat-1", name: "Updated", prisma });

    expect(result.name).toBe("Updated");
    expect(prisma.category.update).toHaveBeenCalledTimes(1);
  });

  it("throws CATEGORY_NOT_FOUND when category does not exist", async () => {
    const prisma = createMockPrisma({
      category: {
        findUnique: mock(() => Promise.resolve(null)),
      },
    });

    await expect(
      updateCategory({ id: "missing", name: "Nope", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      category: {
        findUnique: mock(() =>
          Promise.resolve({
            id: "cat-1",
            name: "Shirts",
            slug: "shirts",
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        update: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      updateCategory({ id: "cat-1", slug: "taken", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("deleteCategory", () => {
  it("deletes an existing category", async () => {
    const prisma = createMockPrisma();
    await deleteCategory({ id: "cat-1", prisma });

    expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: "cat-1" } });
  });

  it("throws CATEGORY_NOT_FOUND when category does not exist", async () => {
    const prisma = createMockPrisma({
      category: {
        findUnique: mock(() => Promise.resolve(null)),
      },
    });

    await expect(deleteCategory({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws CATEGORY_HAS_PRODUCTS when products reference the category", async () => {
    const prisma = createMockPrisma({
      product: {
        count: mock(() => Promise.resolve(2)),
      },
    });

    await expect(deleteCategory({ id: "cat-1", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_HAS_PRODUCTS", statusCode: 409 }),
    );
  });
});
