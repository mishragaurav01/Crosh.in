import { describe, it, expect, mock } from "bun:test";
import {
  addProductToCollection,
  removeProductFromCollection,
  listCollectionProducts,
} from "../services/membership.service.js";

const mockCollection = { id: "col-1", name: "Summer", slug: "summer", description: null, createdAt: new Date(), updatedAt: new Date() };
const mockProduct = { id: "prod-1", name: "Tee", slug: "tee", categoryId: "cat-1", description: null, createdAt: new Date(), updatedAt: new Date() };
const mockMembership = { id: "pc-1", productId: "prod-1", collectionId: "col-1", createdAt: new Date() };

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    collection: {
      findUnique: mock(() => Promise.resolve(mockCollection)),
      ...((overrides.collection as object) ?? {}),
    },
    product: {
      findUnique: mock(() => Promise.resolve(mockProduct)),
      ...((overrides.product as object) ?? {}),
    },
    productCollection: {
      create: mock(() => Promise.resolve(mockMembership)),
      delete: mock(() => Promise.resolve({})),
      findUnique: mock(() => Promise.resolve(mockMembership)),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      ...((overrides.productCollection as object) ?? {}),
    },
  } as any;
}

describe("addProductToCollection", () => {
  it("creates membership and returns it", async () => {
    const prisma = createMockPrisma();
    const result = await addProductToCollection({
      collectionId: "col-1",
      productId: "prod-1",
      prisma,
    });

    expect(result.productId).toBe("prod-1");
    expect(result.collectionId).toBe("col-1");
    expect(prisma.productCollection.create).toHaveBeenCalledTimes(1);
  });

  it("throws COLLECTION_NOT_FOUND when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      addProductToCollection({ collectionId: "missing", productId: "prod-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws PRODUCT_NOT_FOUND when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      addProductToCollection({ collectionId: "col-1", productId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws DUPLICATE_COLLECTION_MEMBERSHIP on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      productCollection: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      addProductToCollection({ collectionId: "col-1", productId: "prod-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 409 }),
    );
  });
});

describe("removeProductFromCollection", () => {
  it("removes an existing membership", async () => {
    const prisma = createMockPrisma();
    await removeProductFromCollection({
      collectionId: "col-1",
      productId: "prod-1",
      prisma,
    });

    expect(prisma.productCollection.delete).toHaveBeenCalledWith({
      where: { productId_collectionId: { productId: "prod-1", collectionId: "col-1" } },
    });
  });

  it("throws when membership does not exist", async () => {
    const prisma = createMockPrisma({
      productCollection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      removeProductFromCollection({ collectionId: "col-1", productId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 404 }),
    );
  });
});

describe("listCollectionProducts", () => {
  it("returns paginated results", async () => {
    const prisma = createMockPrisma();
    const result = await listCollectionProducts({
      collectionId: "col-1",
      page: 1,
      limit: 20,
      prisma,
    });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("throws COLLECTION_NOT_FOUND when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      listCollectionProducts({ collectionId: "missing", page: 1, limit: 20, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });
});
