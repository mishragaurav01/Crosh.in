import type { Request, Response } from "express";
import type { PrismaClient } from "db/client";
import { CatalogError } from "../../catalog/types/catalog-errors.js";
import { CartError } from "../types/cart-errors.js";
import { setGuestCookies } from "../utils/guest-cookie.js";
import {
  getCart,
  addCartItem,
  updateCartItem,
  removeCartItem,
  clearCartItems,
  type CartOwner,
} from "../services/cart.service.js";
import {
  addItemBodySchema,
  updateItemBodySchema,
  cartItemIdParamSchema,
} from "../schemas/cart.schema.js";

function ownerFromRequest(req: Request): CartOwner {
  return { userId: req.user?.id, guestToken: req.guestToken };
}

// CartError and CatalogError share the envelope shape; VARIANT_NOT_FOUND is
// catalog-owned and reused here rather than duplicated.
function sendFeatureError(res: Response, error: unknown): void {
  if (error instanceof CartError || error instanceof CatalogError) {
    res.status(error.statusCode).json({
      success: false,
      error: { code: error.code, message: error.message },
    });
    return;
  }
  console.error("[cart]", error);
  res.status(500).json({
    success: false,
    error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" },
  });
}

function sendValidationError(
  res: Response,
  issueMessage: string | undefined,
): void {
  res.status(422).json({
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: issueMessage ?? "Invalid input",
    },
  });
}

export function createCartController(prisma: PrismaClient) {
  return {
    async getHandler(req: Request, res: Response): Promise<void> {
      try {
        const cart = await getCart({ prisma, owner: ownerFromRequest(req) });
        res.status(200).json({ success: true, data: cart });
      } catch (error) {
        sendFeatureError(res, error);
      }
    },

    async addItemHandler(req: Request, res: Response): Promise<void> {
      const parsed = addItemBodySchema.safeParse(req.body);
      if (!parsed.success) {
        sendValidationError(res, parsed.error.issues[0]?.message);
        return;
      }

      try {
        const result = await addCartItem({
          prisma,
          owner: ownerFromRequest(req),
          variantId: parsed.data.variantId,
          quantity: parsed.data.quantity,
        });

        // First mutation of an anonymous visitor: issue guest cookies lazily.
        if (result.newGuestToken) {
          setGuestCookies(res, result.newGuestToken);
        }

        res.status(200).json({ success: true, data: result.cart });
      } catch (error) {
        sendFeatureError(res, error);
      }
    },

    async updateItemHandler(req: Request, res: Response): Promise<void> {
      const paramsParsed = cartItemIdParamSchema.safeParse(req.params);
      if (!paramsParsed.success) {
        sendValidationError(res, paramsParsed.error.issues[0]?.message);
        return;
      }

      const bodyParsed = updateItemBodySchema.safeParse(req.body);
      if (!bodyParsed.success) {
        sendValidationError(res, bodyParsed.error.issues[0]?.message);
        return;
      }

      try {
        const cart = await updateCartItem({
          prisma,
          owner: ownerFromRequest(req),
          itemId: paramsParsed.data.itemId,
          quantity: bodyParsed.data.quantity,
        });
        res.status(200).json({ success: true, data: cart });
      } catch (error) {
        sendFeatureError(res, error);
      }
    },

    async removeItemHandler(req: Request, res: Response): Promise<void> {
      const parsed = cartItemIdParamSchema.safeParse(req.params);
      if (!parsed.success) {
        sendValidationError(res, parsed.error.issues[0]?.message);
        return;
      }

      try {
        const cart = await removeCartItem({
          prisma,
          owner: ownerFromRequest(req),
          itemId: parsed.data.itemId,
        });
        res.status(200).json({ success: true, data: cart });
      } catch (error) {
        sendFeatureError(res, error);
      }
    },

    async clearHandler(req: Request, res: Response): Promise<void> {
      try {
        const cart = await clearCartItems({
          prisma,
          owner: ownerFromRequest(req),
        });
        res.status(200).json({ success: true, data: cart });
      } catch (error) {
        sendFeatureError(res, error);
      }
    },
  };
}
