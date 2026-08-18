import { randomBytes } from "node:crypto";
import type { PrismaClient } from "db/client";
import { OtpError } from "../types/otp-errors.js";

const SESSION_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000;

function generateCsrfToken(): string {
  return randomBytes(32).toString("hex");
}

export async function createSession(params: {
  userId: string;
  prisma: PrismaClient;
}): Promise<{ sessionId: string; csrfToken: string; expiresAt: Date }> {
  const { userId, prisma } = params;
  const expiresAt = new Date(Date.now() + SESSION_EXPIRY_MS);
  const csrfToken = generateCsrfToken();

  const session = await prisma.session.create({
    data: {
      userId,
      csrfToken,
      expiresAt,
    },
  });

  return { sessionId: session.id, csrfToken, expiresAt };
}

export async function validateSession(params: {
  sessionId: string;
  prisma: PrismaClient;
}): Promise<{ user: { id: string; email: string }; csrfToken: string }> {
  const { sessionId, prisma } = params;

  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { user: { select: { id: true, email: true } } },
  });

  if (!session) {
    throw new OtpError("UNAUTHENTICATED", "Invalid or missing session");
  }

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: sessionId } });
    throw new OtpError("UNAUTHENTICATED", "Session expired");
  }

  return { user: session.user, csrfToken: session.csrfToken };
}

export async function deleteSession(params: {
  sessionId: string;
  prisma: PrismaClient;
}): Promise<void> {
  const { sessionId, prisma } = params;

  await prisma.session.deleteMany({ where: { id: sessionId } });
}
