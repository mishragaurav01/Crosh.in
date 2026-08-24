import { z } from "zod";

export const addItemBodySchema = z.object({
  variantId: z.string().min(1, "Variant ID is required"),
  quantity: z
    .number()
    .int("Quantity must be a whole number")
    .positive("Quantity must be at least 1")
    .default(1),
});

export const updateItemBodySchema = z.object({
  // Absolute set. quantity: 0 is an implicit remove, not a rejection.
  quantity: z.number().int("Quantity must be a whole number").min(0, "Quantity cannot be negative"),
});

export const cartItemIdParamSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
});

export type AddItemBody = z.infer<typeof addItemBodySchema>;
export type UpdateItemBody = z.infer<typeof updateItemBodySchema>;
