import { z } from "zod";
import { slugSchema, slugOptionalSchema } from "./common.schema.js";

export const productCreateBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
  slug: slugSchema,
  categoryId: z.string().min(1, "Category ID is required"),
});

export const productUpdateBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
  slug: slugOptionalSchema,
  categoryId: z.string().min(1, "Category ID is required").optional(),
});

export type ProductCreateBody = z.infer<typeof productCreateBodySchema>;
export type ProductUpdateBody = z.infer<typeof productUpdateBodySchema>;
