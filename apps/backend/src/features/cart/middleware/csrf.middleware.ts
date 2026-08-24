import type { Request, Response, NextFunction } from "express";
import { GUEST_CSRF_COOKIE, GUEST_TOKEN_COOKIE } from "../utils/guest-cookie.js";

// Cart-local CSRF middleware (Clarifications #1): identity's requireCsrfToken
// always 403s guests because req.csrfToken is only set from a Session row.
// Authenticated requests here perform the exact same header-vs-session-token
// comparison; unauthenticated requests use classic double-submit against the
// readable cart_csrf cookie issued alongside guest_token.
//
// One carve-out keeps the mechanism bootable: a visitor carrying no cart
// cookies at all has no cart state worth forging, so their very first mutation
// passes through unprotected and the response carries the freshly issued
// cookies. Every other request — including guest_token without its matching
// cart_csrf — must present and match a token.
export function requireCartCsrf(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const cookieHeader = req.headers.cookie;
  const guestToken = cookieHeader
    ? parseCookie(cookieHeader, GUEST_TOKEN_COOKIE)
    : undefined;
  const csrfCookie = cookieHeader
    ? parseCookie(cookieHeader, GUEST_CSRF_COOKIE)
    : undefined;

  const hasSession = Boolean(req.user);

  // First contact: neither identity nor any guest state exists yet.
  if (!hasSession && !guestToken && !csrfCookie) {
    next();
    return;
  }

  const headerToken = req.headers["x-csrf-token"];
  if (!headerToken || typeof headerToken !== "string") {
    res.status(403).json({
      success: false,
      error: { code: "CSRF_FAILED", message: "Missing CSRF token" },
    });
    return;
  }

  if (hasSession) {
    if (!req.csrfToken || headerToken !== req.csrfToken) {
      res.status(403).json({
        success: false,
        error: { code: "CSRF_FAILED", message: "Invalid CSRF token" },
      });
      return;
    }
    next();
    return;
  }

  if (!csrfCookie) {
    res.status(403).json({
      success: false,
      error: { code: "CSRF_FAILED", message: "Missing CSRF cookie" },
    });
    return;
  }

  if (headerToken !== csrfCookie) {
    res.status(403).json({
      success: false,
      error: { code: "CSRF_FAILED", message: "Invalid CSRF token" },
    });
    return;
  }

  next();
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
