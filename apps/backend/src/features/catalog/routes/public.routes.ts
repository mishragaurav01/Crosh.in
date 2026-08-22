import { Router } from "express";
import type { PrismaClient } from "db/client";
import {
  createPublicCategoryController,
  createPublicProductController,
  createPublicCollectionController,
} from "../controllers/public-catalog.controller.js";

export function createPublicCategoryRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createPublicCategoryController(prisma);

  router.get("/", (req, res) => controller.listHandler(req, res));

  return router;
}

export function createPublicProductRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createPublicProductController(prisma);

  router.get("/", (req, res) => controller.listHandler(req, res));
  router.get("/:slug", (req, res) => controller.getHandler(req, res));

  return router;
}

export function createPublicCollectionRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const controller = createPublicCollectionController(prisma);

  router.get("/", (req, res) => controller.listHandler(req, res));
  router.get("/:slug", (req, res) => controller.getHandler(req, res));

  return router;
}
