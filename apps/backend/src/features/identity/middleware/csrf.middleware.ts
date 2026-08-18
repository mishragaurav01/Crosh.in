import type { Request, Response, NextFunction } from "express";

export function requireCsrfToken(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const headerToken = req.headers["x-csrf-token"];
  if (!headerToken || typeof headerToken !== "string") {
    res.status(403).json({
      success: false,
      error: { code: "CSRF_FAILED", message: "Missing CSRF token" },
    });
    return;
  }

  if (!req.csrfToken) {
    res.status(403).json({
      success: false,
      error: { code: "CSRF_FAILED", message: "Missing session" },
    });
    return;
  }

  if (headerToken !== req.csrfToken) {
    res.status(403).json({
      success: false,
      error: { code: "CSRF_FAILED", message: "Invalid CSRF token" },
    });
    return;
  }

  next();
}
