import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import {
  createVariant,
  listVariants,
  getVariant,
  updateVariant,
  deleteVariant,
} from "../services/variant.service.js";
import {
  variantCreateBodySchema,
  variantUpdateBodySchema,
  productIdParamSchema,
  variantIdParamSchema,
  paginationQuerySchema,
} from "../schemas/index.js";
import { CatalogError } from "../types/catalog-errors.js";

export function createVariantController(prisma: PrismaClient) {
  return {
    async createHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = productIdParamSchema.safeParse(req.params);
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

      const bodyParsed = variantCreateBodySchema.safeParse(req.body);
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
        const variant = await createVariant({
          productId: paramsParsed.data.productId,
          ...bodyParsed.data,
          prisma,
        });
        res.status(201).json({ success: true, data: variant });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[createVariant]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async listHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = productIdParamSchema.safeParse(req.params);
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

      const queryParsed = paginationQuerySchema.safeParse(req.query);
      if (!queryParsed.success) {
        res.status(422).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: queryParsed.error.issues[0]?.message ?? "Invalid input",
          },
        });
        return;
      }

      try {
        const result = await listVariants({
          productId: paramsParsed.data.productId,
          ...queryParsed.data,
          prisma,
        });
        res.status(200).json({ success: true, data: result });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[listVariants]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async getHandler(req: Request, res: Response): Promise<void> {
      const parsed = productIdParamSchema.extend(variantIdParamSchema.shape).safeParse(req.params);
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
        const variant = await getVariant({
          productId: parsed.data.productId,
          variantId: parsed.data.variantId,
          prisma,
        });
        res.status(200).json({ success: true, data: variant });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[getVariant]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async updateHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = productIdParamSchema.extend(variantIdParamSchema.shape).safeParse(req.params);
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

      const bodyParsed = variantUpdateBodySchema.safeParse(req.body);
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
        const variant = await updateVariant({
          productId: paramsParsed.data.productId,
          variantId: paramsParsed.data.variantId,
          ...bodyParsed.data,
          prisma,
        });
        res.status(200).json({ success: true, data: variant });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[updateVariant]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async deleteHandler(req: Request, res: Response): Promise<void> {
      const parsed = productIdParamSchema.extend(variantIdParamSchema.shape).safeParse(req.params);
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
        await deleteVariant({
          productId: parsed.data.productId,
          variantId: parsed.data.variantId,
          prisma,
        });
        res.status(200).json({ success: true, data: { message: "Variant deleted" } });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[deleteVariant]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}
