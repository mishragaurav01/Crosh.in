import { describe, it, expect, mock } from "bun:test";
import { createCartController } from "../controllers/cart.controller.js";
import { updateCartItem } from "../services/cart.service.js";

const ownedLine = { id: "line-1", variantId: "var-1" };

function createServicePrisma() {
  const tx = {
    $queryRaw: mock(() => Promise.resolve([{ stock: 10 }])),
    cartItem: { update: mock(() => Promise.resolve({})) },
  };

  return {
    $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
    tx,
    cart: {
      findUnique: mock(() =>
        Promise.resolve({ id: "cart-1", items: [] }),
      ),
    },
    cartItem: {
      findFirst: mock(() => Promise.resolve(ownedLine)),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
  } as any;
}

function createMockReq(fields: { body?: unknown; params?: Record<string, string> }) {
  return {
    body: fields.body ?? {},
    params: fields.params ?? {},
    query: {},
    user: undefined,
    guestToken: "gtok",
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

describe("updateCartItem — quantity 0 is an implicit remove", () => {
  it("deletes the line instead of rejecting when quantity is 0", async () => {
    const prisma = createServicePrisma();

    await updateCartItem({
      prisma,
      owner: { guestToken: "gtok" },
      itemId: "line-1",
      quantity: 0,
    });

    expect(prisma.cartItem.delete).toHaveBeenCalledWith({
      where: { id: "line-1" },
    });
  });

  it("skips the stock-guarded transaction entirely for a removal", async () => {
    const prisma = createServicePrisma();

    await updateCartItem({
      prisma,
      owner: { guestToken: "gtok" },
      itemId: "line-1",
      quantity: 0,
    });

    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(prisma.tx.$queryRaw).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/cart/items/:itemId — quantity 0 contract at the controller", () => {
  it("returns 200 and removes the line on quantity 0", async () => {
    const controller = createCartController(createServicePrisma());
    const req = createMockReq({ body: { quantity: 0 }, params: { itemId: "line-1" } });
    const res = createMockRes();

    await controller.updateItemHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, data: { items: [], subtotal: 0 } }),
    );
  });

  it("rejects negative quantities with 422 — only 0 is the remove sentinel", async () => {
    const controller = createCartController(createServicePrisma());
    const req = createMockReq({ body: { quantity: -1 }, params: { itemId: "line-1" } });
    const res = createMockRes();

    await controller.updateItemHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("still returns 404 CART_ITEM_NOT_FOUND for quantity 0 on an item the owner does not hold", async () => {
    const prisma = createServicePrisma();
    (prisma.cartItem.findFirst as any).mockImplementation(() =>
      Promise.resolve(null),
    );
    const controller = createCartController(prisma);
    const req = createMockReq({ body: { quantity: 0 }, params: { itemId: "someone-elses" } });
    const res = createMockRes();

    await controller.updateItemHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "CART_ITEM_NOT_FOUND" }),
      }),
    );
    expect(prisma.cartItem.delete).not.toHaveBeenCalled();
  });
});
