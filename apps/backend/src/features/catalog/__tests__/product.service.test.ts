import { describe, it, expect, mock } from "bun:test";
import {
  createProduct,
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from "../services/product.service.js";

const mockCategory = { id: "cat-1", name: "Shirts", slug: "shirts", description: null, createdAt: new Date(), updatedAt: new Date() };

const mockProduct = {
  id: "prod-1",
  name: "Basic Tee",
  description: null,
  slug: "basic-tee",
  categoryId: "cat-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    category: {
      findUnique: mock(() => Promise.resolve(mockCategory)),
      ...((overrides.category as object) ?? {}),
    },
    product: {
      create: mock(() => Promise.resolve(mockProduct)),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      findUnique: mock(() => Promise.resolve(mockProduct)),
      update: mock(() =>
        Promise.resolve({ ...mockProduct, name: "Updated" }),
      ),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.product as object) ?? {}),
    },
  } as any;
}

describe("createProduct", () => {
  it("creates and returns a product", async () => {
    const prisma = createMockPrisma();
    const result = await createProduct({
      name: "Basic Tee",
      slug: "basic-tee",
      categoryId: "cat-1",
      prisma,
    });

    expect(result.id).toBe("prod-1");
    expect(result.name).toBe("Basic Tee");
    expect(prisma.product.create).toHaveBeenCalledTimes(1);
  });

  it("throws INVALID_CATEGORY when category does not exist", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      createProduct({ name: "Tee", slug: "tee", categoryId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_CATEGORY", statusCode: 400 }),
    );
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      product: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      createProduct({ name: "Tee", slug: "taken", categoryId: "cat-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("listProducts", () => {
  it("returns paginated results", async () => {
    const prisma = createMockPrisma();
    const result = await listProducts({ page: 1, limit: 20, prisma });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("filters by categoryId when provided", async () => {
    const prisma = createMockPrisma();
    await listProducts({ page: 1, limit: 20, categoryId: "cat-1", prisma });

    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryId: "cat-1" } }),
    );
  });
});

describe("getProduct", () => {
  it("returns a product by id", async () => {
    const prisma = createMockPrisma();
    const result = await getProduct({ id: "prod-1", prisma });

    expect(result.id).toBe("prod-1");
  });

  it("throws PRODUCT_NOT_FOUND when not found", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(getProduct({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("updateProduct", () => {
  it("updates and returns the product", async () => {
    const prisma = createMockPrisma();
    const result = await updateProduct({ id: "prod-1", name: "Updated", prisma });

    expect(result.name).toBe("Updated");
  });

  it("throws PRODUCT_NOT_FOUND when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      updateProduct({ id: "missing", name: "Nope", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws INVALID_CATEGORY when updating to a non-existent category", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      updateProduct({ id: "prod-1", categoryId: "bad-cat", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_CATEGORY", statusCode: 400 }),
    );
  });

  it("throws DUPLICATE_SLUG on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      product: {
        findUnique: mock(() => Promise.resolve(mockProduct)),
        update: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      updateProduct({ id: "prod-1", slug: "taken", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("deleteProduct", () => {
  it("deletes an existing product", async () => {
    const prisma = createMockPrisma();
    await deleteProduct({ id: "prod-1", prisma });

    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: "prod-1" } });
  });

  it("throws PRODUCT_NOT_FOUND when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(deleteProduct({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_NOT_FOUND", statusCode: 404 }),
    );
  });
});
