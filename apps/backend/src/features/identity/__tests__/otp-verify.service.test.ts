import { describe, it, expect, mock, beforeEach } from "bun:test";
import { verifyOtp } from "../services/otp-verify.service.js";
import { OtpError } from "../types/otp-errors.js";
import { hashOtp } from "../utils/otp.util.js";

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    otpCode: {
      findFirst: mock(() => Promise.resolve(null)),
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
      ...((overrides.session as object) ?? {}),
    },
  } as any;
}

describe("verifyOtp", () => {
  it("accepts valid code and creates user", async () => {
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

    const result = await verifyOtp({
      email: "test@example.com",
      code,
      prisma,
    });

    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("test@example.com");
    expect(result.session.sessionId).toBe("session-1");
    expect(result.session.csrfToken).toEqual(expect.any(String));
    expect(result.session.csrfToken.length).toBe(64);
    expect(prisma.otpCode.update).toHaveBeenCalledTimes(2);
    expect(prisma.user.upsert).toHaveBeenCalledTimes(1);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
  });

  it("rejects expired code", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() => Promise.resolve(null)),
      },
    });

    await expect(
      verifyOtp({ email: "test@example.com", code: "123456", prisma }),
    ).rejects.toThrow(expect.objectContaining({ code: "OTP_EXPIRED" }));
  });

  it("rejects wrong code and increments attempts", async () => {
    const correctCode = "123456";
    const wrongCode = "654321";
    const codeHash = await hashOtp(correctCode);
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

    await expect(
      verifyOtp({ email: "test@example.com", code: wrongCode, prisma }),
    ).rejects.toThrow(expect.objectContaining({ code: "OTP_INVALID" }));

    expect(prisma.otpCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ attempts: { increment: 1 } }),
      }),
    );
  });

  it("rejects 6th attempt even with correct code", async () => {
    const code = "123456";
    const codeHash = await hashOtp(code);
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-1",
            email: "test@example.com",
            codeHash,
            attempts: 5,
            expiresAt: new Date(Date.now() + 600_000),
            consumedAt: null,
          }),
        ),
      },
    });

    await expect(
      verifyOtp({ email: "test@example.com", code, prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "OTP_MAX_ATTEMPTS" }),
    );

    expect(prisma.otpCode.update).not.toHaveBeenCalled();
  });

  it("rejects consumed code", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() => Promise.resolve(null)),
      },
    });

    await expect(
      verifyOtp({ email: "test@example.com", code: "123456", prisma }),
    ).rejects.toThrow(expect.objectContaining({ code: "OTP_EXPIRED" }));
  });

  it("returns existing user if already created", async () => {
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
      user: {
        upsert: mock(() =>
          Promise.resolve({ id: "existing-user", email: "test@example.com" }),
        ),
      },
    });

    const result = await verifyOtp({
      email: "test@example.com",
      code,
      prisma,
    });

    expect(result.user.id).toBe("existing-user");
  });
});
