import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import {
  addVariantToCollection,
  removeVariantFromCollection,
  listCollectionVariants,
} from "../services/membership.service.js";
import {
  collectionMembershipParamSchema,
  paginationQuerySchema,
} from "../schemas/index.js";
import { CatalogError } from "../types/catalog-errors.js";

export function createMembershipController(prisma: PrismaClient) {
  return {
    async addHandler(req: Request, res: Response): Promise<void> {
      const parsed = collectionMembershipParamSchema.safeParse(req.params);
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
        const membership = await addVariantToCollection({
          collectionId: parsed.data.collectionId,
          variantId: parsed.data.variantId,
          prisma,
        });
        res.status(201).json({ success: true, data: membership });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[addVariantToCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async removeHandler(req: Request, res: Response): Promise<void> {
      const parsed = collectionMembershipParamSchema.safeParse(req.params);
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
        await removeVariantFromCollection({
          collectionId: parsed.data.collectionId,
          variantId: parsed.data.variantId,
          prisma,
        });
        res.status(200).json({ success: true, data: { message: "Variant removed from collection" } });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[removeVariantFromCollection]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async listVariantsHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = collectionMembershipParamSchema.pick({ collectionId: true }).safeParse(req.params);
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
        const result = await listCollectionVariants({
          collectionId: paramsParsed.data.collectionId,
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
        console.error("[listCollectionVariants]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}
