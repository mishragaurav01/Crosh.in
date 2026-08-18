import { describe, it, expect, mock } from "bun:test";
import { createSession, validateSession } from "../services/session.service.js";
import { OtpError } from "../types/otp-errors.js";

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
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
      ...((overrides.session as object) ?? {}),
    },
  } as any;
}

describe("createSession", () => {
  it("creates a session and returns sessionId + csrfToken + expiresAt", async () => {
    const prisma = createMockPrisma();

    const result = await createSession({ userId: "user-1", prisma });

    expect(result.sessionId).toBe("session-1");
    expect(result.csrfToken).toEqual(expect.any(String));
    expect(result.csrfToken.length).toBe(64);
    expect(result.expiresAt).toBeInstanceOf(Date);
    expect(prisma.session.create).toHaveBeenCalledTimes(1);
    expect(prisma.session.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: "user-1" }),
      }),
    );
  });

  it("sets expiry 7 days in the future", async () => {
    const prisma = createMockPrisma();
    const before = Date.now();

    await createSession({ userId: "user-1", prisma });

    const createCall = prisma.session.create.mock.calls[0] as any;
    const expiresAt = createCall[0].data.expiresAt as Date;
    const expectedMin = new Date(before + 7 * 24 * 60 * 60 * 1000 - 1000);
    const expectedMax = new Date(before + 7 * 24 * 60 * 60 * 1000 + 1000);

    expect(expiresAt.getTime()).toBeGreaterThanOrEqual(expectedMin.getTime());
    expect(expiresAt.getTime()).toBeLessThanOrEqual(expectedMax.getTime());
  });
});

describe("validateSession", () => {
  it("returns user and csrfToken for valid, non-expired session", async () => {
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

    const result = await validateSession({
      sessionId: "session-1",
      prisma,
    });

    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("test@example.com");
    expect(result.csrfToken).toBe("csrf-token-1");
  });

  it("throws UNAUTHENTICATED for non-existent session", async () => {
    const prisma = createMockPrisma();

    await expect(
      validateSession({ sessionId: "nonexistent", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHENTICATED" }),
    );
  });

  it("throws UNAUTHENTICATED and deletes expired session", async () => {
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

    await expect(
      validateSession({ sessionId: "session-1", prisma }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "UNAUTHENTICATED" }),
    );

    expect(prisma.session.delete).toHaveBeenCalledWith({
      where: { id: "session-1" },
    });
  });
});
