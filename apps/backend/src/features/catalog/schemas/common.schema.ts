import { z } from "zod";

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const idParamSchema = z.object({
  id: z.string().min(1, "ID is required"),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
});

export const slugSchema = z
  .string()
  .min(1, "Slug is required")
  .max(120, "Slug must be 120 characters or fewer")
  .regex(SLUG_REGEX, "Slug must contain only lowercase letters, numbers, and hyphens");

export const slugOptionalSchema = slugSchema.optional();

export const positiveIntSchema = z
  .number()
  .int("Must be a whole number")
  .nonnegative("Must be zero or greater");

export const nonNegativeIntSchema = z
  .number()
  .int("Must be a whole number")
  .nonnegative("Must be zero or greater");

export const priceSchema = z
  .number()
  .int("Price must be a whole number (use cents)")
  .nonnegative("Price must be zero or greater");

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const categoryIdParamSchema = z.object({
  categoryId: z.string().min(1, "Category ID is required"),
});

export const productIdParamSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
});

export const variantIdParamSchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
});

export const collectionIdParamSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
});

export const collectionMembershipParamSchema = z.object({
  collectionId: z.string().min(1, "Collection ID is required"),
  productId: z.string().min(1, "Product ID is required"),
});

export const categoryFilterQuerySchema = z.object({
  categoryId: z.string().min(1).optional(),
});
