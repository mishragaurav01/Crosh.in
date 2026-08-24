import { Router } from "express";
import type { PrismaClient } from "db/client";
import { createCartController } from "../controllers/cart.controller.js";
import { resolveCartOwner } from "../middleware/resolve-cart-owner.js";
import { requireCartCsrf } from "../middleware/csrf.middleware.js";

export function createCartRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createCartController(prisma);

  router.get("/", resolveCartOwner(prisma), (req, res) =>
    controller.getHandler(req, res),
  );

  router.post(
    "/items",
    resolveCartOwner(prisma),
    requireCartCsrf,
    (req, res) => controller.addItemHandler(req, res),
  );

  router.patch(
    "/items/:itemId",
    resolveCartOwner(prisma),
    requireCartCsrf,
    (req, res) => controller.updateItemHandler(req, res),
  );

  router.delete(
    "/items/:itemId",
    resolveCartOwner(prisma),
    requireCartCsrf,
    (req, res) => controller.removeItemHandler(req, res),
  );

  router.delete(
    "/",
    resolveCartOwner(prisma),
    requireCartCsrf,
    (req, res) => controller.clearHandler(req, res),
  );

  return router;
}
