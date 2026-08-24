import { z } from "zod";

const mediaConfigSchema = z.object({
  S3_ENDPOINT: z
    .string({ error: "S3_ENDPOINT is required" })
    .trim()
    .min(1, "S3_ENDPOINT is required")
    .refine(
      (value) => URL.canParse(value),
      "S3_ENDPOINT must be a valid absolute URL",
    )
    .refine(
      (value) => value.startsWith("https://"),
      "S3_ENDPOINT must use https",
    ),
  S3_ACCESS_KEY_ID: z
    .string({ error: "S3_ACCESS_KEY_ID is required" })
    .trim()
    .min(1, "S3_ACCESS_KEY_ID is required"),
  S3_SECRET_ACCESS_KEY: z
    .string({ error: "S3_SECRET_ACCESS_KEY is required" })
    .trim()
    .min(1, "S3_SECRET_ACCESS_KEY is required"),
  S3_BUCKET: z
    .string({ error: "S3_BUCKET is required" })
    .trim()
    .min(1, "S3_BUCKET is required"),
  S3_PUBLIC_BASE_URL: z
    .string({ error: "S3_PUBLIC_BASE_URL is required" })
    .trim()
    .min(1, "S3_PUBLIC_BASE_URL is required")
    .refine(
      (value) => URL.canParse(value),
      "S3_PUBLIC_BASE_URL must be a valid absolute URL",
    )
    .refine(
      (value) => value.startsWith("https://"),
      "S3_PUBLIC_BASE_URL must use https",
    ),
  S3_REGION: z
    .string()
    .trim()
    .min(1, "S3_REGION must not be blank when provided")
    .optional(),
});

export type MediaConfig = z.infer<typeof mediaConfigSchema>;

export function parseMediaConfig(env: Record<string, string | undefined>): MediaConfig {
  const result = mediaConfigSchema.safeParse(env);
  if (!result.success) {
    const problems = result.error.issues
      .map((issue) => issue.message)
      .join("; ");
    throw new Error(`Media storage configuration is invalid: ${problems}`);
  }
  return result.data;
}

let cachedConfig: MediaConfig | null = null;

export function getMediaConfig(): MediaConfig {
  if (!cachedConfig) {
    cachedConfig = parseMediaConfig(process.env);
  }
  return cachedConfig;
}
