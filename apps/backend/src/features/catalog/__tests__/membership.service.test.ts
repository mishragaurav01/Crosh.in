import { describe, it, expect, mock } from "bun:test";
import {
  addVariantToCollection,
  removeVariantFromCollection,
  listCollectionVariants,
  requireVariantsExist,
} from "../services/membership.service.js";

const mockCollection = { id: "col-1", name: "Summer", slug: "summer", description: null, createdAt: new Date(), updatedAt: new Date() };
const mockVariant = { id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", price: 2999, stock: 50, productId: "prod-1", createdAt: new Date(), updatedAt: new Date() };
const mockMembership = { id: "vc-1", variantId: "var-1", collectionId: "col-1", createdAt: new Date() };

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    collection: {
      findUnique: mock(() => Promise.resolve(mockCollection)),
      ...((overrides.collection as object) ?? {}),
    },
    variant: {
      findUnique: mock(() => Promise.resolve(mockVariant)),
      findMany: mock(() => Promise.resolve([{ id: "var-1" }])),
      ...((overrides.variant as object) ?? {}),
    },
    variantCollection: {
      create: mock(() => Promise.resolve(mockMembership)),
      delete: mock(() => Promise.resolve({})),
      findUnique: mock(() => Promise.resolve(mockMembership)),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      ...((overrides.variantCollection as object) ?? {}),
    },
  } as any;
}

describe("addVariantToCollection", () => {
  it("creates membership and returns it", async () => {
    const prisma = createMockPrisma();
    const result = await addVariantToCollection({
      collectionId: "col-1",
      variantId: "var-1",
      prisma,
    });

    expect(result.variantId).toBe("var-1");
    expect(result.collectionId).toBe("col-1");
    expect(prisma.variantCollection.create).toHaveBeenCalledTimes(1);
  });

  it("throws COLLECTION_NOT_FOUND when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      addVariantToCollection({ collectionId: "missing", variantId: "var-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws VARIANT_NOT_FOUND when variant does not exist", async () => {
    const prisma = createMockPrisma({
      variant: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      addVariantToCollection({ collectionId: "col-1", variantId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws DUPLICATE_COLLECTION_MEMBERSHIP on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      variantCollection: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      addVariantToCollection({ collectionId: "col-1", variantId: "var-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 409 }),
    );
  });
});

describe("removeVariantFromCollection", () => {
  it("removes an existing membership", async () => {
    const prisma = createMockPrisma();
    await removeVariantFromCollection({
      collectionId: "col-1",
      variantId: "var-1",
      prisma,
    });

    expect(prisma.variantCollection.delete).toHaveBeenCalledWith({
      where: { variantId_collectionId: { variantId: "var-1", collectionId: "col-1" } },
    });
  });

  it("throws when membership does not exist", async () => {
    const prisma = createMockPrisma({
      variantCollection: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      removeVariantFromCollection({ collectionId: "col-1", variantId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 404 }),
    );
  });
});

describe("listCollectionVariants", () => {
  it("returns paginated results", async () => {
    const prisma = createMockPrisma();
    const result = await listCollectionVariants({
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
      listCollectionVariants({ collectionId: "missing", page: 1, limit: 20, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("requireVariantsExist", () => {
  it("passes when all variants exist", async () => {
    const prisma = createMockPrisma();

    await expect(
      requireVariantsExist({ variantIds: ["var-1"], prisma }),
    ).resolves.toBeUndefined();
  });

  it("throws VARIANT_NOT_FOUND when a variant is missing", async () => {
    const prisma = createMockPrisma({
      variant: { findMany: mock(() => Promise.resolve([])) },
    });

    await expect(
      requireVariantsExist({ variantIds: ["missing"], prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("skips the database when no IDs are submitted", async () => {
    const prisma = createMockPrisma();

    await requireVariantsExist({ variantIds: [], prisma });

    expect(prisma.variant.findMany).not.toHaveBeenCalled();
  });
});
