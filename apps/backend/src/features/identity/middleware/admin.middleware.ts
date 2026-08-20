import type { Request, Response, NextFunction } from "express";
import type { PrismaClient } from "db/client";

export function requireAdmin(prisma: PrismaClient) {
  return async function adminMiddleware(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: "UNAUTHENTICATED", message: "Missing session" },
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { isAdmin: true },
    });

    if (!user || !user.isAdmin) {
      res.status(403).json({
        success: false,
        error: { code: "FORBIDDEN", message: "Administrative access required" },
      });
      return;
    }

    next();
  };
}
