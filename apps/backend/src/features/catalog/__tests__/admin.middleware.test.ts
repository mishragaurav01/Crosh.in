import { describe, it, expect, mock } from "bun:test";
import { requireAdmin } from "../../identity/middleware/admin.middleware.js";

function createMockReq(userId?: string) {
  return {
    user: userId ? { id: userId, email: "admin@test.com", isAdmin: false } : undefined,
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
    user: {
      findUnique: mock(() =>
        Promise.resolve({ id: "user-1", isAdmin: true }),
      ),
      ...((overrides.user as object) ?? {}),
    },
  } as any;
}

describe("requireAdmin", () => {
  it("calls next() when user is admin", async () => {
    const prisma = createMockPrisma();
    const req = createMockReq("user-1");
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = requireAdmin(prisma);
    await middleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("returns 401 when user is not authenticated", async () => {
    const prisma = createMockPrisma();
    const req = createMockReq();
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = requireAdmin(prisma);
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "UNAUTHENTICATED", message: "Missing session" },
    });
  });

  it("returns 403 when user is not admin", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: mock(() =>
          Promise.resolve({ id: "user-1", isAdmin: false }),
        ),
      },
    });
    const req = createMockReq("user-1");
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = requireAdmin(prisma);
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "FORBIDDEN", message: "Administrative access required" },
    });
  });

  it("returns 403 when user does not exist", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: mock(() => Promise.resolve(null)),
      },
    });
    const req = createMockReq("user-1");
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = requireAdmin(prisma);
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "FORBIDDEN", message: "Administrative access required" },
    });
  });

  it("does not trust client-provided admin flag", async () => {
    const prisma = createMockPrisma({
      user: {
        findUnique: mock(() =>
          Promise.resolve({ id: "user-1", isAdmin: false }),
        ),
      },
    });
    const req = {
      user: { id: "user-1", email: "attacker@test.com", isAdmin: true },
    } as any;
    const res = createMockRes();
    const next = mock(() => {});

    const middleware = requireAdmin(prisma);
    await middleware(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(403);
  });
});
