import { describe, it, expect, mock } from "bun:test";
import { createMembershipController } from "../controllers/membership.controller.js";

const mockMembership = { id: "vc-1", variantId: "var-1", collectionId: "col-1", createdAt: new Date() };

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
    collection: {
      findUnique: mock(() =>
        Promise.resolve({ id: "col-1", name: "Summer", slug: "summer", description: null, createdAt: new Date(), updatedAt: new Date() }),
      ),
      ...((overrides.collection as object) ?? {}),
    },
    variant: {
      findUnique: mock(() =>
        Promise.resolve({ id: "var-1", sku: "TEE-S-BLK", size: "S", color: "Black", price: 2999, stock: 50, productId: "prod-1", createdAt: new Date(), updatedAt: new Date() }),
      ),
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

describe("membership controller — addHandler", () => {
  it("returns 201 with created membership", async () => {
    const prisma = createMockPrisma();
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "col-1", variantId: "var-1" });
    const res = createMockRes();

    await controller.addHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ variantId: "var-1", collectionId: "col-1" }),
      }),
    );
  });

  it("returns 404 when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "missing", variantId: "var-1" });
    const res = createMockRes();

    await controller.addHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "COLLECTION_NOT_FOUND" }),
      }),
    );
  });

  it("returns 404 when variant does not exist", async () => {
    const prisma = createMockPrisma({
      variant: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "col-1", variantId: "missing" });
    const res = createMockRes();

    await controller.addHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VARIANT_NOT_FOUND" }),
      }),
    );
  });

  it("returns 409 on duplicate membership", async () => {
    const prisma = createMockPrisma({
      variantCollection: {
        create: mock(() => {
          const error = new Error("Unique constraint failed") as Error & { code: string };
          error.code = "P2002";
          throw error;
        }),
      },
    });
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "col-1", variantId: "var-1" });
    const res = createMockRes();

    await controller.addHandler(req, res);

    expect(res.statusCode).toBe(409);
  });

  it("returns 422 on invalid params", async () => {
    const prisma = createMockPrisma();
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "", variantId: "var-1" });
    const res = createMockRes();

    await controller.addHandler(req, res);

    expect(res.statusCode).toBe(422);
  });
});

describe("membership controller — removeHandler", () => {
  it("returns 200 with success message", async () => {
    const prisma = createMockPrisma();
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "col-1", variantId: "var-1" });
    const res = createMockRes();

    await controller.removeHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: "Variant removed from collection" },
      }),
    );
  });

  it("returns 404 when membership does not exist", async () => {
    const prisma = createMockPrisma({
      variantCollection: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "col-1", variantId: "missing" });
    const res = createMockRes();

    await controller.removeHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("membership controller — listVariantsHandler", () => {
  it("returns 200 with paginated results", async () => {
    const prisma = createMockPrisma();
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "col-1" }, { page: "1", limit: "20" });
    const res = createMockRes();

    await controller.listVariantsHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ data: [], total: 0 }),
      }),
    );
  });

  it("returns 404 when collection does not exist", async () => {
    const prisma = createMockPrisma({
      collection: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createMembershipController(prisma);
    const req = createMockReq(undefined, { collectionId: "missing" }, { page: "1", limit: "20" });
    const res = createMockRes();

    await controller.listVariantsHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});
