import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createAuthController } from "../controllers/auth.controller.js";
import { requireSession } from "../middleware/session.middleware.js";
import { requireCsrfToken } from "../middleware/csrf.middleware.js";

export function createAuthRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createAuthController(prisma);

  router.post("/otp/request", (req, res) =>
    controller.requestOtpHandler(req, res),
  );

  router.post("/otp/verify", (req, res) =>
    controller.verifyOtpHandler(req, res),
  );

  router.get("/me", requireSession(prisma), (req, res) =>
    controller.meHandler(req, res),
  );

  router.post(
    "/logout",
    requireSession(prisma),
    requireCsrfToken,
    (req, res) => controller.logoutHandler(req, res),
  );

  return router;
}
