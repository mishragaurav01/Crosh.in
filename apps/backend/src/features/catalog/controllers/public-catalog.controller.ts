import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import {
  listPublicCategories,
  listPublicProducts,
  getPublicProduct,
  listPublicCollections,
  getPublicCollection,
} from "../services/public-catalog.service.js";
import {
  paginationQuerySchema,
  publicProductListQuerySchema,
  slugParamSchema,
} from "../schemas/index.js";
import { CatalogError } from "../types/catalog-errors.js";

export function createPublicCategoryController(prisma: PrismaClient) {
  return {
    async listHandler(req: Request, res: Response): Promise<void> {
      const parsed = paginationQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const result = await listPublicCategories({ ...parsed.data, prisma });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        console.error("[listPublicCategories]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}

export function createPublicProductController(prisma: PrismaClient) {
  return {
    async listHandler(req: Request, res: Response): Promise<void> {
      const parsed = publicProductListQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const result = await listPublicProducts({ ...parsed.data, prisma });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[listPublicProducts]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async getHandler(req: Request, res: Response): Promise<void> {
      const parsed = slugParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const product = await getPublicProduct({ slug: parsed.data.slug, prisma });
        res.status(200).json({ success: true, data: product });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[getPublicProduct]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}

export function createPublicCollectionController(prisma: PrismaClient) {
  return {
    async listHandler(req: Request, res: Response): Promise<void> {
      const parsed = paginationQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const result = await listPublicCollections({ ...parsed.data, prisma });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        console.error("[listPublicCollections]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async getHandler(req: Request, res: Response): Promise<void> {
      const parsed = slugParamSchema.safeParse(req.params);
      if (!parsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: parsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const collection = await getPublicCollection({ slug: parsed.data.slug, prisma });
        res.status(200).json({ success: true, data: collection });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[getPublicCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}
