import { describe, it, expect, mock } from "bun:test";
import {
  createVariant,
  listVariants,
  getVariant,
  updateVariant,
  deleteVariant,
} from "../services/variant.service.js";

const mockVariant = {
  id: "var-1",
  sku: "TEE-S-BLK",
  size: "S",
  color: "Black",
  price: 2999,
  stock: 50,
  productId: "prod-1",
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    product: {
      findUnique: mock(() =>
        Promise.resolve({ id: "prod-1", name: "Tee", slug: "tee", categoryId: "cat-1", description: null, createdAt: new Date(), updatedAt: new Date() }),
      ),
      ...((overrides.product as object) ?? {}),
    },
    variant: {
      create: mock(() => Promise.resolve(mockVariant)),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      findFirst: mock(() => Promise.resolve(mockVariant)),
      update: mock(() =>
        Promise.resolve({ ...mockVariant, size: "M" }),
      ),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.variant as object) ?? {}),
    },
  } as any;
}

describe("createVariant", () => {
  it("creates and returns a variant", async () => {
    const prisma = createMockPrisma();
    const result = await createVariant({
      productId: "prod-1",
      sku: "TEE-S-BLK",
      size: "S",
      color: "Black",
      price: 2999,
      stock: 50,
      prisma,
    });

    expect(result.id).toBe("var-1");
    expect(result.sku).toBe("TEE-S-BLK");
    expect(prisma.variant.create).toHaveBeenCalledTimes(1);
  });

  it("throws INVALID_PRODUCT when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      createVariant({ productId: "missing", sku: "X", size: "S", color: "Black", price: 100, stock: 0, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_PRODUCT", statusCode: 400 }),
    );
  });

  it("throws DUPLICATE_SKU on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      variant: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      createVariant({ productId: "prod-1", sku: "TAKEN", size: "S", color: "Black", price: 100, stock: 0, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SKU", statusCode: 409 }),
    );
  });
});

describe("listVariants", () => {
  it("returns paginated results for a product", async () => {
    const prisma = createMockPrisma();
    const result = await listVariants({ productId: "prod-1", page: 1, limit: 20, prisma });

    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it("throws INVALID_PRODUCT when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });

    await expect(
      listVariants({ productId: "missing", page: 1, limit: 20, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_PRODUCT", statusCode: 400 }),
    );
  });
});

describe("getVariant", () => {
  it("returns a variant by id", async () => {
    const prisma = createMockPrisma();
    const result = await getVariant({ productId: "prod-1", variantId: "var-1", prisma });

    expect(result.id).toBe("var-1");
  });

  it("throws VARIANT_NOT_FOUND when not found", async () => {
    const prisma = createMockPrisma({
      variant: { findFirst: mock(() => Promise.resolve(null)) },
    });

    await expect(
      getVariant({ productId: "prod-1", variantId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("updateVariant", () => {
  it("updates and returns the variant", async () => {
    const prisma = createMockPrisma();
    const result = await updateVariant({ productId: "prod-1", variantId: "var-1", size: "M", prisma });

    expect(result.size).toBe("M");
  });

  it("throws VARIANT_NOT_FOUND when variant does not exist", async () => {
    const prisma = createMockPrisma({
      variant: { findFirst: mock(() => Promise.resolve(null)) },
    });

    await expect(
      updateVariant({ productId: "prod-1", variantId: "missing", size: "M", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
  });

  it("throws DUPLICATE_SKU on unique constraint violation", async () => {
    const prisma = createMockPrisma({
      variant: {
        findFirst: mock(() => Promise.resolve(mockVariant)),
        update: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });

    await expect(
      updateVariant({ productId: "prod-1", variantId: "var-1", sku: "TAKEN", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SKU", statusCode: 409 }),
    );
  });
});

describe("deleteVariant", () => {
  it("deletes an existing variant", async () => {
    const prisma = createMockPrisma();
    await deleteVariant({ productId: "prod-1", variantId: "var-1", prisma });

    expect(prisma.variant.delete).toHaveBeenCalledWith({ where: { id: "var-1" } });
  });

  it("throws VARIANT_NOT_FOUND when variant does not exist", async () => {
    const prisma = createMockPrisma({
      variant: { findFirst: mock(() => Promise.resolve(null)) },
    });

    await expect(
      deleteVariant({ productId: "prod-1", variantId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
  });
});
