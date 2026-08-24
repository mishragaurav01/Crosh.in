import { describe, it, expect, mock } from "bun:test";
import { createCartController } from "../controllers/cart.controller.js";
import {
  GUEST_TOKEN_COOKIE,
  GUEST_CSRF_COOKIE,
} from "../utils/guest-cookie.js";

function createMockReq(fields: {
  body?: unknown;
  user?: { id: string };
  guestToken?: string;
}) {
  return {
    body: fields.body ?? {},
    params: {},
    query: {},
    user: fields.user,
    guestToken: fields.guestToken,
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    cookiesSet: [] as Array<{ name: string; value: string; options: Record<string, unknown> }>,
    status: mock(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: mock(function (this: any, data: unknown) {
      this.body = data;
      return this;
    }),
    cookie: mock(function (this: any, name: string, value: string, options?: Record<string, unknown>) {
      this.cookiesSet.push({ name, value, options: options ?? {} });
      return this;
    }),
    clearCookie: mock(function (this: any) {
      return this;
    }),
  };
  return res;
}

// The transactional client is exposed on the mock so tests can assert the
// writes that happen inside $transaction (plan.md Phase 4: "$transaction
// mocked to invoke the callback with a tx mock").
function createMockPrisma(overrides: Record<string, unknown> = {}) {
  const tx = {
    $queryRaw: mock(() => Promise.resolve([{ stock: 10 }])),
    cart: {
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    cartItem: {
      findUnique: mock(() => Promise.resolve(null)),
      upsert: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      create: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    variant: { findMany: mock(() => Promise.resolve([])) },
  };

  const prisma = {
    $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
    tx,
    cart: {
      findUnique: mock(() => Promise.resolve(null)),
      create: mock((args: { data: { userId?: string; guestToken?: string } }) =>
        Promise.resolve({ id: "cart-new", ...args.data }),
      ),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.cart as object) ?? {}),
    },
    cartItem: {
      findFirst: mock(() => Promise.resolve(null)),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
      ...((overrides.cartItem as object) ?? {}),
    },
    variant: { findMany: mock(() => Promise.resolve([])) },
  } as any;

  return prisma;
}

describe("guest cart lazy creation", () => {
  it("GET for an anonymous visitor returns the empty shape without creating rows", async () => {
    const prisma = createMockPrisma();
    const controller = createCartController(prisma);
    const req = createMockReq({});
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { items: [], subtotal: 0 },
    });
    expect(prisma.cart.create).not.toHaveBeenCalled();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("GET with an existing guest token reads the cart without creating anything", async () => {
    const prisma = createMockPrisma({
      cart: {
        findUnique: mock(() =>
          Promise.resolve({
            id: "cart-1",
            items: [
              {
                id: "line-1",
                variantId: "var-1",
                quantity: 2,
                variant: {
                  price: 2999,
                  stock: 10,
                  size: "M",
                  color: "Black",
                  product: { name: "Tee", slug: "tee", images: [] },
                },
              },
            ],
          }),
        ),
      },
    });
    const controller = createCartController(prisma);
    const req = createMockReq({ guestToken: "tok" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(prisma.cart.create).not.toHaveBeenCalled();
    expect(res.cookie).not.toHaveBeenCalled();
  });

  it("first mutating request of an anonymous visitor creates a guest cart and issues cookies", async () => {
    const prisma = createMockPrisma();
    const controller = createCartController(prisma);
    const req = createMockReq({ body: { variantId: "var-1", quantity: 1 } });
    const res = createMockRes();

    await controller.addItemHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(prisma.cart.create).toHaveBeenCalledTimes(1);
    expect(prisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          guestToken: expect.stringMatching(/^[0-9a-f]{64}$/),
        }),
      }),
    );

    const createdToken = (prisma.cart.create as any).mock.calls[0][0].data
      .guestToken as string;

    const tokenCookie = res.cookiesSet.find(
      (c: { name: string }) => c.name === GUEST_TOKEN_COOKIE,
    );
    const csrfCookie = res.cookiesSet.find(
      (c: { name: string }) => c.name === GUEST_CSRF_COOKIE,
    );

    expect(tokenCookie).toBeDefined();
    expect(tokenCookie.value).toBe(createdToken);
    expect(tokenCookie.options.httpOnly).toBe(true);
    expect(tokenCookie.options.sameSite).toBe("lax");
    expect(tokenCookie.options.path).toBe("/");

    expect(csrfCookie).toBeDefined();
    expect(csrfCookie.value).toBe(createdToken);
    // Double-submit requires the SPA to read this one back.
    expect(csrfCookie.options.httpOnly).toBe(false);
    expect(csrfCookie.options.sameSite).toBe("lax");
  });

  it("repeat mutations reuse the existing guest cart instead of creating another", async () => {
    const existingCart = {
      id: "cart-1",
      items: [
        {
          id: "line-1",
          variantId: "var-1",
          quantity: 2,
          variant: {
            price: 2999,
            stock: 10,
            size: "M",
            color: "Black",
            product: { name: "Tee", slug: "tee", images: [] },
          },
        },
      ],
    };
    const prisma = createMockPrisma({
      cart: { findUnique: mock(() => Promise.resolve(existingCart)) },
    });
    const controller = createCartController(prisma);
    const req = createMockReq({
      guestToken: "tok",
      body: { variantId: "var-1", quantity: 1 },
    });
    const res = createMockRes();

    await controller.addItemHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(prisma.cart.create).not.toHaveBeenCalled();

    const upsertArgs = (prisma.tx.cartItem.upsert as any).mock.calls[0][0];
    expect(upsertArgs.where.cartId_variantId.cartId).toBe("cart-1");

    // Existing guests already hold their cookies — no re-issuance.
    expect(res.cookiesSet).toHaveLength(0);
  });

  it("authenticated mutations never issue or require guest cookies", async () => {
    const prisma = createMockPrisma({
      cart: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const controller = createCartController(prisma);
    const req = createMockReq({
      user: { id: "user-1" },
      body: { variantId: "var-1", quantity: 1 },
    });
    const res = createMockRes();

    await controller.addItemHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(prisma.cart.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: { userId: "user-1" } }),
    );
    expect(res.cookiesSet).toHaveLength(0);
  });
});
