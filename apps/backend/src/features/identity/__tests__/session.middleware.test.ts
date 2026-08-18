import { describe, it, expect, mock, beforeEach } from "bun:test";
import { requireSession } from "../middleware/session.middleware.js";

function createMockReq(cookie?: string) {
  return {
    headers: cookie !== undefined ? { cookie } : {},
    user: undefined,
  } as any;
}

function createMockRes() {
  const res: any = {
    status: mock(() => res),
    json: mock(() => res),
  };
  return res;
}

function createMockNext() {
  return mock(() => {});
}

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    session: {
      findUnique: mock(() => Promise.resolve(null)),
      delete: mock(() => Promise.resolve({})),
      ...((overrides.session as object) ?? {}),
    },
  } as any;
}

describe("requireSession middleware", () => {
  it("returns 401 when no cookie header is present", async () => {
    const prisma = createMockPrisma();
    const middleware = requireSession(prisma);
    const req = createMockReq();
    const res = createMockRes();
    const next = createMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "UNAUTHENTICATED" }),
      }),
    );
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session_id cookie is missing", async () => {
    const prisma = createMockPrisma();
    const middleware = requireSession(prisma);
    const req = createMockReq("other_cookie=value");
    const res = createMockRes();
    const next = createMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session is invalid", async () => {
    const prisma = createMockPrisma();
    const middleware = requireSession(prisma);
    const req = createMockReq("session_id=invalid-session");
    const res = createMockRes();
    const next = createMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("attaches user, csrfToken and calls next for valid session", async () => {
    const prisma = createMockPrisma({
      session: {
        findUnique: mock(() =>
          Promise.resolve({
            id: "session-1",
            userId: "user-1",
            csrfToken: "csrf-token-1",
            expiresAt: new Date(Date.now() + 60_000),
            user: { id: "user-1", email: "test@example.com" },
          }),
        ),
      },
    });
    const middleware = requireSession(prisma);
    const req = createMockReq("session_id=session-1");
    const res = createMockRes();
    const next = createMockNext();

    await middleware(req, res, next);

    expect(req.user).toEqual({ id: "user-1", email: "test@example.com" });
    expect(req.csrfToken).toBe("csrf-token-1");
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it("returns 401 when session is expired", async () => {
    const prisma = createMockPrisma({
      session: {
        findUnique: mock(() =>
          Promise.resolve({
            id: "session-1",
            userId: "user-1",
            expiresAt: new Date(Date.now() - 1000),
            user: { id: "user-1", email: "test@example.com" },
          }),
        ),
      },
    });
    const middleware = requireSession(prisma);
    const req = createMockReq("session_id=session-1");
    const res = createMockRes();
    const next = createMockNext();

    await middleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });
});
