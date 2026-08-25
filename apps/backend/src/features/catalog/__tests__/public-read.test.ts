import { describe, it, expect, mock } from "bun:test";
import type { Router } from "express";
import {
  createPublicCategoryController,
  createPublicProductController,
  createPublicCollectionController,
} from "../controllers/public-catalog.controller.js";
import {
  createPublicCategoryRoutes,
  createPublicProductRoutes,
  createPublicCollectionRoutes,
} from "../routes/public.routes.js";
import { requireSession } from "../../identity/middleware/session.middleware.js";
import { requireAdmin } from "../../identity/middleware/admin.middleware.js";
import {
  getPublicCollection,
  listPublicProducts,
} from "../services/public-catalog.service.js";

process.env.S3_ENDPOINT = "https://test-ref.supabase.co/storage/v1/s3";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-access-key";
process.env.S3_BUCKET = "croshfinal-dev";
process.env.S3_PUBLIC_BASE_URL =
  "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev";

const PUBLIC_BASE = process.env.S3_PUBLIC_BASE_URL;

type Row = Record<string, any>;

const T0 = new Date(1000000000000);
const T1 = new Date(T0.getTime() + 1000);
const T2 = new Date(T0.getTime() + 2000);

function createMockReq(
  params?: Record<string, string>,
  query?: Record<string, string>,
): any {
  return {
    params: params ?? {},
    query: query ?? {},
    body: {},
    user: undefined,
    headers: {},
  };
}

function createMockRes() {
  const res: any = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status: mock(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: mock(function (this: any, data: unknown) {
      this.body = data;
      return this;
    }),
  };
  return res;
}

function project(row: Row, select?: Row): Row {
  if (!select) {
    return { ...row };
  }
  const out: Row = {};
  for (const [key, value] of Object.entries(select)) {
    if (value === true) {
      out[key] = row[key];
    } else if (value && typeof value === "object") {
      out[key] = row[key] == null ? null : project(row[key] as Row, (value as Row).select);
    }
  }
  return out;
}

function createPublicPrisma() {
  const categories: Row[] = [];
  const products: Row[] = [];
  const variants: Row[] = [];
  const collections: Row[] = [];
  const memberships: Row[] = [];
  const images: Row[] = [];

  const byCreatedAsc = (a: Row, b: Row) => a.createdAt.getTime() - b.createdAt.getTime();
  const byCreatedDesc = (a: Row, b: Row) => b.createdAt.getTime() - a.createdAt.getTime();
  const byImageOrder = (a: Row, b: Row) =>
    a.sortOrder - b.sortOrder || a.createdAt.getTime() - b.createdAt.getTime();

  // Honors prisma-style orderBy specs: single object or ordered array of
  // { field: "asc" | "desc" } entries, later entries acting as tiebreakers.
  function compareBy(orderBy: any): (a: Row, b: Row) => number {
    const specs = Array.isArray(orderBy) ? orderBy : [orderBy ?? {}];
    return (a: Row, b: Row) => {
      for (const spec of specs) {
        for (const [field, dir] of Object.entries(spec)) {
          const av = a[field];
          const bv = b[field];
          if (av === bv) {
            continue;
          }
          const diff =
            av instanceof Date && bv instanceof Date
              ? av.getTime() - bv.getTime()
              : (av as number) - (bv as number);
          return dir === "desc" ? -diff : diff;
        }
      }
      return 0;
    };
  }

  function paginated(rows: Row[], skip?: number, take?: number): Row[] {
    return rows.slice(skip ?? 0, take !== undefined ? (skip ?? 0) + take : undefined);
  }

  function imagesFor(
    ownerField: "productId" | "collectionId",
    ownerId: string,
    imageSelect?: Row,
  ): Row[] {
    if (!imageSelect) {
      return [];
    }
    return [...images]
      .filter((i) => i[ownerField] === ownerId)
      .sort(byImageOrder)
      .map((i) => project(i, imageSelect.select));
  }

  return {
    seedCategory(row: Row) {
      categories.push(row);
    },
    seedProduct(row: Row) {
      products.push(row);
    },
    seedVariant(row: Row) {
      variants.push(row);
    },
    seedCollection(row: Row) {
      collections.push(row);
    },
    seedMembership(row: Row) {
      memberships.push(row);
    },
    seedImage(row: Row) {
      images.push(row);
    },

    prisma: {
      category: {
        findUnique: async ({ where }: any) =>
          categories.find((c) => c.slug === where.slug) ?? null,
        findMany: async ({ select, orderBy, skip, take }: any) =>
          paginated([...categories].sort(orderBy?.createdAt === "desc" ? byCreatedDesc : byCreatedAsc), skip, take).map((c) =>
            project(c, select),
          ),
        count: async () => categories.length,
      },
      product: {
        findMany: async ({ where, select, orderBy, skip, take }: any) => {
          let rows = [...products];
          if (where?.categoryId !== undefined) {
            rows = rows.filter((p) => p.categoryId === where.categoryId);
          }
          if (where?.status !== undefined) {
            rows = rows.filter((p) => p.status === where.status);
          }
          rows.sort(orderBy?.createdAt === "asc" ? byCreatedAsc : byCreatedDesc);
          return paginated(rows, skip, take).map((p) => ({
            ...project(p, select),
            variants: [...variants]
              .filter((v) => v.productId === p.id)
              .sort(compareBy(select.variants.orderBy))
              .map((v) => project(v, select.variants.select)),
            ...(select.images
              ? { images: imagesFor("productId", p.id, select.images) }
              : {}),
          }));
        },
        findFirst: async ({ where, select }: any) => {
          const p = products.find(
            (x) => x.slug === where.slug && x.status === where.status,
          );
          if (!p) {
            return null;
          }
          return {
            ...project(p, select),
            ...(select.category
              ? {
                  category: project(
                    categories.find((c) => c.id === p.categoryId)!,
                    select.category.select,
                  ),
                }
              : {}),
            variants: [...variants]
              .filter((v) => v.productId === p.id)
              .sort(compareBy(select.variants.orderBy))
              .map((v) => project(v, select.variants.select)),
            ...(select.images
              ? { images: imagesFor("productId", p.id, select.images) }
              : {}),
          };
        },
        count: async ({ where }: any = {}) =>
          products.filter(
            (p) =>
              (where?.categoryId === undefined || p.categoryId === where.categoryId) &&
              (where?.status === undefined || p.status === where.status),
          ).length,
      },
      collection: {
        findUnique: async ({ where, select }: any) => {
          const c = collections.find((x) => x.slug === where.slug);
          if (!c) {
            return null;
          }
          const variantSelect = select.variants.select.variant.select;
          return {
            ...project(c, select),
            ...(select.images
              ? { images: imagesFor("collectionId", c.id, select.images) }
              : {}),
            variants: [...memberships]
              .filter((m) => m.collectionId === c.id)
              .sort(byCreatedAsc)
              .map((m) => {
                const v = variants.find((x) => x.id === m.variantId)!;
                const productSelect = variantSelect.product.select;
                const product = products.find((p) => p.id === v.productId)!;
                return {
                  variant: {
                    ...project(v, variantSelect),
                    product: {
                      ...project(product, productSelect),
                      ...(productSelect.images
                        ? { images: imagesFor("productId", product.id, productSelect.images) }
                        : {}),
                      ...(productSelect.variants
                        ? {
                            variants: [...variants]
                              .filter((x) => x.productId === product.id)
                              .sort(compareBy(productSelect.variants.orderBy))
                              .map((x) => project(x, productSelect.variants.select)),
                          }
                        : {}),
                    },
                  },
                };
              }),
          };
        },
        findMany: async ({ select, orderBy, skip, take }: any) =>
          paginated([...collections].sort(orderBy?.createdAt === "desc" ? byCreatedDesc : byCreatedAsc), skip, take).map((c) =>
            project(c, select),
          ),
        count: async () => collections.length,
      },
    } as any,
  };
}

function seedFixture() {
  const db = createPublicPrisma();
  db.seedCategory({ id: "cat-1", name: "Tees", description: null, slug: "tees", createdAt: T0, updatedAt: T0 });
  db.seedProduct({ id: "prod-1", name: "Tee", description: "A tee", slug: "tee", categoryId: "cat-1", status: "PUBLISHED", createdAt: T0, updatedAt: T0 });
  db.seedProduct({ id: "prod-2", name: "Empty", description: null, slug: "empty", categoryId: "cat-1", status: "PUBLISHED", createdAt: T1, updatedAt: T1 });
  db.seedVariant({ id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", colorOption: { hex: "#1d1b1b" }, price: 2999, stock: 0, productId: "prod-1", sortOrder: 0, createdAt: T0, updatedAt: T0 });
  db.seedVariant({ id: "var-2", sku: "TEE-M-BLK", size: "M", color: "Black", colorOption: { hex: "#1d1b1b" }, price: 4999, stock: 5, productId: "prod-1", sortOrder: 1, createdAt: T1, updatedAt: T1 });
  db.seedCollection({ id: "col-1", name: "Summer", description: null, slug: "summer", createdAt: T0, updatedAt: T0 });
  db.seedMembership({ id: "vc-1", variantId: "var-2", collectionId: "col-1", createdAt: T2 });
  return db;
}

describe("public categories list", () => {
  it("returns 200 envelope with mapped DTOs and pagination meta", async () => {
    const db = seedFixture();
    const controller = createPublicCategoryController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { page: "1", limit: "20" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        data: [
          { id: "cat-1", name: "Tees", slug: "tees", description: null, banner: null },
        ],
        total: 1,
        page: 1,
        limit: 20,
      },
    });
  });

  it("reserves a null banner slot on every category payload", async () => {
    const db = seedFixture();
    db.seedImage({ id: "img-cat", key: "images/category/cat-1/banner.jpg", alt: "banner alt", sortOrder: 0, categoryId: "cat-1", createdAt: T1, updatedAt: T1 });
    const controller = createPublicCategoryController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, {}), res);

    expect(res.statusCode).toBe(200);
    const item = res.json.mock.calls[0][0].data.data[0];
    // Banner stays reserved (null) until category banners are surfaced publicly.
    expect(item.banner).toBeNull();
  });

  it("rejects limit above 100 with 422 VALIDATION_ERROR", async () => {
    const db = seedFixture();
    const controller = createPublicCategoryController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { limit: "101" }), res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "VALIDATION_ERROR", message: expect.any(String) },
    });
  });

  it("rejects invalid page with 422 VALIDATION_ERROR", async () => {
    const db = seedFixture();
    const controller = createPublicCategoryController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { page: "0" }), res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });
});

describe("public products list", () => {
  it("returns 200 envelope with computed price range and empty gallery for products without images", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { page: "1", limit: "20" }), res);

    expect(res.statusCode).toBe(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.total).toBe(2);
    const tee = body.data.data.find((p: Row) => p.slug === "tee");
    expect(tee).toEqual({
      id: "prod-1",
      name: "Tee",
      slug: "tee",
      description: "A tee",
      priceMin: 2999,
      priceMax: 4999,
      images: [],
    });
  });

  it("does not crash on zero-variant products and yields null prices", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { page: "1", limit: "20" }), res);

    expect(res.statusCode).toBe(200);
    const empty = res.json.mock.calls[0][0].data.data.find((p: Row) => p.slug === "empty");
    expect(empty.priceMin).toBeNull();
    expect(empty.priceMax).toBeNull();
    expect(empty.images).toEqual([]);
  });

  it("maps attached images to derived urls ordered by sortOrder", async () => {
    const db = seedFixture();
    db.seedImage({ id: "img-b", key: "images/product/prod-1/second.webp", alt: "Second", sortOrder: 1, productId: "prod-1", createdAt: T0, updatedAt: T0 });
    db.seedImage({ id: "img-a", key: "images/product/prod-1/first.jpg", alt: null, sortOrder: 0, productId: "prod-1", createdAt: T2, updatedAt: T2 });
    db.seedImage({ id: "img-other", key: "images/product/prod-2/other.png", alt: "Other", sortOrder: 0, productId: "prod-2", createdAt: T0, updatedAt: T0 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { page: "1", limit: "20" }), res);

    expect(res.statusCode).toBe(200);
    const tee = res.json.mock.calls[0][0].data.data.find((p: Row) => p.slug === "tee");
    expect(tee.images).toEqual([
      { url: `${PUBLIC_BASE}/images/product/prod-1/first.jpg`, alt: null },
      { url: `${PUBLIC_BASE}/images/product/prod-1/second.webp`, alt: "Second" },
    ]);
  });

  it("never leaks storage internals in product list payloads", async () => {
    const db = seedFixture();
    db.seedImage({ id: "img-a", key: "images/product/prod-1/first.jpg", alt: null, sortOrder: 0, productId: "prod-1", createdAt: T0, updatedAt: T0 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, {}), res);

    expect(res.statusCode).toBe(200);
    const raw = JSON.stringify(res.json.mock.calls[0][0]);
    expect(raw).not.toContain('"key"');
    expect(raw).not.toContain('"sortOrder"');
    expect(raw).not.toContain('"mimeType"');
    expect(raw).not.toContain("test-secret-access-key");
    expect(raw).not.toContain("test-access-key-id");
  });

  it("filters by category slug", async () => {
    const db = seedFixture();
    db.seedCategory({ id: "cat-2", name: "Mugs", description: null, slug: "mugs", createdAt: T1, updatedAt: T1 });
    db.seedProduct({ id: "prod-3", name: "Mug", description: null, slug: "mug", categoryId: "cat-2", status: "PUBLISHED", createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { category: "mugs" }), res);

    expect(res.statusCode).toBe(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.total).toBe(1);
    expect(data.data.map((p: Row) => p.slug)).toEqual(["mug"]);
  });

  it("returns 404 CATEGORY_NOT_FOUND for unknown category slug", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { category: "nope" }), res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "CATEGORY_NOT_FOUND", message: "Category not found" },
    });
  });

  it("rejects limit above 100 with 422 VALIDATION_ERROR", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { limit: "500" }), res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns published products only, excluding drafts and archived", async () => {
    const db = seedFixture();
    db.seedProduct({ id: "prod-draft", name: "Draft Tee", description: null, slug: "draft-tee", categoryId: "cat-1", status: "DRAFT", createdAt: T2, updatedAt: T2 });
    db.seedProduct({ id: "prod-archived", name: "Old Tee", description: null, slug: "old-tee", categoryId: "cat-1", status: "ARCHIVED", createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, { page: "1", limit: "20" }), res);

    expect(res.statusCode).toBe(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.total).toBe(2);
    expect(body.data.data.map((p: Row) => p.slug).sort()).toEqual(["empty", "tee"]);
  });
});

describe("public product detail", () => {
  it("maps variants with available reflecting stock>0 in creation order and never exposes stock", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "tee" }), res);

    expect(res.statusCode).toBe(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.categorySlug).toBe("tees");
    expect(body.data.variants).toEqual([
      { id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", colorHex: "#1d1b1b", price: 2999, available: false },
      { id: "var-2", sku: "TEE-M-BLK", size: "M", color: "Black", colorHex: "#1d1b1b", price: 4999, available: true },
    ]);
    expect(JSON.stringify(body)).not.toContain('"stock"');
    expect(JSON.stringify(body)).not.toContain("createdAt");
  });

  it("exposes null colorHex for variants without a linked color option", async () => {
    const db = seedFixture();
    db.seedVariant({ id: "var-nolink", sku: "TEE-XS-MAUVE", size: "XS", color: "Mauve", price: 2499, stock: 2, productId: "prod-1", sortOrder: 3, createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "tee" }), res);

    expect(res.statusCode).toBe(200);
    const mauve = res.json.mock.calls[0][0].data.variants.find((v: Row) => v.id === "var-nolink");
    expect(mauve.colorHex).toBeNull();
  });

  it("fills the product gallery with derived urls ordered by sortOrder", async () => {
    const db = seedFixture();
    db.seedImage({ id: "img-b", key: "images/product/prod-1/second.webp", alt: "Second", sortOrder: 1, productId: "prod-1", createdAt: T0, updatedAt: T0 });
    db.seedImage({ id: "img-a", key: "images/product/prod-1/first.jpg", alt: null, sortOrder: 0, productId: "prod-1", createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "tee" }), res);

    expect(res.statusCode).toBe(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.images).toEqual([
      { url: `${PUBLIC_BASE}/images/product/prod-1/first.jpg`, alt: null },
      { url: `${PUBLIC_BASE}/images/product/prod-1/second.webp`, alt: "Second" },
    ]);
  });

  it("returns 404 PRODUCT_NOT_FOUND for unknown slug", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "missing" }), res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
    });
  });

  it("handles zero-variant product detail safely", async () => {
    const db = seedFixture();
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "empty" }), res);

    expect(res.statusCode).toBe(200);
    const data = res.json.mock.calls[0][0].data;
    expect(data.priceMin).toBeNull();
    expect(data.priceMax).toBeNull();
    expect(data.variants).toEqual([]);
  });

  it("orders variants by sortOrder asc when it differs from creation order, breaking ties by createdAt", async () => {
    const db = seedFixture();
    // Created before the fixtures but forced last via sortOrder.
    db.seedVariant({ id: "var-a", sku: "TEE-XL-BLK", size: "XL", color: "Black", price: 5999, stock: 3, productId: "prod-1", sortOrder: 2, createdAt: T0, updatedAt: T0 });
    // Created after every fixture but pulled to the front via sortOrder.
    db.seedVariant({ id: "var-b", sku: "TEE-XXS-BLK", size: "XXS", color: "Black", price: 1999, stock: 4, productId: "prod-1", sortOrder: 0, createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "tee" }), res);

    expect(res.statusCode).toBe(200);
    const skus = res.json.mock.calls[0][0].data.variants.map((v: Row) => v.sku);
    // var-b ties with var-1 at sortOrder 0 and loses the tie (created later);
    // var-a has the highest sortOrder despite being created first.
    expect(skus).toEqual(["TEE-S-BLK", "TEE-XXS-BLK", "TEE-M-BLK", "TEE-XL-BLK"]);
  });

  it("returns a draft product the same 404 payload as an unknown slug", async () => {
    const db = seedFixture();
    db.seedProduct({ id: "prod-draft", name: "Draft Tee", description: null, slug: "draft-tee", categoryId: "cat-1", status: "DRAFT", createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);

    const draftRes = createMockRes();
    await controller.getHandler(createMockReq({ slug: "draft-tee" }), draftRes);

    const missingRes = createMockRes();
    await controller.getHandler(createMockReq({ slug: "never-existed" }), missingRes);

    expect(draftRes.statusCode).toBe(404);
    expect(missingRes.statusCode).toBe(404);
    // Indistinguishable: identical envelope for "hidden" and "absent".
    expect(draftRes.json.mock.calls[0][0]).toEqual({
      success: false,
      error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
    });
    expect(draftRes.json.mock.calls[0][0]).toEqual(missingRes.json.mock.calls[0][0]);
  });

  it("hides archived products from public detail with the same 404", async () => {
    const db = seedFixture();
    db.seedProduct({ id: "prod-archived", name: "Old Tee", description: null, slug: "old-tee", categoryId: "cat-1", status: "ARCHIVED", createdAt: T2, updatedAt: T2 });
    const controller = createPublicProductController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "old-tee" }), res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "PRODUCT_NOT_FOUND", message: "Product not found" },
    });
  });
});

describe("public collections list", () => {
  it("returns 200 envelope with mapped DTOs", async () => {
    const db = seedFixture();
    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.listHandler(createMockReq(undefined, {}), res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        data: [{ id: "col-1", name: "Summer", slug: "summer", description: null }],
        total: 1,
        page: 1,
        limit: 20,
      },
    });
  });
});

describe("public collection detail", () => {
  it("lists member variants with product context in membership creation order and never exposes stock", async () => {
    const db = seedFixture();
    db.seedVariant({ id: "var-3", sku: "TEE-L-BLK", size: "L", color: "White", colorOption: { hex: "#ffffff" }, price: 3500, stock: 0, productId: "prod-1", sortOrder: 2, createdAt: T2, updatedAt: T2 });
    db.seedMembership({ id: "vc-0", variantId: "var-3", collectionId: "col-1", createdAt: T1 });

    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "summer" }), res);

    expect(res.statusCode).toBe(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.variants).toEqual([
      { id: "var-3", sku: "TEE-L-BLK", size: "L", color: "White", colorHex: "#ffffff", price: 3500, available: false, productId: "prod-1", productName: "Tee", productSlug: "tee" },
      { id: "var-2", sku: "TEE-M-BLK", size: "M", color: "Black", colorHex: "#1d1b1b", price: 4999, available: true, productId: "prod-1", productName: "Tee", productSlug: "tee" },
    ]);
    expect(JSON.stringify(body)).not.toContain('"stock"');
  });

  it("groups distinct published member products into card summaries in membership order, excluding drafts", async () => {
    const db = seedFixture();
    db.seedProduct({ id: "prod-3", name: "Scarf", description: "A scarf", slug: "scarf", categoryId: "cat-1", status: "PUBLISHED", createdAt: T1, updatedAt: T1 });
    db.seedVariant({ id: "var-4", sku: "SCARF-RED", size: "One Size", color: "Red", colorOption: null, price: 1500, stock: 3, productId: "prod-3", sortOrder: 0, createdAt: T0, updatedAt: T0 });
    db.seedVariant({ id: "var-5", sku: "SCARF-BLU", size: "One Size", color: "Blue", colorOption: null, price: 8900, stock: 0, productId: "prod-3", sortOrder: 1, createdAt: T0, updatedAt: T0 });
    db.seedProduct({ id: "prod-4", name: "Draft Hat", description: null, slug: "draft-hat", categoryId: "cat-1", status: "DRAFT", createdAt: T2, updatedAt: T2 });
    db.seedVariant({ id: "var-6", sku: "HAT-DRAFT", size: "One Size", color: "Black", colorOption: null, price: 500, stock: 1, productId: "prod-4", sortOrder: 0, createdAt: T2, updatedAt: T2 });
    // Scarf's membership lands before Tee's (T2): cards follow membership
    // first-seen order, not product creation order.
    db.seedMembership({ id: "vc-scarf", variantId: "var-5", collectionId: "col-1", createdAt: T0 });
    db.seedMembership({ id: "vc-draft", variantId: "var-6", collectionId: "col-1", createdAt: T1 });

    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "summer" }), res);

    expect(res.statusCode).toBe(200);
    const body = res.json.mock.calls[0][0];
    expect(body.data.products).toEqual([
      {
        id: "prod-3",
        name: "Scarf",
        slug: "scarf",
        description: "A scarf",
        priceMin: 1500,
        priceMax: 8900,
        images: [],
      },
      {
        id: "prod-1",
        name: "Tee",
        slug: "tee",
        description: "A tee",
        // var-1 (2999) is not in this collection; the card still spans the
        // product's full variant set.
        priceMin: 2999,
        priceMax: 4999,
        images: [],
      },
    ]);
    // The draft member keeps its variant row but never becomes a card.
    expect(body.data.variants.map((v: Row) => v.id)).toEqual(["var-5", "var-6", "var-2"]);
  });

  it("card summaries are identical to /api/products list items (priceMin parity)", async () => {
    const db = seedFixture();
    const detail = await getPublicCollection({ slug: "summer", prisma: db.prisma });
    // prod-1's cheapest variant (2999) is not a collection member, so any
    // member-only price computation would diverge from the products list here.
    const listed = await listPublicProducts({ page: 1, limit: 10, prisma: db.prisma });

    expect(detail.products.length).toBeGreaterThan(0);
    for (const card of detail.products) {
      // A missing list row must fail loudly, hence the assertion + toEqual.
      const listItem = listed.data.find((p) => p.id === card.id);
      if (!listItem) {
        throw new Error(`card ${card.id} missing from /api/products output`);
      }
      expect(card).toEqual(listItem);
    }
  });

  it("returns an empty products array for a zero-member collection", async () => {
    const db = seedFixture();
    db.seedCollection({ id: "col-empty", name: "Empty", description: null, slug: "empty-collection", createdAt: T1, updatedAt: T1 });
    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "empty-collection" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.json.mock.calls[0][0].data.products).toEqual([]);
  });

  it("exposes the collection banner as a derived url when an image exists", async () => {
    const db = seedFixture();
    db.seedImage({ id: "img-col", key: "images/collection/col-1/banner.webp", alt: "Summer banner", sortOrder: 0, collectionId: "col-1", createdAt: T1, updatedAt: T1 });
    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "summer" }), res);

    expect(res.statusCode).toBe(200);
    const body = res.json.mock.calls[0][0];
    expect(body.success).toBe(true);
    expect(body.data.banner).toEqual({
      url: `${PUBLIC_BASE}/images/collection/col-1/banner.webp`,
      alt: "Summer banner",
    });
    const raw = JSON.stringify(body);
    expect(raw).not.toContain('"key"');
    expect(raw).not.toContain("test-secret-access-key");
    expect(raw).not.toContain("test-access-key-id");
  });

  it("returns a null banner when the collection has no image", async () => {
    const db = seedFixture();
    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "summer" }), res);

    expect(res.statusCode).toBe(200);
    expect(res.json.mock.calls[0][0].data.banner).toBeNull();
  });

  it("returns 404 COLLECTION_NOT_FOUND for unknown slug", async () => {
    const db = seedFixture();
    const controller = createPublicCollectionController(db.prisma);
    const res = createMockRes();

    await controller.getHandler(createMockReq({ slug: "missing" }), res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "COLLECTION_NOT_FOUND", message: "Collection not found" },
    });
  });
});

function routeLayerMethods(router: Router): string[] {
  const methods: string[] = [];
  for (const layer of (router as any).stack) {
    if (!layer.route) {
      throw new Error("public router attached middleware via router.use()");
    }
    methods.push(...Object.keys(layer.route.methods ?? {}));
  }
  return methods;
}

describe("public route wiring", () => {
  function makePrismaStub() {
    return {} as any;
  }

  it("attaches no identity middleware and registers GET-only routes", () => {
    const prisma = makePrismaStub();

    expect(routeLayerMethods(createPublicCategoryRoutes(prisma))).toEqual(["get"]);
    expect(routeLayerMethods(createPublicProductRoutes(prisma))).toEqual(["get", "get"]);
    expect(routeLayerMethods(createPublicCollectionRoutes(prisma))).toEqual(["get", "get"]);
  });
});

describe("admin regression: unauthenticated requests are still rejected", () => {
  function createMiddlewareRes() {
    return createMockRes();
  }

  it("requireSession returns 401 UNAUTHENTICATED without a session cookie", async () => {
    const prisma = { session: { findUnique: mock(() => Promise.resolve(null)) } } as any;
    const middleware = requireSession(prisma);
    const req = createMockReq();
    const res = createMiddlewareRes();
    const next = mock(() => {});

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Missing session" },
    });
  });

  it("requireAdmin returns 401 UNAUTHENTICATED without an authenticated user", async () => {
    const prisma = { user: { findUnique: mock(() => Promise.resolve(null)) } } as any;
    const middleware = requireAdmin(prisma);
    const req = createMockReq();
    const res = createMiddlewareRes();
    const next = mock(() => {});

    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Missing session" },
    });
  });
});
