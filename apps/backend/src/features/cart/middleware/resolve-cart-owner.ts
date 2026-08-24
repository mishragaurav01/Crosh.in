import type { Request, Response, NextFunction } from "express";
import type { PrismaClient } from "db/client";
import { validateSession } from "../../identity/services/session.service.js";
import { mergeGuestCartOnLogin } from "../services/cart-ownership.service.js";
import { GUEST_TOKEN_COOKIE, clearGuestCookies } from "../utils/guest-cookie.js";

const SESSION_COOKIE = "session_id";

declare global {
  namespace Express {
    interface Request {
      guestToken?: string;
    }
  }
}

export function resolveCartOwner(prisma: PrismaClient) {
  return async function resolveCartOwnerMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    const cookieHeader = req.headers.cookie;
    const sessionId = cookieHeader
      ? parseCookie(cookieHeader, SESSION_COOKIE)
      : undefined;
    const guestToken = cookieHeader
      ? parseCookie(cookieHeader, GUEST_TOKEN_COOKIE)
      : undefined;

    if (sessionId) {
      try {
        const result = await validateSession({ sessionId, prisma });
        req.user = result.user;
        req.csrfToken = result.csrfToken;
      } catch {
        // Invalid or expired session — the cart is guest-accessible, so this
        // degrades to a guest request instead of rejecting.
      }
    }

    if (req.user && guestToken) {
      // Freshly-authenticated user with a leftover guest cookie: implicit
      // merge-on-login. Fires on every cart request including GET
      // (Clarifications #3), so a promoted cart shows up on first read.
      try {
        await mergeGuestCartOnLogin({ prisma, userId: req.user.id, guestToken });
      } catch (error) {
        // Merge failure must not wedge every cart request; the transaction
        // rolled back so both carts remain intact and the next request
        // retries. Proceed with the authenticated cart.
        console.error("[resolveCartOwner] guest cart merge failed", error);
      }
      clearGuestCookies(res);
    } else if (guestToken) {
      req.guestToken = guestToken;
    }

    next();
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
