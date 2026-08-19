import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createMembershipController } from "../controllers/membership.controller.js";
import { requireSession } from "../../identity/middleware/session.middleware.js";

export function createMembershipRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createMembershipController(prisma);

  router.use(requireSession(prisma));

  router.post("/:collectionId/products/:productId", (req, res) =>
    controller.addHandler(req, res),
  );
  router.delete("/:collectionId/products/:productId", (req, res) =>
    controller.removeHandler(req, res),
  );
  router.get("/:collectionId/products", (req, res) =>
    controller.listProductsHandler(req, res),
  );

  return router;
}
