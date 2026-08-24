import type { Response } from "express";

export const GUEST_TOKEN_COOKIE = "guest_token";
export const GUEST_CSRF_COOKIE = "cart_csrf";

// Same cookie rigor as identity's session cookie. `secure` follows the same
// NODE_ENV pattern as auth.controller so the cookie actually round-trips on
// local http during development.
const GUEST_COOKIE_BASE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export const GUEST_TOKEN_COOKIE_OPTIONS = { ...GUEST_COOKIE_BASE_OPTIONS };

// Readable by JS so the SPA can echo it back as X-CSRF-Token (double-submit).
export const GUEST_CSRF_COOKIE_OPTIONS = {
  ...GUEST_COOKIE_BASE_OPTIONS,
  httpOnly: false,
};

export function setGuestCookies(res: Response, guestToken: string): void {
  res.cookie(GUEST_TOKEN_COOKIE, guestToken, GUEST_TOKEN_COOKIE_OPTIONS);
  res.cookie(GUEST_CSRF_COOKIE, guestToken, GUEST_CSRF_COOKIE_OPTIONS);
}

export function clearGuestCookies(res: Response): void {
  res.clearCookie(GUEST_TOKEN_COOKIE, GUEST_TOKEN_COOKIE_OPTIONS);
  res.clearCookie(GUEST_CSRF_COOKIE, GUEST_CSRF_COOKIE_OPTIONS);
}
