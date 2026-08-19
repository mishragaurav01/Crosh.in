import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import {
  createCollection,
  listCollections,
  getCollection,
  updateCollection,
  deleteCollection,
} from "../services/collection.service.js";
import {
  collectionCreateBodySchema,
  collectionUpdateBodySchema,
  idParamSchema,
  paginationQuerySchema,
} from "../schemas/index.js";
import { CatalogError } from "../types/catalog-errors.js";

export function createCollectionController(prisma: PrismaClient) {
  return {
    async createHandler(req: Request, res: Response): Promise<void> {
      const parsed = collectionCreateBodySchema.safeParse(req.body);
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
        const collection = await createCollection({ ...parsed.data, prisma });
        res.status(201).json({ success: true, data: collection });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[createCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

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
        const result = await listCollections({ ...parsed.data, prisma });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        console.error("[listCollections]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async getHandler(req: Request, res: Response): Promise<void> {
      const parsed = idParamSchema.safeParse(req.params);
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
        const collection = await getCollection({ id: parsed.data.id, prisma });
        res.status(200).json({ success: true, data: collection });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[getCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async updateHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = idParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: paramsParsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      const bodyParsed = collectionUpdateBodySchema.safeParse(req.body);
      if (!bodyParsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: bodyParsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const collection = await updateCollection({
          id: paramsParsed.data.id,
          ...bodyParsed.data,
          prisma,
        });
        res.status(200).json({ success: true, data: collection });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[updateCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async deleteHandler(req: Request, res: Response): Promise<void> {
      const parsed = idParamSchema.safeParse(req.params);
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
        await deleteCollection({ id: parsed.data.id, prisma });
        res.status(200).json({ success: true, data: { message: "Collection deleted" } });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[deleteCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}
