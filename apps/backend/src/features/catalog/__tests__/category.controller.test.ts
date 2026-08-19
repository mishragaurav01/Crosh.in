import { describe, it, expect, mock } from "bun:test";
import { createCategoryController } from "../controllers/category.controller.js";

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
      create: mock(() =>
        Promise.resolve({
          id: "cat-1",
          name: "Shirts",
          description: null,
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
          description: null,
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
  } as any;
}

describe("category controller — createHandler", () => {
  it("returns 201 with created category", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq({ name: "Shirts", slug: "shirts" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: "cat-1", name: "Shirts", slug: "shirts" }),
      }),
    );
  });

  it("returns 422 on invalid body", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq({ name: "" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns 409 on duplicate slug", async () => {
    const prisma = createMockPrisma({
      category: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });
    const controller = createCategoryController(prisma);
    const req = createMockReq({ name: "Shirts", slug: "shirts" });
    const res = createMockRes();

    await controller.createHandler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "DUPLICATE_SLUG" }),
      }),
    );
  });
});

describe("category controller — listHandler", () => {
  it("returns 200 with paginated results", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, undefined, { page: "1", limit: "20" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ data: [], total: 0, page: 1, limit: 20 }),
      }),
    );
  });

  it("returns 422 on invalid query params", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, undefined, { page: "-1" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });
});

describe("category controller — getHandler", () => {
  it("returns 200 with category", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, { id: "cat-1" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ id: "cat-1" }),
      }),
    );
  });

  it("returns 404 when category not found", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, { id: "missing" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "CATEGORY_NOT_FOUND" }),
      }),
    );
  });

  it("returns 422 on invalid id param", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, { id: "" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(422);
  });
});

describe("category controller — updateHandler", () => {
  it("returns 200 with updated category", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq({ name: "Updated" }, { id: "cat-1" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ name: "Updated" }),
      }),
    );
  });

  it("returns 404 when category not found", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createCategoryController(prisma);
    const req = createMockReq({ name: "Updated" }, { id: "missing" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(404);
  });

  it("returns 422 on invalid body", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq({ name: "" }, { id: "cat-1" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(422);
  });
});

describe("category controller — deleteHandler", () => {
  it("returns 200 with success message", async () => {
    const prisma = createMockPrisma();
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, { id: "cat-1" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: "Category deleted" },
      }),
    );
  });

  it("returns 404 when category not found", async () => {
    const prisma = createMockPrisma({
      category: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createCategoryController(prisma);
    const req = createMockReq(undefined, { id: "missing" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});
