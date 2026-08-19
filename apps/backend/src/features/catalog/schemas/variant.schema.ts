import { z } from "zod";
import { priceSchema, nonNegativeIntSchema } from "./common.schema.js";

export const variantCreateBodySchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100, "SKU must be 100 characters or fewer"),
  size: z.string().min(1, "Size is required").max(50, "Size must be 50 characters or fewer"),
  color: z.string().min(1, "Color is required").max(50, "Color must be 50 characters or fewer"),
  price: priceSchema,
  stock: nonNegativeIntSchema.default(0),
});

export const variantUpdateBodySchema = z.object({
  sku: z.string().min(1, "SKU is required").max(100, "SKU must be 100 characters or fewer").optional(),
  size: z.string().min(1, "Size is required").max(50, "Size must be 50 characters or fewer").optional(),
  color: z.string().min(1, "Color is required").max(50, "Color must be 50 characters or fewer").optional(),
  price: priceSchema.optional(),
  stock: nonNegativeIntSchema.optional(),
});

export type VariantCreateBody = z.infer<typeof variantCreateBodySchema>;
export type VariantUpdateBody = z.infer<typeof variantUpdateBodySchema>;
