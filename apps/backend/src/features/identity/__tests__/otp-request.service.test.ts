import { describe, it, expect, mock, beforeEach } from "bun:test";
import { requestOtp } from "../services/otp-request.service.js";
import { OtpError } from "../types/otp-errors.js";
import { hashOtp } from "../utils/otp.util.js";

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
  } as any;
}

function createMockSendEmail() {
  return mock(() => Promise.resolve());
}

beforeEach(() => {
  // Reset Date.now for deterministic cooldown/rate-limit tests
});

describe("requestOtp", () => {
  it("creates OTP row and sends email on first request", async () => {
    const prisma = createMockPrisma();
    const sendEmail = createMockSendEmail();

    const result = await requestOtp({
      email: "test@example.com",
      prisma,
      sendEmail,
    });

    expect(result.message).toBe("OTP sent successfully");
    expect(result.expiresInSeconds).toBe(600);
    expect(prisma.otpCode.create).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: "test@example.com" }),
    );
  });

  it("rejects if cooldown not met", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-1",
            createdAt: new Date(Date.now() - 30_000),
          }),
        ),
      },
    });
    const sendEmail = createMockSendEmail();

    await expect(
      requestOtp({ email: "test@example.com", prisma, sendEmail }),
    ).rejects.toThrow(expect.objectContaining({ code: "OTP_RATE_LIMITED" }));

    expect(prisma.otpCode.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("rejects if hourly rate limit exceeded", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-old",
            createdAt: new Date(Date.now() - 120_000),
          }),
        ),
        count: mock(() => Promise.resolve(5)),
      },
    });
    const sendEmail = createMockSendEmail();

    await expect(
      requestOtp({ email: "test@example.com", prisma, sendEmail }),
    ).rejects.toThrow(expect.objectContaining({ code: "OTP_RATE_LIMITED" }));

    expect(prisma.otpCode.create).not.toHaveBeenCalled();
    expect(sendEmail).not.toHaveBeenCalled();
  });

  it("allows request after cooldown has passed", async () => {
    const prisma = createMockPrisma({
      otpCode: {
        findFirst: mock(() =>
          Promise.resolve({
            id: "otp-old",
            createdAt: new Date(Date.now() - 61_000),
          }),
        ),
        count: mock(() => Promise.resolve(2)),
      },
    });
    const sendEmail = createMockSendEmail();

    const result = await requestOtp({
      email: "test@example.com",
      prisma,
      sendEmail,
    });

    expect(result.message).toBe("OTP sent successfully");
    expect(prisma.otpCode.create).toHaveBeenCalledTimes(1);
  });
});
