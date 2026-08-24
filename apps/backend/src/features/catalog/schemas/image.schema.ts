import { z } from "zod";

export const IMAGE_OWNER_TYPES = ["product", "variant", "collection", "category"] as const;

export type ImageOwnerType = (typeof IMAGE_OWNER_TYPES)[number];

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

const ownerIdSchema = z
  .string()
  .min(1, "Owner ID is required")
  .max(64, "Owner ID is invalid")
  .regex(/^[A-Za-z0-9_-]+$/, "Owner ID is invalid");

export const imageOwnerSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("product"), id: ownerIdSchema }),
  z.object({ type: z.literal("variant"), id: ownerIdSchema }),
  z.object({ type: z.literal("collection"), id: ownerIdSchema }),
  z.object({ type: z.literal("category"), id: ownerIdSchema }),
]);

export type ImageOwnerRef = z.infer<typeof imageOwnerSchema>;

export const imageMimeTypeSchema = z.enum(["image/jpeg", "image/png", "image/webp"], {
  error: "Only JPEG, PNG, and WebP images are supported",
});

export type ImageMimeType = z.infer<typeof imageMimeTypeSchema>;

const altTextSchema = z
  .string()
  .max(1000, "Alt text must be 1000 characters or fewer")
  .nullable();

export const imageUploadUrlBodySchema = z.object({
  filename: z
    .string()
    .min(1, "Filename is required")
    .max(255, "Filename must be 255 characters or fewer"),
  contentType: imageMimeTypeSchema,
  size: z
    .number({ error: "Size must be a number" })
    .int("Size must be a whole number")
    .positive("Size must be greater than zero")
    .max(MAX_IMAGE_BYTES, "Image must be 5 MB or smaller"),
  owner: imageOwnerSchema,
});

export const imageConfirmBodySchema = z.object({
  key: z
    .string()
    .min(1, "Object key is required")
    .max(1024, "Object key is invalid"),
  alt: altTextSchema.optional(),
  owner: imageOwnerSchema,
});

export const imageUpdateBodySchema = z.strictObject({
  alt: altTextSchema.optional(),
  sortOrder: z
    .number({ error: "Sort order must be a number" })
    .int("Sort order must be a whole number")
    .min(0, "Sort order must be zero or greater")
    .optional(),
});

export const imageIdParamSchema = z.object({
  id: z.string().min(1, "Image ID is required"),
});

export const imageOwnerParamsSchema = z.object({
  ownerType: z.enum(IMAGE_OWNER_TYPES, { error: "Unknown image owner type" }),
  ownerId: ownerIdSchema,
});
