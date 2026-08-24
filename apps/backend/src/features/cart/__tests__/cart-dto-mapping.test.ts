import { describe, it, expect, mock } from "bun:test";

// buildPublicUrl reads media config from the environment on first use; set
// deterministic values up front (same pattern as catalog's image tests).
process.env.S3_ENDPOINT = "https://test-ref.supabase.co/storage/v1/s3";
process.env.S3_REGION = "us-east-1";
process.env.S3_ACCESS_KEY_ID = "test-access-key-id";
process.env.S3_SECRET_ACCESS_KEY = "test-secret-access-key";
process.env.S3_BUCKET = "croshfinal-dev";
process.env.S3_PUBLIC_BASE_URL =
  "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev";

import { createCartController } from "../controllers/cart.controller.js";

// Deliberately over-populated Prisma-shaped row: anything besides the
// explicitly mapped fields must never reach the response.
const rawCartRow = {
  id: "cart-1",
  userId: null,
  guestToken: "gtok",
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-02"),
  items: [
    {
      id: "line-1",
      cartId: "cart-1",
      variantId: "var-1",
      quantity: 2,
      createdAt: new Date("2026-01-03"),
      updatedAt: new Date("2026-01-04"),
      variant: {
        id: "var-1",
        sku: "TEE-M-BLK-SECRET-SKU",
        price: 2999,
        stock: 7,
        size: "M",
        color: "Black",
        productId: "prod-1",
        product: {
          id: "prod-1",
          name: "Basic Tee",
          slug: "basic-tee",
          description: "Internal merchandising notes",
          categoryId: "cat-1",
          images: [
            { key: "products/tee-front.jpg", alt: "Front", sortOrder: 0 },
            { key: "products/tee-back.jpg", alt: "Back", sortOrder: 1 },
          ],
        },
      },
    },
    {
      id: "line-2",
      cartId: "cart-1",
      variantId: "var-2",
      quantity: 2,
      variant: {
        id: "var-2",
        sku: "TEE-L-WHT",
        price: 1500,
        stock: 0,
        size: "L",
        color: "White",
        productId: "prod-1",
        product: {
          name: "Basic Tee",
          slug: "basic-tee",
          images: [],
        },
      },
    },
  ],
};

function createMockReq(user?: { id: string }, guestToken?: string) {
  return { body: {}, params: {}, query: {}, user, guestToken } as any;
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
    cookie: mock(function (this: any) {
      return this;
    }),
    clearCookie: mock(function (this: any) {
      return this;
    }),
  };
  return res;
}

function createDtoPrisma(cartRow: Record<string, unknown> | null) {
  return {
    cart: { findUnique: mock(() => Promise.resolve(cartRow)) },
    cartItem: {},
    variant: {},
  } as any;
}

type ResponseItems = Array<Record<string, unknown> & { image?: unknown }>;

function responseItems(res: unknown): ResponseItems {
  const payload = (res as { body: { data: { items: ResponseItems } } }).body;
  return payload.data.items;
}

function requireItem(items: ResponseItems, index: number) {
  const item = items[index];
  if (!item) {
    throw new Error(`expected a mapped item at index ${index}`);
  }
  return item;
}

describe("cart DTO mapping — explicit projection, no Prisma leakage", () => {
  it("maps each item to exactly the documented DTO keys", async () => {
    const controller = createCartController(createDtoPrisma(rawCartRow));
    const req = createMockReq(undefined, "gtok");
    const res = createMockRes();

    await controller.getHandler(req, res);

    const items = responseItems(res);
    expect(items).toHaveLength(2);
    expect(Object.keys(requireItem(items, 0)).sort()).toEqual(
      [
        "available",
        "color",
        "id",
        "image",
        "price",
        "productName",
        "productSlug",
        "quantity",
        "size",
        "variantId",
      ].sort(),
    );
  });

  it("exposes live price, availability flag, and variant attributes", async () => {
    const controller = createCartController(createDtoPrisma(rawCartRow));
    const req = createMockReq(undefined, "gtok");
    const res = createMockRes();

    await controller.getHandler(req, res);

    const items = responseItems(res);
    const item = requireItem(items, 0);
    expect(item.price).toBe(2999);
    expect(item.available).toBe(true);
    expect(item.size).toBe("M");
    expect(item.color).toBe("Black");
    expect(item.productName).toBe("Basic Tee");
    expect(item.productSlug).toBe("basic-tee");

    // Out-of-stock lines stay visible but flagged unavailable.
    expect(requireItem(items, 1).available).toBe(false);
  });

  it("maps the first product image to a public URL slot only", async () => {
    const controller = createCartController(createDtoPrisma(rawCartRow));
    const req = createMockReq(undefined, "gtok");
    const res = createMockRes();

    await controller.getHandler(req, res);

    const items = responseItems(res);
    const image = requireItem(items, 0).image as Record<string, string> | null;

    expect(image).toEqual({
      url: "https://test-ref.supabase.co/storage/v1/object/public/croshfinal-dev/products/tee-front.jpg",
      alt: "Front",
    });
    expect(image && Object.keys(image).sort()).toEqual(["alt", "url"]);

    const noImage = requireItem(responseItems(res), 1).image;
    expect(noImage).toBeNull();
  });

  it("never leaks raw stock counts or internal Prisma fields", async () => {
    const controller = createCartController(createDtoPrisma(rawCartRow));
    const req = createMockReq(undefined, "gtok");
    const res = createMockRes();

    await controller.getHandler(req, res);

    const serialized = JSON.stringify(res.body);
    // Availability leaves only as the `available` boolean — raw stock counts
    // never leave the API (matches catalog public-read rules).
    expect(serialized).not.toContain('"stock"');
    expect(serialized).not.toContain("TEE-M-BLK-SECRET-SKU");
    expect(serialized).not.toContain("Internal merchandising notes");
    expect(serialized).not.toContain("tee-back.jpg");
    for (const forbidden of ["createdAt", "updatedAt", "cartId", "guestToken", "categoryId"]) {
      expect(serialized).not.toContain(`"${forbidden}"`);
    }
  });

  it("computes subtotal across all lines including unavailable ones", async () => {
    const controller = createCartController(createDtoPrisma(rawCartRow));
    const req = createMockReq(undefined, "gtok");
    const res = createMockRes();

    await controller.getHandler(req, res);

    const data = (res.body as { data: { subtotal: number } }).data;
    expect(data.subtotal).toBe(2999 * 2 + 1500 * 2);
  });

  it("returns the empty shape for an owner without a cart row", async () => {
    const controller = createCartController(createDtoPrisma(null));
    const req = createMockReq({ id: "user-1" });
    const res = createMockRes();

    await controller.getHandler(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ success: true, data: { items: [], subtotal: 0 } });
  });
});
