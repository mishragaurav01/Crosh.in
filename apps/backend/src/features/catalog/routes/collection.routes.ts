import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createCollectionController } from "../controllers/collection.controller.js";
import { requireSession } from "../../identity/middleware/session.middleware.js";
import { requireAdmin } from "../../identity/middleware/admin.middleware.js";

export function createCollectionRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createCollectionController(prisma);

  router.use(requireSession(prisma));
  router.use(requireAdmin(prisma));

  router.post("/", (req, res) => controller.createHandler(req, res));
  router.get("/", (req, res) => controller.listHandler(req, res));
  router.get("/:id", (req, res) => controller.getHandler(req, res));
  router.patch("/:id", (req, res) => controller.updateHandler(req, res));
  router.delete("/:id", (req, res) => controller.deleteHandler(req, res));

  return router;
}
