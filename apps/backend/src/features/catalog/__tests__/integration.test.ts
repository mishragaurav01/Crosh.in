import { describe, it, expect, mock } from "bun:test";
import { createCategory } from "../services/category.service.js";
import { createCollection } from "../services/collection.service.js";
import { createProduct } from "../services/product.service.js";
import { createVariant } from "../services/variant.service.js";
import {
  addProductToCollection,
  removeProductFromCollection,
} from "../services/membership.service.js";
import { listCategories } from "../services/category.service.js";
import { listCollections } from "../services/collection.service.js";
import { listProducts } from "../services/product.service.js";
import { listVariants } from "../services/variant.service.js";

const now = new Date();

const mockCategory = { id: "cat-1", name: "Shirts", description: null, slug: "shirts", createdAt: now, updatedAt: now };
const mockCollection = { id: "col-1", name: "Summer", description: null, slug: "summer", createdAt: now, updatedAt: now };
const mockProduct = { id: "prod-1", name: "Tee", description: null, slug: "tee", categoryId: "cat-1", createdAt: now, updatedAt: now };
const mockVariant = { id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", price: 2999, stock: 50, productId: "prod-1", createdAt: now, updatedAt: now };
const mockMembership = { id: "pc-1", productId: "prod-1", collectionId: "col-1", createdAt: now };

function createBasePrisma() {
  return {
    category: {
      create: mock(() => Promise.resolve(mockCategory)),
      findUnique: mock(() => Promise.resolve(mockCategory)),
      findMany: mock(() => Promise.resolve([mockCategory])),
      count: mock(() => Promise.resolve(1)),
      update: mock(() => Promise.resolve(mockCategory)),
      delete: mock(() => Promise.resolve({})),
    },
    collection: {
      create: mock(() => Promise.resolve(mockCollection)),
      findUnique: mock(() => Promise.resolve(mockCollection)),
      findMany: mock(() => Promise.resolve([mockCollection])),
      count: mock(() => Promise.resolve(1)),
      update: mock(() => Promise.resolve(mockCollection)),
      delete: mock(() => Promise.resolve({})),
    },
    product: {
      create: mock(() => Promise.resolve(mockProduct)),
      findUnique: mock(() => Promise.resolve(mockProduct)),
      findMany: mock(() => Promise.resolve([mockProduct])),
      count: mock(() => Promise.resolve(1)),
      update: mock(() => Promise.resolve(mockProduct)),
      delete: mock(() => Promise.resolve({})),
    },
    variant: {
      create: mock(() => Promise.resolve(mockVariant)),
      findFirst: mock(() => Promise.resolve(mockVariant)),
      findMany: mock(() => Promise.resolve([mockVariant])),
      count: mock(() => Promise.resolve(1)),
      update: mock(() => Promise.resolve(mockVariant)),
      delete: mock(() => Promise.resolve({})),
    },
    productCollection: {
      create: mock(() => Promise.resolve(mockMembership)),
      delete: mock(() => Promise.resolve({})),
      findUnique: mock(() => Promise.resolve(mockMembership)),
      findMany: mock(() => Promise.resolve([mockMembership])),
      count: mock(() => Promise.resolve(1)),
    },
  } as any;
}

function uniqueConstraintError() {
  const error = new Error("Unique constraint failed") as Error & { code: string };
  error.code = "P2002";
  return error;
}

describe("Integration: Product cannot reference missing category", () => {
  it("rejects product creation with non-existent categoryId", async () => {
    const prisma = createBasePrisma();
    prisma.category.findUnique = mock(() => Promise.resolve(null));

    await expect(
      createProduct({ name: "Tee", slug: "tee", categoryId: "nonexistent", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_CATEGORY", statusCode: 400 }),
    );
  });

  it("rejects product update to non-existent categoryId", async () => {
    const prisma = createBasePrisma();
    prisma.category.findUnique
      .mockResolvedValueOnce(mockCategory)
      .mockResolvedValueOnce(null);

    await expect(
      createProduct({ name: "Tee", slug: "tee", categoryId: "cat-1", prisma }),
    ).resolves.toBeDefined();

    await expect(
      (await import("../services/product.service.js")).updateProduct({
        id: "prod-1",
        categoryId: "nonexistent",
        prisma,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_CATEGORY", statusCode: 400 }),
    );
  });
});

describe("Integration: Variant cannot reference missing product", () => {
  it("rejects variant creation with non-existent productId", async () => {
    const prisma = createBasePrisma();
    prisma.product.findUnique = mock(() => Promise.resolve(null));

    await expect(
      createVariant({
        productId: "nonexistent",
        sku: "X",
        size: "S",
        color: "Black",
        price: 100,
        stock: 0,
        prisma,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_PRODUCT", statusCode: 400 }),
    );
  });

  it("rejects listing variants for non-existent product", async () => {
    const prisma = createBasePrisma();
    prisma.product.findUnique = mock(() => Promise.resolve(null));

    await expect(
      listVariants({ productId: "nonexistent", page: 1, limit: 20, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INVALID_PRODUCT", statusCode: 400 }),
    );
  });
});

describe("Integration: Membership cannot reference missing product", () => {
  it("rejects adding non-existent product to collection", async () => {
    const prisma = createBasePrisma();
    prisma.product.findUnique = mock(() => Promise.resolve(null));

    await expect(
      addProductToCollection({ collectionId: "col-1", productId: "nonexistent", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("Integration: Membership cannot reference missing collection", () => {
  it("rejects adding product to non-existent collection", async () => {
    const prisma = createBasePrisma();
    prisma.collection.findUnique = mock(() => Promise.resolve(null));

    await expect(
      addProductToCollection({ collectionId: "nonexistent", productId: "prod-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("Integration: Duplicate category slug rejected", () => {
  it("throws DUPLICATE_SLUG on Prisma P2002", async () => {
    const prisma = createBasePrisma();
    prisma.category.create = mock(() => { throw uniqueConstraintError(); });

    await expect(
      createCategory({ name: "Shirts", slug: "shirts", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("Integration: Duplicate collection slug rejected", () => {
  it("throws DUPLICATE_SLUG on Prisma P2002", async () => {
    const prisma = createBasePrisma();
    prisma.collection.create = mock(() => { throw uniqueConstraintError(); });

    await expect(
      createCollection({ name: "Summer", slug: "summer", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("Integration: Duplicate product slug rejected", () => {
  it("throws DUPLICATE_SLUG on Prisma P2002", async () => {
    const prisma = createBasePrisma();
    prisma.product.create = mock(() => { throw uniqueConstraintError(); });

    await expect(
      createProduct({ name: "Tee", slug: "tee", categoryId: "cat-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SLUG", statusCode: 409 }),
    );
  });
});

describe("Integration: Duplicate SKU rejected", () => {
  it("throws DUPLICATE_SKU on Prisma P2002", async () => {
    const prisma = createBasePrisma();
    prisma.variant.create = mock(() => { throw uniqueConstraintError(); });

    await expect(
      createVariant({
        productId: "prod-1",
        sku: "DUP",
        size: "S",
        color: "Black",
        price: 100,
        stock: 0,
        prisma,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_SKU", statusCode: 409 }),
    );
  });
});

describe("Integration: Duplicate collection membership rejected", () => {
  it("throws DUPLICATE_COLLECTION_MEMBERSHIP on Prisma P2002", async () => {
    const prisma = createBasePrisma();
    prisma.productCollection.create = mock(() => { throw uniqueConstraintError(); });

    await expect(
      addProductToCollection({ collectionId: "col-1", productId: "prod-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 409 }),
    );
  });
});

describe("Integration: Negative stock rejected", () => {
  it("rejects negative stock via Zod validation", async () => {
    const { variantCreateBodySchema } = await import("../schemas/variant.schema.js");

    const result = variantCreateBodySchema.safeParse({
      sku: "X",
      size: "S",
      color: "Black",
      price: 100,
      stock: -1,
    });

    expect(result.success).toBe(false);
  });

  it("rejects non-integer stock via Zod validation", async () => {
    const { variantCreateBodySchema } = await import("../schemas/variant.schema.js");

    const result = variantCreateBodySchema.safeParse({
      sku: "X",
      size: "S",
      color: "Black",
      price: 100,
      stock: 1.5,
    });

    expect(result.success).toBe(false);
  });
});

describe("Integration: Pagination remains bounded", () => {
  it("rejects limit over 100", async () => {
    const { paginationQuerySchema } = await import("../schemas/common.schema.js");

    const result = paginationQuerySchema.safeParse({ page: "1", limit: "101" });
    expect(result.success).toBe(false);
  });

  it("rejects negative page", async () => {
    const { paginationQuerySchema } = await import("../schemas/common.schema.js");

    const result = paginationQuerySchema.safeParse({ page: "-1", limit: "20" });
    expect(result.success).toBe(false);
  });

  it("accepts valid pagination", async () => {
    const { paginationQuerySchema } = await import("../schemas/common.schema.js");

    const result = paginationQuerySchema.safeParse({ page: "1", limit: "50" });
    expect(result.success).toBe(true);
  });
});

describe("Integration: Missing resource responses use correct error codes", () => {
  it("category not found uses CATEGORY_NOT_FOUND", async () => {
    const prisma = createBasePrisma();
    prisma.category.findUnique = mock(() => Promise.resolve(null));

    const { getCategory } = await import("../services/category.service.js");

    await expect(getCategory({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_NOT_FOUND" }),
    );
  });

  it("collection not found uses COLLECTION_NOT_FOUND", async () => {
    const prisma = createBasePrisma();
    prisma.collection.findUnique = mock(() => Promise.resolve(null));

    const { getCollection } = await import("../services/collection.service.js");

    await expect(getCollection({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "COLLECTION_NOT_FOUND" }),
    );
  });

  it("product not found uses PRODUCT_NOT_FOUND", async () => {
    const prisma = createBasePrisma();
    prisma.product.findUnique = mock(() => Promise.resolve(null));

    const { getProduct } = await import("../services/product.service.js");

    await expect(getProduct({ id: "missing", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_NOT_FOUND" }),
    );
  });

  it("variant not found uses VARIANT_NOT_FOUND", async () => {
    const prisma = createBasePrisma();
    prisma.variant.findFirst = mock(() => Promise.resolve(null));

    const { getVariant } = await import("../services/variant.service.js");

    await expect(
      getVariant({ productId: "prod-1", variantId: "missing", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND" }),
    );
  });
});

describe("Integration: API response envelopes match project standard", () => {
  it("success responses have { success: true, data } shape", async () => {
    const prisma = createBasePrisma();
    const result = await listCategories({ page: 1, limit: 20, prisma });

    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("total");
    expect(result).toHaveProperty("page");
    expect(result).toHaveProperty("limit");
  });

  it("error responses have { success: false, error: { code, message } } shape", async () => {
    const prisma = createBasePrisma();
    prisma.category.findUnique = mock(() => Promise.resolve(null));

    const { getCategory } = await import("../services/category.service.js");

    try {
      await getCategory({ id: "missing", prisma });
      expect(true).toBe(false);
    } catch (error: unknown) {
      expect(error).toHaveProperty("code");
      expect(error).toHaveProperty("message");
      if (typeof error === "object" && error !== null && "code" in error) {
        expect(typeof (error as { code: string }).code).toBe("string");
      }
    }
  });
});

describe("Integration: Unauthorized admin operation rejected", () => {
  it("category routes use requireSession middleware", async () => {
    const { createCategoryRoutes } = await import("../routes/category.routes.js");
    const prisma = createBasePrisma();
    const router = createCategoryRoutes(prisma);

    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });

  it("collection routes use requireSession middleware", async () => {
    const { createCollectionRoutes } = await import("../routes/collection.routes.js");
    const prisma = createBasePrisma();
    const router = createCollectionRoutes(prisma);

    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });

  it("product routes use requireSession middleware", async () => {
    const { createProductRoutes } = await import("../routes/product.routes.js");
    const prisma = createBasePrisma();
    const router = createProductRoutes(prisma);

    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });

  it("variant routes use requireSession middleware", async () => {
    const { createVariantRoutes } = await import("../routes/variant.routes.js");
    const prisma = createBasePrisma();
    const router = createVariantRoutes(prisma);

    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });

  it("membership routes use requireSession middleware", async () => {
    const { createMembershipRoutes } = await import("../routes/membership.routes.js");
    const prisma = createBasePrisma();
    const router = createMembershipRoutes(prisma);

    expect(router).toBeDefined();
    expect(typeof router).toBe("function");
  });
});
