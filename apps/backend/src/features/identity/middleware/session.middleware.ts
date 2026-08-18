import type { Request, Response, NextFunction } from "express";
import type { PrismaClient } from "db/client";
import { validateSession } from "../services/session.service.js";

const SESSION_COOKIE = "session_id";

export interface SessionUser {
  id: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: SessionUser;
      csrfToken?: string;
    }
  }
}

export function requireSession(prisma: PrismaClient) {
  return async function sessionMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Missing session" },
      });
      return;
    }

    const sessionId = parseCookie(cookieHeader, SESSION_COOKIE);
    if (!sessionId) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Missing session" },
      });
      return;
    }

    try {
      const result = await validateSession({ sessionId, prisma });
      req.user = result.user;
      req.csrfToken = result.csrfToken;
      next();
    } catch {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Invalid session" },
      });
    }
  };
}

function parseCookie(header: string, name: string): string | undefined {
  const cookies = header.split(";");
  for (const cookie of cookies) {
    const parts = cookie.split("=");
    const key = parts[0];
    if (key && key.trim() === name) {
      return parts.slice(1).join("=").trim();
    }
  }
  return undefined;
}
