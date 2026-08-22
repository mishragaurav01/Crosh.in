import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createVariantController } from "../controllers/variant.controller.js";
import { requireSession } from "../../identity/middleware/session.middleware.js";
import { requireAdmin } from "../../identity/middleware/admin.middleware.js";

export function createVariantRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createVariantController(prisma);

  router.use(requireSession(prisma));
  router.use(requireAdmin(prisma));

  router.post("/:productId/variants", (req, res) => controller.createHandler(req, res));
  router.get("/:productId/variants", (req, res) => controller.listHandler(req, res));
  router.get("/:productId/variants/:variantId", (req, res) => controller.getHandler(req, res));
  router.patch("/:productId/variants/:variantId", (req, res) => controller.updateHandler(req, res));
  router.delete("/:productId/variants/:variantId", (req, res) => controller.deleteHandler(req, res));

  return router;
}
