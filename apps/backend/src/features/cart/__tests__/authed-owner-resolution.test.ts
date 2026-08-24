import { describe, it, expect, mock } from "bun:test";
import { resolveCartOwner } from "../middleware/resolve-cart-owner.js";
import { createCartController } from "../controllers/cart.controller.js";

const sessionRow = {
  id: "sess-1",
  userId: "user-1",
  csrfToken: "sess-csrf",
  expiresAt: new Date(Date.now() + 60_000),
  user: { id: "user-1", email: "test@example.com", isAdmin: false },
};

function createMockReq(headers: Record<string, string> = {}) {
  return {
    headers,
    user: undefined,
    csrfToken: undefined,
    guestToken: undefined,
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

function createMiddlewarePrisma(overrides: Record<string, unknown> = {}) {
  const prisma = {
    $transaction: mock(() => Promise.resolve({})),
    session: {
      findUnique: mock(() => Promise.resolve(sessionRow)),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.session as object) ?? {}),
    },
    cart: {
      findUnique: mock(() => Promise.resolve(null)),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.cart as object) ?? {}),
    },
    cartItem: {},
    variant: {},
  } as any;
  // Merge runs inside an interactive transaction; hand it a tx-shaped client.
  (prisma.$transaction as any).mockImplementation(async (callback: (tx: any) => unknown) =>
    callback({
      $queryRaw: mock(() => Promise.resolve([])),
      cart: prisma.cart,
      cartItem: {
        findUnique: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve({})),
        update: mock(() => Promise.resolve({})),
        delete: mock(() => Promise.resolve({})),
      },
      variant: { findMany: mock(() => Promise.resolve([])) },
    }),
  );
  return prisma;
}

describe("resolveCartOwner middleware — authenticated resolution", () => {
  it("attaches user and csrfToken from a valid session and calls next", async () => {
    const prisma = createMiddlewarePrisma();
    const middleware = resolveCartOwner(prisma);
    const req = createMockReq({ cookie: "session_id=sess-1" });
    const res = createMockRes();
    const next = mock(() => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(sessionRow.user);
    expect(req.csrfToken).toBe("sess-csrf");
    expect(prisma.$transaction).not.toHaveBeenCalled();
    expect(res.clearCookie).not.toHaveBeenCalled();
  });

  it("reads the cart scoped by userId without creating rows", async () => {
    const prisma = createMiddlewarePrisma({
      cart: {
        findUnique: mock(() => Promise.resolve(null)),
        create: mock(() => Promise.resolve({ id: "cart-x" })),
      },
    });
    const controller = createCartController(prisma);
    const req = {
      body: {},
      params: {},
      query: {},
      user: sessionRow.user,
      guestToken: undefined,
    } as any;
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(prisma.cart.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: "user-1" } }),
    );
    expect(prisma.cart.create).not.toHaveBeenCalled();
  });

  it("reuses the existing cart by userId on mutations instead of creating another", async () => {
    const existingCart = { id: "cart-1", items: [] };
    const tx = {
      $queryRaw: mock(() => Promise.resolve([{ stock: 10 }])),
      cartItem: {
        findUnique: mock(() => Promise.resolve(null)),
        upsert: mock(() => Promise.resolve({})),
      },
    };
    const prisma = {
      $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
        Promise.resolve(callback(tx)),
      ),
      cart: {
        findUnique: mock(() => Promise.resolve(existingCart)),
        create: mock(() => Promise.resolve({ id: "cart-2" })),
      },
      cartItem: {},
    } as any;
    const controller = createCartController(prisma);
    const req = {
      body: {},
      params: {},
      query: {},
      user: sessionRow.user,
      guestToken: undefined,
    } as any;
    req.body = { variantId: "var-1", quantity: 1 };
    const res = createMockRes();
    res.cookie = mock(() => res);
    res.clearCookie = mock(() => res);

    await controller.addItemHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(prisma.cart.findUnique).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(prisma.cart.create).not.toHaveBeenCalled();
  });

  it("degrades to a guest request when the session is expired instead of rejecting", async () => {
    const prisma = createMiddlewarePrisma({
      session: {
        findUnique: mock(() =>
          Promise.resolve({
            ...sessionRow,
            expiresAt: new Date(Date.now() - 1000),
          }),
        ),
      },
    });
    const middleware = resolveCartOwner(prisma);
    const req = createMockReq({
      cookie: "session_id=sess-1; guest_token=gtok",
    });
    const res = createMockRes();
    const next = mock(() => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
    expect(req.guestToken).toBe("gtok");
    expect(res.status).not.toHaveBeenCalled();
  });

  it("degrades to a guest request when the session does not resolve", async () => {
    const prisma = createMiddlewarePrisma({
      session: { findUnique: mock(() => Promise.resolve(null)) },
    });
    const middleware = resolveCartOwner(prisma);
    const req = createMockReq({ cookie: "session_id=bogus" });
    const res = createMockRes();
    const next = mock(() => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
    expect(res.status).not.toHaveBeenCalled();
  });

  it("keeps the request anonymous when no cookies are present at all", async () => {
    const prisma = createMiddlewarePrisma();
    const middleware = resolveCartOwner(prisma);
    const req = createMockReq({});
    const res = createMockRes();
    const next = mock(() => {});

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toBeUndefined();
    expect(req.guestToken).toBeUndefined();
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
