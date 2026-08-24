import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createImageController } from "../controllers/image.controller.js";
import { requireSession } from "../../identity/middleware/session.middleware.js";
import { requireAdmin } from "../../identity/middleware/admin.middleware.js";

export function createImageRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createImageController(prisma);

  router.use(requireSession(prisma));
  router.use(requireAdmin(prisma));

  router.post("/upload-url", (req, res) => controller.createUploadUrlHandler(req, res));
  router.post("/", (req, res) => controller.confirmHandler(req, res));
  router.patch("/:id", (req, res) => controller.updateHandler(req, res));
  router.delete("/:id", (req, res) => controller.deleteHandler(req, res));
  router.get("/:ownerType/:ownerId", (req, res) => controller.listHandler(req, res));

  return router;
}
