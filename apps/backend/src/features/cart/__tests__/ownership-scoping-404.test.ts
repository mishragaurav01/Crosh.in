import { describe, it, expect, mock } from "bun:test";
import { createCartController } from "../controllers/cart.controller.js";
import { removeCartItem, updateCartItem } from "../services/cart.service.js";

function createMockReq(fields: {
  body?: unknown;
  params?: Record<string, string>;
  user?: { id: string };
  guestToken?: string;
}) {
  return {
    body: fields.body ?? {},
    params: fields.params ?? {},
    query: {},
    user: fields.user,
    guestToken: fields.guestToken,
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
    cookie: mock(function (this: any) {
      return this;
    }),
    clearCookie: mock(function (this: any) {
      return this;
    }),
  };
  return res;
}

function createServicePrisma(params: { ownedItem: unknown; ownerWhere: Record<string, string> }) {
  const prisma = {
    $transaction: mock(() => Promise.resolve({})),
    cart: { findUnique: mock(() => Promise.resolve(null)) },
    cartItem: {
      findFirst: mock(() => Promise.resolve(params.ownedItem)),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
    variant: {},
  } as any;
  (prisma.$transaction as any).mockImplementation(async () => {});
  return { prisma, ownerWhere: params.ownerWhere };
}

describe("ownership scoping — cross-owner item access returns 404", () => {
  it("scopes the lookup to the owner's cart when updating", async () => {
    const { prisma, ownerWhere } = createServicePrisma({
      ownedItem: null,
      ownerWhere: { userId: "user-a" },
    });

    await expect(
      updateCartItem({ prisma, owner: { userId: "user-a" }, itemId: "line-9", quantity: 2 }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "CART_ITEM_NOT_FOUND", statusCode: 404 }),
    );

    // The where clause must carry the ownership scope, not just the item id.
    expect(prisma.cartItem.findFirst).toHaveBeenCalledWith({
      where: { id: "line-9", cart: ownerWhere },
      select: { id: true, variantId: true },
    });
  });

  it("scopes the lookup to the owner's cart when removing", async () => {
    const { prisma, ownerWhere } = createServicePrisma({
      ownedItem: null,
      ownerWhere: { guestToken: "gtok-a" },
    });

    await expect(
      removeCartItem({ prisma, owner: { guestToken: "gtok-a" }, itemId: "line-9" }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "CART_ITEM_NOT_FOUND", statusCode: 404 }),
    );

    expect(prisma.cartItem.findFirst).toHaveBeenCalledWith({
      where: { id: "line-9", cart: ownerWhere },
      select: { id: true, variantId: true },
    });
  });

  it("never deletes another cart's line even when a matching id exists elsewhere", async () => {
    // The other user's line exists in the table, but the scoped findFirst
    // (simulating the DB's cart filter) cannot see it.
    const { prisma } = createServicePrisma({
      ownedItem: null,
      ownerWhere: { userId: "user-a" },
    });

    await expect(
      removeCartItem({ prisma, owner: { userId: "user-a" }, itemId: "user-bs-line" }),
    ).rejects.toThrow(expect.objectContaining({ statusCode: 404 }));

    expect(prisma.cartItem.delete).not.toHaveBeenCalled();
  });
});

describe("cross-owner access at the controller — 404, not 403 or leaked data", () => {
  it("PATCH from another authenticated user yields 404 CART_ITEM_NOT_FOUND", async () => {
    const prisma = createServicePrisma({
      ownedItem: null,
      ownerWhere: { userId: "user-b" },
    }).prisma;
    const controller = createCartController(prisma);
    const req = createMockReq({
      body: { quantity: 3 },
      params: { itemId: "line-of-user-b" },
      user: { id: "user-b" },
    });
    const res = createMockRes();

    await controller.updateItemHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "CART_ITEM_NOT_FOUND" }),
      }),
    );
  });

  it("DELETE from a different guest yields 404 without confirming existence via 403", async () => {
    const prisma = createServicePrisma({
      ownedItem: null,
      ownerWhere: { guestToken: "gtok-other" },
    }).prisma;
    const controller = createCartController(prisma);
    const req = createMockReq({
      params: { itemId: "line-of-other-guest" },
      guestToken: "gtok-other",
    });
    const res = createMockRes();

    await controller.removeItemHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false }),
    );
  });

  it("an owner with no cart at all gets the same 404 for any item id", async () => {
    const prisma = createServicePrisma({
      ownedItem: null,
      ownerWhere: { userId: "cartless-user" },
    }).prisma;
    const controller = createCartController(prisma);
    const req = createMockReq({
      params: { itemId: "any-line" },
      user: { id: "cartless-user" },
    });
    const res = createMockRes();

    await controller.removeItemHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(prisma.cartItem.delete).not.toHaveBeenCalled();
  });
});
