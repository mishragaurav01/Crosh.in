import { describe, it, expect, mock } from "bun:test";
import { mergeGuestCartOnLogin } from "../services/cart-ownership.service.js";

const guestCart = {
  id: "guest-cart-1",
  userId: null,
  guestToken: "gtok",
  items: [
    { id: "gi-1", cartId: "guest-cart-1", variantId: "var-a", quantity: 2 },
    { id: "gi-2", cartId: "guest-cart-1", variantId: "var-b", quantity: 1 },
  ],
};

const userCartWithOverlap = {
  id: "user-cart-1",
  userId: "user-1",
  guestToken: null,
  items: [
    { id: "ui-1", cartId: "user-cart-1", variantId: "var-a", quantity: 3 },
  ],
};

function createTxMock(params: {
  userCart: Record<string, unknown> | null;
  stockByVariant: Record<string, number>;
}) {
  return {
    $queryRaw: mock(() => Promise.resolve([])),
    cart: {
      findUnique: mock((args: { where: { guestToken?: string; userId?: string } }) =>
        args.where.guestToken !== undefined
          ? Promise.resolve(guestCart)
          : Promise.resolve(params.userCart),
      ),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    cartItem: {
      create: mock(() => Promise.resolve({})),
      update: mock(() => Promise.resolve({})),
      delete: mock(() => Promise.resolve({})),
    },
    variant: {
      findMany: mock(() =>
        Promise.resolve(
          Object.entries(params.stockByVariant).map(([id, stock]) => ({
            id,
            stock,
          })),
        ),
      ),
    },
  };
}

async function runMerge(tx: ReturnType<typeof createTxMock>) {
  const prisma = {
    $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
  } as any;

  await mergeGuestCartOnLogin({ prisma, userId: "user-1", guestToken: "gtok" });
}

describe("mergeGuestCartOnLogin — overlapping variants capped at stock", () => {
  it("sums the overlapping variant's quantities and caps at current stock", async () => {
    // Guest holds 2 of var-a, user holds 3, stock is 4 → merged line is 4.
    const tx = createTxMock({
      userCart: userCartWithOverlap,
      stockByVariant: { "var-a": 4, "var-b": 10 },
    });

    await runMerge(tx);

    expect(tx.cartItem.update).toHaveBeenCalledWith({
      where: { id: "ui-1" },
      data: { quantity: 4 },
    });
  });

  it("promotes non-overlapping guest lines into the user cart unchanged", async () => {
    const tx = createTxMock({
      userCart: userCartWithOverlap,
      stockByVariant: { "var-a": 4, "var-b": 10 },
    });

    await runMerge(tx);

    expect(tx.cartItem.create).toHaveBeenCalledWith({
      data: { cartId: "user-cart-1", variantId: "var-b", quantity: 1 },
    });
  });

  it("locks every involved variant row before reading stock", async () => {
    const tx = createTxMock({
      userCart: userCartWithOverlap,
      stockByVariant: { "var-a": 4, "var-b": 10 },
    });

    await runMerge(tx);

    // Deterministic order: sorted variant ids. Bun records a tagged-template
    // call as [stringsArray, ...substitutions].
    const calls = (tx.$queryRaw as any).mock.calls as Array<[string[], string]>;
    expect(calls.map((call) => call[1])).toEqual(["var-a", "var-b"]);
    for (const call of calls) {
      expect(call[0].join("")).toContain('FOR UPDATE');
    }
    expect(tx.variant.findMany).toHaveBeenCalledWith({
      where: { id: { in: ["var-a", "var-b"] } },
      select: { id: true, stock: true },
    });
  });

  it("removes the guest cart after merging into the user cart", async () => {
    const tx = createTxMock({
      userCart: userCartWithOverlap,
      stockByVariant: { "var-a": 4, "var-b": 10 },
    });

    await runMerge(tx);

    expect(tx.cart.delete).toHaveBeenCalledWith({ where: { id: "guest-cart-1" } });
    // The promoted-update path never reassigns the guest cart's ownership.
    expect(tx.cart.update).not.toHaveBeenCalled();
  });

  it("deletes the user's line when the capped quantity drops to zero", async () => {
    // Stock is exhausted: min(3 + 2, 0) = 0 → the dead line is removed.
    const tx = createTxMock({
      userCart: userCartWithOverlap,
      stockByVariant: { "var-a": 0 },
    });
    (tx.cart.findUnique as any).mockImplementation(
      (args: { where: { guestToken?: string; userId?: string } }) =>
        args.where.guestToken !== undefined
          ? Promise.resolve({
              ...guestCart,
              items: [guestCart.items[0]],
            })
          : Promise.resolve(userCartWithOverlap),
    );

    await runMerge(tx);

    expect(tx.cartItem.delete).toHaveBeenCalledWith({ where: { id: "ui-1" } });
    expect(tx.cartItem.update).not.toHaveBeenCalled();
  });
});
