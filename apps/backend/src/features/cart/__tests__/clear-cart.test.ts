import { describe, it, expect, mock } from "bun:test";
import { createCartController } from "../controllers/cart.controller.js";
import { clearCartItems } from "../services/cart.service.js";

function createMockReq(user?: { id: string }, guestToken?: string) {
  return { body: {}, params: {}, query: {}, user, guestToken } as any;
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

// clearCartItems reads the cart twice: once for the id lookup (select: { id })
// and once for the refreshed DTO read (select includes items).
function createClearPrisma(params: { existingCart: Record<string, unknown> | null }) {
  const postClearRow = { id: "cart-1", items: [] };
  const prisma = {
    cart: {
      findUnique: mock((args: { select?: Record<string, unknown> }) => {
        if (args.select && "items" in args.select) {
          return Promise.resolve(postClearRow);
        }
        return Promise.resolve(params.existingCart);
      }),
      create: mock(() => Promise.resolve({ id: "cart-x" })),
    },
    cartItem: {
      deleteMany: mock(() => Promise.resolve({ count: 2 })),
      findFirst: mock(() => Promise.resolve(null)),
      delete: mock(() => Promise.resolve({})),
    },
  } as any;
  return prisma;
}

describe("clearCartItems", () => {
  it("deletes every line of the owner's cart", async () => {
    const prisma = createClearPrisma({ existingCart: { id: "cart-1" } });

    await clearCartItems({ prisma, owner: { userId: "user-1" } });

    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: "cart-1" },
    });
  });

  it("scopes the lookup by userId for authenticated owners", async () => {
    const prisma = createClearPrisma({ existingCart: { id: "cart-1" } });

    await clearCartItems({ prisma, owner: { userId: "user-1" } });

    expect(prisma.cart.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      select: { id: true },
    });
  });

  it("scopes the lookup by guestToken for guests", async () => {
    const prisma = createClearPrisma({ existingCart: { id: "cart-g" } });

    await clearCartItems({ prisma, owner: { guestToken: "gtok" } });

    expect(prisma.cart.findUnique).toHaveBeenCalledWith({
      where: { guestToken: "gtok" },
      select: { id: true },
    });
    expect(prisma.cartItem.deleteMany).toHaveBeenCalledWith({
      where: { cartId: "cart-g" },
    });
  });

  it("is a no-op success when the owner has no cart yet", async () => {
    const prisma = createClearPrisma({ existingCart: null });

    const result = await clearCartItems({
      prisma,
      owner: { userId: "cartless-user" },
    });

    expect(prisma.cartItem.deleteMany).not.toHaveBeenCalled();
    expect(prisma.cart.create).not.toHaveBeenCalled();
    expect(result).toEqual({ items: [], subtotal: 0 });
  });
});

describe("DELETE /api/cart at the controller", () => {
  it("returns 200 with the emptied cart DTO", async () => {
    const controller = createCartController(
      createClearPrisma({ existingCart: { id: "cart-1" } }),
    );
    const req = createMockReq(undefined, "gtok");
    const res = createMockRes();

    await controller.clearHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { items: [], subtotal: 0 },
    });
  });

  it("stays idempotent when there was never a cart", async () => {
    const controller = createCartController(createClearPrisma({ existingCart: null }));
    const req = createMockReq({ id: "user-1" });
    const res = createMockRes();

    await controller.clearHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { items: [], subtotal: 0 },
    });
  });
});
