import { z } from "zod";
import { slugSchema, slugOptionalSchema } from "./common.schema.js";

export const categoryCreateBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer"),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
  slug: slugSchema,
});

export const categoryUpdateBodySchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name must be 255 characters or fewer").optional(),
  description: z.string().max(2000, "Description must be 2000 characters or fewer").nullable().optional(),
  slug: slugOptionalSchema,
});

export type CategoryCreateBody = z.infer<typeof categoryCreateBodySchema>;
export type CategoryUpdateBody = z.infer<typeof categoryUpdateBodySchema>;
