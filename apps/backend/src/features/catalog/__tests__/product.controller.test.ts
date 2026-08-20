import { describe, it, expect, mock } from "bun:test";
import { createProductController } from "../controllers/product.controller.js";

const mockProduct = {
  id: "prod-1",
  name: "Basic Tee",
  description: null,
  slug: "basic-tee",
  categoryId: "cat-1",
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
    category: {
      findUnique: mock(() =>
        Promise.resolve({ id: "cat-1", name: "Shirts", slug: "shirts", description: null, createdAt: new Date(), updatedAt: new Date() }),
      ),
      ...((overrides.category as object) ?? {}),
    },
    product: {
      create: mock(() => Promise.resolve(mockProduct)),
      findMany: mock(() => Promise.resolve([])),
      count: mock(() => Promise.resolve(0)),
      findUnique: mock(() => Promise.resolve(mockProduct)),
      update: mock(() => Promise.resolve({ ...mockProduct, name: "Updated" })),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.product as object) ?? {}),
    },
    variant: {
      count: mock(() => Promise.resolve(0)),
      ...((overrides.variant as object) ?? {}),
    },
    productCollection: {
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
      ...((overrides.productCollection as object) ?? {}),
    },
  } as any;
}

describe("product controller — createHandler", () => {
  it("returns 201 with created product", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq({ name: "Basic Tee", slug: "basic-tee", categoryId: "cat-1" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: "prod-1", name: "Basic Tee" }),
      }),
    );
  });

  it("returns 422 on invalid body", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq({ name: "" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(422);
  });

  it("returns 400 when category does not exist", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createProductController(prisma);
    const req = createMockReq({ name: "Tee", slug: "tee", categoryId: "missing" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "INVALID_CATEGORY" }),
      }),
    );
  });

  it("returns 409 on duplicate slug", async () => {
    const prisma = createMockPrisma({
      product: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });
    const controller = createProductController(prisma);
    const req = createMockReq({ name: "Tee", slug: "taken", categoryId: "cat-1" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(409);
  });
});

describe("product controller — listHandler", () => {
  it("returns 200 with paginated results", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq(undefined, undefined, { page: "1", limit: "20" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ data: [], total: 0 }),
      }),
    );
  });

  it("passes categoryId filter to service", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq(undefined, undefined, { page: "1", limit: "20", categoryId: "cat-1" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(prisma.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { categoryId: "cat-1" } }),
    );
  });
});

describe("product controller — getHandler", () => {
  it("returns 200 with product", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq(undefined, { id: "prod-1" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 404 when product not found", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createProductController(prisma);
    const req = createMockReq(undefined, { id: "missing" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("product controller — updateHandler", () => {
  it("returns 200 with updated product", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq({ name: "Updated" }, { id: "prod-1" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(200);
  });

  it("returns 404 when product not found", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createProductController(prisma);
    const req = createMockReq({ name: "Updated" }, { id: "missing" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(404);
  });

  it("returns 400 when updating to non-existent category", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createProductController(prisma);
    const req = createMockReq({ categoryId: "bad" }, { id: "prod-1" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(400);
  });
});

describe("product controller — deleteHandler", () => {
  it("returns 200 with success message", async () => {
    const prisma = createMockPrisma();
    const controller = createProductController(prisma);
    const req = createMockReq(undefined, { id: "prod-1" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: "Product deleted" },
      }),
    );
  });

  it("returns 404 when product not found", async () => {
    const prisma = createMockPrisma({
      product: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createProductController(prisma);
    const req = createMockReq(undefined, { id: "missing" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});
