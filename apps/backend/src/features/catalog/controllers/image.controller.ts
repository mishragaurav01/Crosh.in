import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import {
  createUploadUrl,
  confirmUpload,
  updateImage,
  deleteImage,
  listImagesByOwner,
} from "../services/image.service.js";
import {
  imageUploadUrlBodySchema,
  imageConfirmBodySchema,
  imageUpdateBodySchema,
  imageIdParamSchema,
  imageOwnerParamsSchema,
} from "../schemas/index.js";
import { CatalogError } from "../types/catalog-errors.js";

export function createImageController(prisma: PrismaClient) {
  return {
    async createUploadUrlHandler(req: Request, res: Response): Promise<void> {
      const bodyParsed = imageUploadUrlBodySchema.safeParse(req.body);
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
        const result = await createUploadUrl({
          contentType: bodyParsed.data.contentType,
          owner: bodyParsed.data.owner,
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
        console.error("[createUploadUrl]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async confirmHandler(req: Request, res: Response): Promise<void> {
      const bodyParsed = imageConfirmBodySchema.safeParse(req.body);
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
        const image = await confirmUpload({
          key: bodyParsed.data.key,
          alt: bodyParsed.data.alt,
          owner: bodyParsed.data.owner,
          prisma,
        });
        res.status(201).json({ success: true, data: image });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[confirmUpload]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async updateHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = imageIdParamSchema.safeParse(req.params);
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

      const bodyParsed = imageUpdateBodySchema.safeParse(req.body);
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
        const image = await updateImage({
          id: paramsParsed.data.id,
          alt: bodyParsed.data.alt,
          sortOrder: bodyParsed.data.sortOrder,
          prisma,
        });
        res.status(200).json({ success: true, data: image });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[updateImage]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async deleteHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = imageIdParamSchema.safeParse(req.params);
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

      try {
        await deleteImage({ id: paramsParsed.data.id, prisma });
        res.status(200).json({ success: true, data: { message: "Image deleted" } });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[deleteImage]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },

    async listHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = imageOwnerParamsSchema.safeParse(req.params);
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

      try {
        const images = await listImagesByOwner({
          ownerType: paramsParsed.data.ownerType,
          ownerId: paramsParsed.data.ownerId,
          prisma,
        });
        res.status(200).json({ success: true, data: images });
      } catch (error) {
        if (error instanceof CatalogError) {
          res.status(error.statusCode).json({
            success: false,
            error: { code: error.code, message: error.message },
          });
          return;
        }
        console.error("[listImagesByOwner]", error);
        res.status(500).json({
          success: false,
          error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
        });
      }
    },
  };
}
