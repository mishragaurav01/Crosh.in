import { describe, it, expect, mock } from "bun:test";
import { S3Client } from "@aws-sdk/client-s3";

process.env.S3_ENDPOINT = "https://test-ref.supabase.co/storage/v1/s3";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-access-key";
process.env.S3_BUCKET = "croshfinal-dev";
process.env.S3_PUBLIC_BASE_URL =
  "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev";

let headResult: Record<string, unknown> | Error = {
  ContentLength: 1000,
  ContentType: "image/webp",
};

const sendMock = mock((command: unknown) => {
  if (headResult instanceof Error) {
    return Promise.reject(headResult);
  }
  return Promise.resolve(headResult);
});

const fakeClient = new S3Client({
  region: "auto",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
});
(fakeClient as unknown as { send: unknown }).send = sendMock;

mock.module("../services/s3-client.js", () => ({
  getS3Client: () => fakeClient,
}));

const { createImageController } = await import(
  "../controllers/image.controller.js"
);

const now = new Date();

function createMockReq(body?: unknown, params?: Record<string, string>) {
  return {
    body: body ?? {},
    params: params ?? {},
    query: {},
    user: undefined,
  } as any;
}

function createMockRes() {
  const res: any = {
    statusCode: undefined as number | undefined,
    body: undefined as unknown,
    status: mock(function (this: any, code: number) {
      this.statusCode = code;
      return this;
    }),
    json: mock(function (this: any, data: unknown) {
      this.body = data;
      return this;
    }),
  };
  return res;
}

function createMockPrisma(overrides: Record<string, unknown> = {}) {
  return {
    image: {
      count: mock(() => Promise.resolve(0)),
      create: mock((args: { data: Record<string, unknown> }) =>
        Promise.resolve({
          id: "img-1",
          key: args.data.key,
          alt: args.data.alt ?? null,
          sortOrder: args.data.sortOrder ?? 0,
          mimeType: args.data.mimeType,
          createdAt: now,
          updatedAt: now,
        }),
      ),
      findUnique: mock((args: { where: { id: string } }) =>
        Promise.resolve(
          args.where.id === "img-1"
            ? { id: "img-1", key: "images/product/prod-1/abc.webp", alt: null, sortOrder: 0, mimeType: "image/webp", createdAt: now, updatedAt: now }
            : null,
        ),
      ),
      findMany: mock(() => Promise.resolve([])),
      update: mock(() =>
        Promise.resolve({ id: "img-1", key: "k", alt: null, sortOrder: 2, mimeType: "image/webp", createdAt: now, updatedAt: now }),
      ),
      delete: mock(() => Promise.resolve({})),
    },
    product: { findUnique: mock(() => Promise.resolve({ id: "prod-1" })) },
    variant: { findUnique: mock(() => Promise.resolve({ id: "var-1" })) },
    collection: { findUnique: mock(() => Promise.resolve({ id: "col-1" })) },
    category: { findUnique: mock(() => Promise.resolve({ id: "cat-1" })) },
    ...overrides,
  } as any;
}

describe("image controller — createUploadUrlHandler", () => {
  it("returns 200 with key and uploadUrl", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      {
        filename: "photo.png",
        contentType: "image/png",
        size: 200000,
        owner: { type: "product", id: "prod-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.createUploadUrlHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          key: expect.stringMatching(/^images\/product\/prod-1\//),
          uploadUrl: expect.stringContaining("https://"),
        }),
      }),
    );
  });

  it("returns 422 for an unsupported content type", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      {
        filename: "animation.gif",
        contentType: "image/gif",
        size: 200000,
        owner: { type: "product", id: "prod-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.createUploadUrlHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns 422 for an oversize file", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      {
        filename: "huge.jpg",
        contentType: "image/jpeg",
        size: 5 * 1024 * 1024 + 1,
        owner: { type: "product", id: "prod-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.createUploadUrlHandler(req, res);

    expect(res.statusCode).toBe(422);
  });

  it("returns 422 for an unknown owner type", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      {
        filename: "photo.jpg",
        contentType: "image/jpeg",
        size: 1000,
        owner: { type: "storefront", id: "sf-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.createUploadUrlHandler(req, res);

    expect(res.statusCode).toBe(422);
  });
});

describe("image controller — confirmHandler", () => {
  it("returns 201 with the mapped image dto", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      {
        key: "images/product/prod-1/abc123.webp",
        alt: "Front",
        owner: { type: "product", id: "prod-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.confirmHandler(req, res);

    expect(res.statusCode).toBe(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          url: expect.stringContaining("images/product/prod-1/abc123.webp"),
          alt: "Front",
        }),
      }),
    );
  });

  it("maps OBJECT_NOT_FOUND to its status code", async () => {
    headResult = new Error("NotFound");
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      {
        key: "images/product/prod-1/missing.webp",
        owner: { type: "product", id: "prod-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.confirmHandler(req, res);

    expect(res.statusCode).toBe(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "OBJECT_NOT_FOUND" }),
      }),
    );
    headResult = { ContentLength: 1000, ContentType: "image/webp" };
  });

  it("maps IMAGE_LIMIT_REACHED to 409", async () => {
    const prisma = createMockPrisma();
    prisma.image.count = mock(() => Promise.resolve(6));
    const controller = createImageController(prisma);
    const req = createMockReq(
      {
        key: "images/product/prod-1/seventh.jpg",
        owner: { type: "product", id: "prod-1" },
      },
      {},
    );
    const res = createMockRes();

    await controller.confirmHandler(req, res);

    expect(res.statusCode).toBe(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "IMAGE_LIMIT_REACHED" }),
      }),
    );
  });
});

describe("image controller — updateHandler", () => {
  it("updates metadata and returns 200", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq({ alt: "Side", sortOrder: 2 }, { id: "img-1" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({ sortOrder: 2 }),
      }),
    );
  });

  it("rejects attempts to change immutable fields with 422", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(
      { key: "images/variant/var-1/other.webp", productId: "prod-2" },
      { id: "img-1" },
    );
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns 404 when the image does not exist", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq({ alt: "x" }, { id: "missing" });
    const res = createMockRes();

    await controller.updateHandler(req, res);

    expect(res.statusCode).toBe(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "IMAGE_NOT_FOUND" }),
      }),
    );
  });
});

describe("image controller — deleteHandler", () => {
  it("deletes and returns 200 with a message", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(undefined, { id: "img-1" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: { message: "Image deleted" },
      }),
    );
  });

  it("returns 404 when the image does not exist", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(undefined, { id: "missing" });
    const res = createMockRes();

    await controller.deleteHandler(req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("image controller — listHandler", () => {
  it("lists images for an owner", async () => {
    const prisma = createMockPrisma();
    prisma.image.findMany = mock(() =>
      Promise.resolve([
        { id: "img-1", key: "images/variant/var-1/a.webp", alt: null, sortOrder: 0, mimeType: "image/webp", createdAt: now, updatedAt: now },
      ]),
    );
    const controller = createImageController(prisma);
    const req = createMockReq(undefined, { ownerType: "variant", ownerId: "var-1" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: [expect.objectContaining({ id: "img-1" })],
      }),
    );
  });

  it("returns 422 for an unknown owner type", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(undefined, { ownerType: "widget", ownerId: "w-1" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(422);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: "VALIDATION_ERROR" }),
      }),
    );
  });

  it("returns 422 for a missing owner id", async () => {
    const controller = createImageController(createMockPrisma());
    const req = createMockReq(undefined, { ownerType: "product" });
    const res = createMockRes();

    await controller.listHandler(req, res);

    expect(res.statusCode).toBe(422);
  });
});
