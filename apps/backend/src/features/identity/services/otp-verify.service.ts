import type { PrismaClient } from "db/client";
import { hashOtp } from "../utils/otp.util.js";
import { OtpError } from "../types/otp-errors.js";
import { createSession } from "./session.service.js";

const MAX_ATTEMPTS = 5;

export async function verifyOtp(params: {
  email: string;
  code: string;
  prisma: PrismaClient;
}): Promise<{
  user: { id: string; email: string; isAdmin: boolean };
  session: { sessionId: string; csrfToken: string; expiresAt: Date };
}> {
  const { email, code, prisma } = params;
  const now = new Date();

  const otpRecord = await prisma.otpCode.findFirst({
    where: {
      email,
      consumedAt: null,
      expiresAt: { gt: now },
    },
    orderBy: { createdAt: "desc" },
  });

  if (!otpRecord) {
    const anyActive = await prisma.otpCode.findFirst({
      where: { email, consumedAt: null },
      orderBy: { createdAt: "desc" },
    });

    if (anyActive && anyActive.expiresAt <= now) {
      throw new OtpError("OTP_EXPIRED", "Verification code has expired");
    }

    throw new OtpError("OTP_EXPIRED", "No active verification code found");
  }

  if (otpRecord.attempts >= MAX_ATTEMPTS) {
    throw new OtpError(
      "OTP_MAX_ATTEMPTS",
      "Too many attempts. Please request a new code.",
    );
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { attempts: { increment: 1 } },
  });

  const providedHash = await hashOtp(code);
  if (providedHash !== otpRecord.codeHash) {
    throw new OtpError("OTP_INVALID", "Invalid verification code");
  }

  await prisma.otpCode.update({
    where: { id: otpRecord.id },
    data: { consumedAt: now },
  });

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      emailVerifiedAt: now,
    },
    update: {},
  });

  const session = await createSession({ userId: user.id, prisma });

  return {
    user: { id: user.id, email: user.email, isAdmin: user.isAdmin },
    session,
  };
}
