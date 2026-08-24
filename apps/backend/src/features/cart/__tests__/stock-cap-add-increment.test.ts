import { describe, it, expect, mock } from "bun:test";
import { addCartItem, updateCartItem } from "../services/cart.service.js";

function createServicePrisma(params: {
  stock: number;
  existingLine?: { id: string; variantId: string; quantity: number } | null;
}) {
  const tx = {
    $queryRaw: mock(() => Promise.resolve([{ stock: params.stock }])),
    cartItem: {
      findUnique: mock(() => Promise.resolve(params.existingLine ?? null)),
      upsert: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
    },
    variant: { findMany: mock(() => Promise.resolve([])) },
  };

  return {
    $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
    tx,
    cart: {
      findUnique: mock(() =>
        Promise.resolve({
          id: "cart-1",
          items: [],
        }),
      ),
      create: mock(() => Promise.resolve({ id: "cart-2" })),
    },
    cartItem: {
      findFirst: mock(() => Promise.resolve({ id: "line-1", variantId: "var-1" })),
      delete: mock(() => Promise.resolve({})),
      deleteMany: mock(() => Promise.resolve({ count: 0 })),
    },
  } as any;
}

const guestOwner = { guestToken: "gtok" };

describe("addCartItem — stock guard on add and increment", () => {
  it("increments an existing line when the combined quantity fits in stock", async () => {
    const prisma = createServicePrisma({
      stock: 10,
      existingLine: { id: "line-1", variantId: "var-1", quantity: 3 },
    });

    const result = await addCartItem({
      prisma,
      owner: guestOwner,
      variantId: "var-1",
      quantity: 2,
    });

    expect(result.cart).toBeDefined();
    expect(prisma.tx.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          cartId_variantId: { cartId: "cart-1", variantId: "var-1" },
        },
        update: { quantity: 5 },
      }),
    );
  });

  it("creates a new line when the requested quantity fits in stock", async () => {
    const prisma = createServicePrisma({ stock: 10 });

    await addCartItem({
      prisma,
      owner: guestOwner,
      variantId: "var-1",
      quantity: 4,
    });

    expect(prisma.tx.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { cartId: "cart-1", variantId: "var-1", quantity: 4 },
      }),
    );
  });

  it("rejects with 409 INSUFFICIENT_STOCK when adding would exceed stock", async () => {
    const prisma = createServicePrisma({
      stock: 10,
      existingLine: { id: "line-1", variantId: "var-1", quantity: 8 },
    });

    await expect(
      addCartItem({ prisma, owner: guestOwner, variantId: "var-1", quantity: 3 }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_STOCK", statusCode: 409 }),
    );
    expect(prisma.tx.cartItem.upsert).not.toHaveBeenCalled();
  });

  it("allows a combined quantity that exactly matches stock", async () => {
    const prisma = createServicePrisma({
      stock: 10,
      existingLine: { id: "line-1", variantId: "var-1", quantity: 8 },
    });

    await addCartItem({
      prisma,
      owner: guestOwner,
      variantId: "var-1",
      quantity: 2,
    });

    expect(prisma.tx.cartItem.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ update: { quantity: 10 } }),
    );
  });

  it("locks the variant row inside the transaction before any write", async () => {
    // Shared ledger records the relative order of the lock vs the write.
    const callOrder: string[] = [];
    const prisma = createServicePrisma({
      stock: 10,
      existingLine: { id: "line-1", variantId: "var-1", quantity: 1 },
    });
    (prisma.tx.$queryRaw as any).mockImplementation(() => {
      callOrder.push("lock");
      return Promise.resolve([{ stock: 10 }]);
    });
    (prisma.tx.cartItem.upsert as any).mockImplementation(() => {
      callOrder.push("upsert");
      return Promise.resolve({});
    });

    await addCartItem({
      prisma,
      owner: guestOwner,
      variantId: "var-1",
      quantity: 1,
    });

    expect(callOrder).toEqual(["lock", "upsert"]);
  });

  it("throws VARIANT_NOT_FOUND (catalog-owned) when the variant does not exist", async () => {
    const prisma = createServicePrisma({ stock: 10 });
    (prisma.tx.$queryRaw as any).mockImplementation(() => Promise.resolve([]));

    await expect(
      addCartItem({ prisma, owner: guestOwner, variantId: "missing", quantity: 1 }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "VARIANT_NOT_FOUND", statusCode: 404 }),
    );
    expect(prisma.tx.cartItem.upsert).not.toHaveBeenCalled();
  });
});

describe("updateCartItem — stock guard on absolute set", () => {
  it("rejects with 409 INSUFFICIENT_STOCK when the new quantity exceeds stock", async () => {
    const prisma = createServicePrisma({ stock: 10 });

    await expect(
      updateCartItem({
        prisma,
        owner: guestOwner,
        itemId: "line-1",
        quantity: 11,
      }),
    ).rejects.toThrow(
      expect.objectContaining({ code: "INSUFFICIENT_STOCK", statusCode: 409 }),
    );
    expect(prisma.tx.cartItem.update).not.toHaveBeenCalled();
  });

  it("sets an absolute quantity that fits within stock", async () => {
    const prisma = createServicePrisma({ stock: 10 });

    await updateCartItem({
      prisma,
      owner: guestOwner,
      itemId: "line-1",
      quantity: 7,
    });

    expect(prisma.tx.cartItem.update).toHaveBeenCalledWith({
      where: { id: "line-1" },
      data: { quantity: 7 },
    });
  });
});
