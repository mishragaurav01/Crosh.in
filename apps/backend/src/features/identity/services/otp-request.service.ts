import type { PrismaClient } from "db/client";
import { generateOtp, hashOtp } from "../utils/otp.util.js";
import { OtpError } from "../types/otp-errors.js";

const COOLDOWN_MS = 60 * 1000;
const RATE_LIMIT_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;
const OTP_EXPIRY_MS = 10 * 60 * 1000;

export async function requestOtp(params: {
  email: string;
  prisma: PrismaClient;
  sendEmail: (params: { to: string; code: string }) => Promise<void>;
}): Promise<{ message: string; expiresInSeconds: number }> {
  const { email, prisma, sendEmail } = params;
  const now = new Date();

  const mostRecent = await prisma.otpCode.findFirst({
    where: { email },
    orderBy: { createdAt: "desc" },
  });

  if (mostRecent) {
    const timeSinceLast = now.getTime() - mostRecent.createdAt.getTime();
    if (timeSinceLast < COOLDOWN_MS) {
      throw new OtpError(
        "OTP_RATE_LIMITED",
        "Please wait before requesting another code",
      );
    }
  }

  const oneHourAgo = new Date(now.getTime() - RATE_LIMIT_MS);
  const recentCount = await prisma.otpCode.count({
    where: {
      email,
      createdAt: { gte: oneHourAgo },
    },
  });

  if (recentCount >= RATE_LIMIT_MAX) {
    throw new OtpError(
      "OTP_RATE_LIMITED",
      "Too many requests. Please try again later.",
    );
  }

  const code = generateOtp();
  const codeHash = await hashOtp(code);

  await prisma.otpCode.create({
    data: {
      email,
      codeHash,
      expiresAt: new Date(now.getTime() + OTP_EXPIRY_MS),
    },
  });

  await sendEmail({ to: email, code });

  return {
    message: "OTP sent successfully",
    expiresInSeconds: OTP_EXPIRY_MS / 1000,
  };
}
