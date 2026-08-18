import { describe, it, expect, mock, beforeEach } from "bun:test";
import { createAuthController } from "../controllers/auth.controller.js";

function createMockReq(body?: unknown, cookie?: string) {
  return {
    body: body ?? {},
    headers: cookie !== undefined ? { cookie } : {},
    user: undefined,
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    cookieCalledWith: undefined as { name: string; value: string; opts: unknown } | undefined,
    clearCookieCalledWith: undefined as unknown,
    status: mock(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: mock(function (this: any, data: unknown) {
      this.body = data;
      return this;
    }),
    cookie: mock(function (this: any, name: string, value: string, opts: unknown) {
      this.cookieCalledWith = { name, value, opts };
      return this;
    }),
    clearCookie: mock(function (this: any, name: string, opts: unknown) {
      this.clearCookieCalledWith = { name, opts };
      return this;
    }),
  };
  return res;
}

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    otpCode: {
      findFirst: mock(() => Promise.resolve(null)),
      count: mock(() => Promise.resolve(0)),
      create: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      ...((overrides.otpCode as object) ?? {}),
    },
    user: {
      upsert: mock(() =>
        Promise.resolve({ id: "user-1", email: "test@example.com" }),
      ),
      ...((overrides.user as object) ?? {}),
    },
    session: {
      create: mock(() =>
        Promise.resolve({
          id: "session-1",
          userId: "user-1",
          csrfToken: "csrf-token-1",
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
      ),
      findUnique: mock(() => Promise.resolve(null)),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({})),
      ...((overrides.session as object) ?? {}),
    },
  } as any;
}

const mockSendEmail = mock(() => Promise.resolve());

describe("auth controller — requestOtpHandler", () => {
  it("returns 200 with success envelope on valid email", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "test@example.com" });
    const res = createMockRes();

    await controller.requestOtpHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          message: "OTP sent successfully",
          expiresInSeconds: 600,
        }),
      }),
    );
  });

  it("returns 422 with validation error on invalid email", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "not-an-email" });
    const res = createMockRes();

    await controller.requestOtpHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns 429 on rate limit", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-old",
            createdAt: new Date(Date.now() - 30_000),
          }),
        ),
      },
    });
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "test@example.com" });
    const res = createMockRes();

    await controller.requestOtpHandler(req, res);

    expect(res.statusCode).toBe(429);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "OTP_RATE_LIMITED" }),
      }),
    );
  });
});

describe("auth controller — verifyOtpHandler", () => {
  it("returns 200 and sets session + CSRF cookies on valid code", async () => {
    const { hashOtp } = await import("../utils/otp.util.js");
    const code = "123456";
    const codeHash = await hashOtp(code);
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-1",
            email: "test@example.com",
            codeHash,
            attempts: 0,
            expiresAt: new Date(Date.now() + 600_000),
            consumedAt: null,
          }),
        ),
      },
    });
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "test@example.com", code });
    const res = createMockRes();

    await controller.verifyOtpHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          user: expect.objectContaining({ id: "user-1", email: "test@example.com" }),
          csrfToken: expect.any(String),
        }),
      }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "session_id",
      "session-1",
      expect.objectContaining({ httpOnly: true, sameSite: "lax", path: "/" }),
    );
    expect(res.cookie).toHaveBeenCalledWith(
      "csrf_token",
      expect.any(String),
      expect.objectContaining({ httpOnly: false, sameSite: "lax", path: "/" }),
    );
  });

  it("returns 422 on invalid body", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "bad" });
    const res = createMockRes();

    await controller.verifyOtpHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns 400 on invalid OTP code", async () => {
    const { hashOtp } = await import("../utils/otp.util.js");
    const codeHash = await hashOtp("123456");
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-1",
            email: "test@example.com",
            codeHash,
            attempts: 0,
            expiresAt: new Date(Date.now() + 600_000),
            consumedAt: null,
          }),
        ),
      },
    });
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "test@example.com", code: "654321" });
    const res = createMockRes();

    await controller.verifyOtpHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "OTP_INVALID" }),
      }),
    );
  });

  it("returns 400 on expired OTP", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() => Promise.resolve(null)),
      },
    });
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq({ email: "test@example.com", code: "123456" });
    const res = createMockRes();

    await controller.verifyOtpHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "OTP_EXPIRED" }),
      }),
    );
  });
});

describe("auth controller — meHandler", () => {
  it("returns user data when req.user is set", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq();
    req.user = { id: "user-1", email: "test@example.com" };
    const res = createMockRes();

    await controller.meHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { user: { id: "user-1", email: "test@example.com" } },
      }),
    );
  });

  it("returns 401 when req.user is not set", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq();
    const res = createMockRes();

    await controller.meHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "UNAUTHENTICATED" }),
      }),
    );
  });
});

describe("auth controller — logoutHandler", () => {
  it("deletes session, clears session + CSRF cookies, returns success", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq(undefined, "session_id=session-1");
    req.user = { id: "user-1", email: "test@example.com" };
    const res = createMockRes();

    await controller.logoutHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: "Logged out" },
      }),
    );
    expect(prisma.session.deleteMany).toHaveBeenCalledWith({
      where: { id: "session-1" },
    });
    expect(res.clearCookie).toHaveBeenCalledWith(
      "session_id",
      expect.objectContaining({ httpOnly: true, sameSite: "lax" }),
    );
    expect(res.clearCookie).toHaveBeenCalledWith(
      "csrf_token",
      expect.objectContaining({ httpOnly: false, sameSite: "lax" }),
    );
  });

  it("returns 401 when req.user is not set", async () => {
    const prisma = createMockPrisma();
    const controller = createAuthController(prisma, mockSendEmail);
    const req = createMockReq();
    const res = createMockRes();

    await controller.logoutHandler(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "UNAUTHENTICATED" }),
      }),
    );
  });
});
