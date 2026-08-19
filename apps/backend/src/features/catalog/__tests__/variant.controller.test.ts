import { describe, it, expect, mock } from "bun:test";
import { createVariantController } from "../controllers/variant.controller.js";

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

function createMockReq(body?: unknown, params?: Record<string, string>, query?: Record<string, string>) {
  return {
    body: body ?? {},
    params: params ?? {},
    query: query ?? {},
    user: undefined,
  } as any;
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
      update: mock(() => Promise.resolve({ ...mockVariant, size: "M" })),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.variant as object) ?? {}),
    },
  } as any;
}

describe("variant controller — createHandler", () => {
  it("returns 201 with created variant", async () => {
    const prisma = createMockPrisma();
    const controller = createVariantController(prisma);
    const req = createMockReq({ sku: "TEE-S-BLK", size: "S", color: "Black", price: 2999, stock: 50 }, { productId: "prod-1" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: "var-1", sku: "TEE-S-BLK" }),
      }),
    );
  });

  it("returns 422 on invalid body", async () => {
    const prisma = createMockPrisma();
    const controller = createVariantController(prisma);
    const req = createMockReq({ sku: "" }, { productId: "prod-1" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(422);
  });

  it("returns 400 when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createVariantController(prisma);
    const req = createMockReq({ sku: "X", size: "S", color: "Black", price: 100, stock: 0 }, { productId: "missing" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "INVALID_PRODUCT" }),
      }),
    );
  });

  it("returns 409 on duplicate SKU", async () => {
    const prisma = createMockPrisma({
      variant: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });
    const controller = createVariantController(prisma);
    const req = createMockReq({ sku: "DUP", size: "S", color: "Black", price: 100, stock: 0 }, { productId: "prod-1" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(409);
  });
});

describe("variant controller — listHandler", () => {
  it("returns 200 with paginated results", async () => {
    const prisma = createMockPrisma();
    const controller = createVariantController(prisma);
    const req = createMockReq(undefined, { productId: "prod-1" }, { page: "1", limit: "20" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 400 when product does not exist", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createVariantController(prisma);
    const req = createMockReq(undefined, { productId: "missing" }, { page: "1", limit: "20" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(400);
  });
});

describe("variant controller — getHandler", () => {
  it("returns 200 with variant", async () => {
    const prisma = createMockPrisma();
    const controller = createVariantController(prisma);
    const req = createMockReq(undefined, { productId: "prod-1", variantId: "var-1" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 404 when variant not found", async () => {
    const prisma = createMockPrisma({
      variant: { findFirst: mock(() => Promise.resolve(null)) },
    });
    const controller = createVariantController(prisma);
    const req = createMockReq(undefined, { productId: "prod-1", variantId: "missing" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("variant controller — updateHandler", () => {
  it("returns 200 with updated variant", async () => {
    const prisma = createMockPrisma();
    const controller = createVariantController(prisma);
    const req = createMockReq({ size: "M" }, { productId: "prod-1", variantId: "var-1" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 404 when variant not found", async () => {
    const prisma = createMockPrisma({
      variant: { findFirst: mock(() => Promise.resolve(null)) },
    });
    const controller = createVariantController(prisma);
    const req = createMockReq({ size: "M" }, { productId: "prod-1", variantId: "missing" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("variant controller — deleteHandler", () => {
  it("returns 200 with success message", async () => {
    const prisma = createMockPrisma();
    const controller = createVariantController(prisma);
    const req = createMockReq(undefined, { productId: "prod-1", variantId: "var-1" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: "Variant deleted" },
      }),
    );
  });

  it("returns 404 when variant not found", async () => {
    const prisma = createMockPrisma({
      variant: { findFirst: mock(() => Promise.resolve(null)) },
    });
    const controller = createVariantController(prisma);
    const req = createMockReq(undefined, { productId: "prod-1", variantId: "missing" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});
