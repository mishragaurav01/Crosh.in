import { describe, expect, it } from "bun:test";
import { parseMediaConfig } from "../media.config";

const validEnv = {
  S3_ENDPOINT: "https://your-project-ref.supabase.co/storage/v1/s3",
  S3_REGION: "us-east-1",
  S3_ACCESS_KEY_ID: "test-access-key-id",
  S3_SECRET_ACCESS_KEY: "test-secret-access-key",
  S3_BUCKET: "croshfinal-dev",
  S3_PUBLIC_BASE_URL:
    "https://your-project-ref.supabase.co/storage/v1/object/public/croshfinal-dev",
};

describe("parseMediaConfig", () => {
  it("accepts a complete valid environment", () => {
    const config = parseMediaConfig(validEnv);

    expect(config.S3_ENDPOINT).toBe(
      "https://your-project-ref.supabase.co/storage/v1/s3",
    );
    expect(config.S3_REGION).toBe("us-east-1");
    expect(config.S3_ACCESS_KEY_ID).toBe("test-access-key-id");
    expect(config.S3_SECRET_ACCESS_KEY).toBe("test-secret-access-key");
    expect(config.S3_BUCKET).toBe("croshfinal-dev");
    expect(config.S3_PUBLIC_BASE_URL).toBe(
      "https://your-project-ref.supabase.co/storage/v1/object/public/croshfinal-dev",
    );
  });

  it("defaults S3_REGION to auto when not provided", () => {
    const { S3_REGION: _omitted, ...envWithoutRegion } = validEnv;
    const config = parseMediaConfig(envWithoutRegion);

    expect(config.S3_REGION).toBeUndefined();
  });

  it("rejects an empty environment with all required variable names in the error", () => {
    let errorMessage = "";
    try {
      parseMediaConfig({});
    } catch (error) {
      errorMessage = (error as Error).message;
    }

    expect(errorMessage).toContain("S3_ENDPOINT is required");
    expect(errorMessage).toContain("S3_ACCESS_KEY_ID is required");
    expect(errorMessage).toContain("S3_SECRET_ACCESS_KEY is required");
    expect(errorMessage).toContain("S3_BUCKET is required");
    expect(errorMessage).toContain("S3_PUBLIC_BASE_URL is required");
  });

  it("rejects blank required variables", () => {
    const env = { ...validEnv, S3_BUCKET: "   " };

    expect(() => parseMediaConfig(env)).toThrow("S3_BUCKET is required");
  });

  it("rejects a blank S3_REGION when provided", () => {
    const env = { ...validEnv, S3_REGION: "   " };

    expect(() => parseMediaConfig(env)).toThrow(
      "S3_REGION must not be blank when provided",
    );
  });

  it("rejects an endpoint that is not a valid absolute URL", () => {
    const env = { ...validEnv, S3_ENDPOINT: "not-a-url" };

    expect(() => parseMediaConfig(env)).toThrow(
      "S3_ENDPOINT must be a valid absolute URL",
    );
  });

  it("rejects a non-https endpoint", () => {
    const env = {
      ...validEnv,
      S3_ENDPOINT: "http://your-project-ref.supabase.co/storage/v1/s3",
    };

    expect(() => parseMediaConfig(env)).toThrow("S3_ENDPOINT must use https");
  });

  it("rejects a public base URL that is not a valid absolute URL", () => {
    const env = { ...validEnv, S3_PUBLIC_BASE_URL: "not-a-url" };

    expect(() =>
      parseMediaConfig(env),
    ).toThrow("S3_PUBLIC_BASE_URL must be a valid absolute URL");
  });

  it("rejects a non-https public base URL", () => {
    const env = {
      ...validEnv,
      S3_PUBLIC_BASE_URL:
        "http://your-project-ref.supabase.co/storage/v1/object/public/croshfinal-dev",
    };

    expect(() => parseMediaConfig(env)).toThrow(
      "S3_PUBLIC_BASE_URL must use https",
    );
  });
});
