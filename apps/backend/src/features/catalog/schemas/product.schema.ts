import { z } from "zod";
import { slugSchema, slugOptionalSchema } from "./common.schema.js";

export const productStatusSchema = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export type ProductStatusValue = z.infer<typeof productStatusSchema>;

export const productCreateBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
  slug: slugSchema,
  categoryId: z.string().min(1, "Category ID is required"),
  // Omitted on create → DRAFT (service applies the default).
  status: productStatusSchema.optional(),
});

export const productUpdateBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
  slug: slugOptionalSchema,
  categoryId: z.string().min(1, "Category ID is required").optional(),
  status: productStatusSchema.optional(),
});

export type ProductCreateBody = z.infer<typeof productCreateBodySchema>;
export type ProductUpdateBody = z.infer<typeof productUpdateBodySchema>;
