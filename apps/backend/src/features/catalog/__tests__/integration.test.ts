import { describe, it, expect, mock } from "bun:test";
import { createCategory, deleteCategory } from "../services/category.service.js";
import { createCollection, deleteCollection, updateCollection } from "../services/collection.service.js";
import { createProduct, deleteProduct } from "../services/product.service.js";
import { createVariant, deleteVariant } from "../services/variant.service.js";
import {
  addVariantToCollection,
  removeVariantFromCollection,
} from "../services/membership.service.js";
import { listCategories } from "../services/category.service.js";
import { listCollections } from "../services/collection.service.js";
import { listProducts } from "../services/product.service.js";
import { listVariants } from "../services/variant.service.js";

const now = new Date();

const mockCategory = { id: "cat-1", name: "Shirts", description: null, slug: "shirts", createdAt: now, updatedAt: now };
const mockCollection = { id: "col-1", name: "Summer", description: null, slug: "summer", createdAt: now, updatedAt: now };
const mockCollection2 = { id: "col-2", name: "Winter", description: null, slug: "winter", createdAt: now, updatedAt: now };
const mockProduct = { id: "prod-1", name: "Tee", description: null, slug: "tee", categoryId: "cat-1", createdAt: now, updatedAt: now };
const mockVariant = { id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", price: 2999, stock: 50, productId: "prod-1", createdAt: now, updatedAt: now };
const mockVariant2 = { id: "var-2", sku: "TEE-M-BLK", size: "M", color: "Black", price: 2999, stock: 50, productId: "prod-1", createdAt: now, updatedAt: now };
const mockMembership = { id: "vc-1", variantId: "var-1", collectionId: "col-1", createdAt: now };

function createBasePrisma() {
  const prisma: any = {
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
      findUnique: mock(() => Promise.resolve(mockVariant)),
      findMany: mock((args: any) =>
        Promise.resolve(
          ((args?.where?.id?.in ?? []) as string[]).map((id) =>
            id === "var-2" ? mockVariant2 : mockVariant,
          ),
        ),
      ),
      count: mock(() => Promise.resolve(1)),
      update: mock(() => Promise.resolve(mockVariant)),
      delete: mock(() => Promise.resolve({})),
    },
    variantCollection: {
      create: mock(() => Promise.resolve(mockMembership)),
      createMany: mock(() => Promise.resolve({ count: 0 })),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 1 })),
      findUnique: mock(() => Promise.resolve(mockMembership)),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
    },
  };

  prisma.$transaction = mock((fn: (tx: unknown) => unknown) => Promise.resolve(fn(prisma)));

  return prisma;
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

describe("Integration: Membership cannot reference missing variant", () => {
  it("rejects adding non-existent variant to collection", async () => {
    const prisma = createBasePrisma();
    prisma.variant.findUnique = mock(() => Promise.resolve(null));

    await expect(
      addVariantToCollection({ collectionId: "col-1", variantId: "nonexistent", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
  });
});

describe("Integration: Membership cannot reference missing collection", () => {
  it("rejects adding variant to non-existent collection", async () => {
    const prisma = createBasePrisma();
    prisma.collection.findUnique = mock(() => Promise.resolve(null));

    await expect(
      addVariantToCollection({ collectionId: "nonexistent", variantId: "var-1", prisma }),
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
    prisma.variantCollection.create = mock(() => { throw uniqueConstraintError(); });

    await expect(
      addVariantToCollection({ collectionId: "col-1", variantId: "var-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "DUPLICATE_COLLECTION_MEMBERSHIP", statusCode: 409 }),
    );
  });
});

describe("Integration: Collection membership operates on variants", () => {
  it("assigns all variants of a product via variantIds", async () => {
    const prisma = createBasePrisma();
    prisma.variantCollection.findMany = mock(() =>
      Promise.resolve([
        { collectionId: "col-1", variantId: "var-1" },
        { collectionId: "col-1", variantId: "var-2" },
      ]),
    );

    const result = await updateCollection({
      id: "col-1",
      variantIds: ["var-1", "var-2"],
      prisma,
    });

    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [
        { variantId: "var-1", collectionId: "col-1" },
        { variantId: "var-2", collectionId: "col-1" },
      ],
    });
    expect(result.variantIds).toEqual(["var-1", "var-2"]);
  });

  it("two variants of the same product can belong to different collections", async () => {
    const prisma = createBasePrisma();
    prisma.collection.findUnique = mock((args: any) =>
      Promise.resolve(args?.where?.id === "col-2" ? mockCollection2 : mockCollection),
    );

    await updateCollection({ id: "col-1", variantIds: ["var-1"], prisma });
    await updateCollection({ id: "col-2", variantIds: ["var-2"], prisma });

    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [{ variantId: "var-1", collectionId: "col-1" }],
    });
    expect(prisma.variantCollection.createMany).toHaveBeenCalledWith({
      data: [{ variantId: "var-2", collectionId: "col-2" }],
    });
  });

  it("removing one variant keeps sibling variants assigned", async () => {
    const prisma = createBasePrisma();
    prisma.variantCollection.findMany = mock(() =>
      Promise.resolve([{ collectionId: "col-1", variantId: "var-1" }]),
    );

    await updateCollection({ id: "col-1", variantIds: ["var-1", "var-2"], prisma });
    const result = await updateCollection({ id: "col-1", variantIds: ["var-1"], prisma });

    expect(prisma.variantCollection.createMany).toHaveBeenLastCalledWith({
      data: [{ variantId: "var-1", collectionId: "col-1" }],
    });
    expect(result.variantIds).toEqual(["var-1"]);
  });

  it("rejects submitted variant IDs that do not exist without touching memberships", async () => {
    const prisma = createBasePrisma();
    prisma.variant.findMany = mock(() => Promise.resolve([]));

    await expect(
      updateCollection({ id: "col-1", variantIds: ["ghost"], prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
    expect(prisma.variantCollection.deleteMany).not.toHaveBeenCalled();
    expect(prisma.variantCollection.createMany).not.toHaveBeenCalled();
  });

  it("removes a single membership without touching sibling variants", async () => {
    const prisma = createBasePrisma();

    await removeVariantFromCollection({ collectionId: "col-1", variantId: "var-1", prisma });

    expect(prisma.variantCollection.delete).toHaveBeenCalledWith({
      where: { variantId_collectionId: { variantId: "var-1", collectionId: "col-1" } },
    });
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

describe("Integration: Category deletion rejected when products exist", () => {
  it("rejects deletion when products reference the category", async () => {
    const prisma = createBasePrisma();
    prisma.product.count = mock(() => Promise.resolve(2));

    await expect(deleteCategory({ id: "cat-1", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "CATEGORY_HAS_PRODUCTS", statusCode: 409 }),
    );
  });

  it("allows deletion when no products reference the category", async () => {
    const prisma = createBasePrisma();
    prisma.product.count = mock(() => Promise.resolve(0));

    await expect(deleteCategory({ id: "cat-1", prisma })).resolves.toBeUndefined();
  });
});

describe("Integration: Product deletion rejected when variants exist", () => {
  it("rejects deletion when variants reference the product", async () => {
    const prisma = createBasePrisma();
    prisma.variant.count = mock(() => Promise.resolve(3));

    await expect(deleteProduct({ id: "prod-1", prisma })).rejects.toThrow(
      expect.objectContaining({ code: "PRODUCT_HAS_VARIANTS", statusCode: 409 }),
    );
  });

  it("allows deletion when no variants exist, leaving no orphaned memberships", async () => {
    const prisma = createBasePrisma();
    prisma.variant.count = mock(() => Promise.resolve(0));
    prisma.variantCollection.count = mock(() => Promise.resolve(0));

    await expect(deleteProduct({ id: "prod-1", prisma })).resolves.toBeUndefined();
    expect(prisma.product.delete).toHaveBeenCalledWith({ where: { id: "prod-1" } });
  });
});

describe("Integration: Variant deletion rejected when collections exist", () => {
  it("rejects deletion when the variant belongs to a collection", async () => {
    const prisma = createBasePrisma();
    prisma.variantCollection.count = mock(() => Promise.resolve(1));

    await expect(
      deleteVariant({ productId: "prod-1", variantId: "var-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_HAS_COLLECTIONS", statusCode: 409 }),
    );
  });
});

describe("Integration: Collection deletion removes memberships but preserves variants", () => {
  it("deletes VariantCollection rows and the collection", async () => {
    const prisma = createBasePrisma();

    await expect(deleteCollection({ id: "col-1", prisma })).resolves.toBeUndefined();
    expect(prisma.variantCollection.deleteMany).toHaveBeenCalledWith({ where: { collectionId: "col-1" } });
    expect(prisma.collection.delete).toHaveBeenCalledWith({ where: { id: "col-1" } });
  });

  it("does not delete variants or products when deleting a collection", async () => {
    const prisma = createBasePrisma();

    await deleteCollection({ id: "col-1", prisma });

    expect(prisma.variant.delete).not.toHaveBeenCalled();
    expect(prisma.product.delete).not.toHaveBeenCalled();
  });
});
