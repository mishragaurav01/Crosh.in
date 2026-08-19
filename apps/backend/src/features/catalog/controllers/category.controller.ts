import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
} from "../services/category.service.js";
import {
  categoryCreateBodySchema,
  categoryUpdateBodySchema,
  idParamSchema,
  paginationQuerySchema,
} from "../schemas/index.js";
import { CatalogError } from "../types/catalog-errors.js";

export function createCategoryController(prisma: PrismaClient) {
  return {
    async createHandler(req: Request, res: Response): Promise<void> {
      const parsed = categoryCreateBodySchema.safeParse(req.body);
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
        const category = await createCategory({
          ...parsed.data,
          prisma,
        });
        res.status(201).json({ success: true, data: category });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[createCategory]", error);
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
        const result = await listCategories({ ...parsed.data, prisma });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        console.error("[listCategories]", error);
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
        const category = await getCategory({ id: parsed.data.id, prisma });
        res.status(200).json({ success: true, data: category });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[getCategory]", error);
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

      const bodyParsed = categoryUpdateBodySchema.safeParse(req.body);
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
        const category = await updateCategory({
          id: paramsParsed.data.id,
          ...bodyParsed.data,
          prisma,
        });
        res.status(200).json({ success: true, data: category });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[updateCategory]", error);
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
        await deleteCategory({ id: parsed.data.id, prisma });
        res.status(200).json({ success: true, data: { message: "Category deleted" } });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[deleteCategory]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}
