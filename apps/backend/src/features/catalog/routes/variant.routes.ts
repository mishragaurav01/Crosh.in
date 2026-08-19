import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createVariantController } from "../controllers/variant.controller.js";
import { requireSession } from "../../identity/middleware/session.middleware.js";

export function createVariantRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createVariantController(prisma);

  router.use(requireSession(prisma));

  router.post("/", (req, res) => controller.createHandler(req, res));
  router.get("/", (req, res) => controller.listHandler(req, res));
  router.get("/:variantId", (req, res) => controller.getHandler(req, res));
  router.patch("/:variantId", (req, res) => controller.updateHandler(req, res));
  router.delete("/:variantId", (req, res) => controller.deleteHandler(req, res));

  return router;
}
