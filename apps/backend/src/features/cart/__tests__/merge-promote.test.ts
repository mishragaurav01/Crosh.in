import { describe, it, expect, mock } from "bun:test";
import { mergeGuestCartOnLogin } from "../services/cart-ownership.service.js";

const guestCartWithItems = {
  id: "guest-cart-1",
  userId: null,
  guestToken: "gtok",
  items: [
    { id: "gi-1", cartId: "guest-cart-1", variantId: "var-a", quantity: 2 },
    { id: "gi-2", cartId: "guest-cart-1", variantId: "var-b", quantity: 1 },
  ],
};

// tx.cart.findUnique is called first with the guest token and then with the
// userId — the two lookups are distinguishable by their where clause.
function createTxMock(params: { userCart: Record<string, unknown> | null }) {
  return {
    $queryRaw: mock(() => Promise.resolve([])),
    cart: {
      findUnique: mock((args: { where: { guestToken?: string; userId?: string } }) =>
        args.where.guestToken !== undefined
          ? Promise.resolve(guestCartWithItems)
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
    variant: { findMany: mock(() => Promise.resolve([])) },
  };
}

async function runMerge(tx: ReturnType<typeof createTxMock>) {
  const prisma = {
    $transaction: mock((callback: (txClient: typeof tx) => unknown) =>
      Promise.resolve(callback(tx)),
    ),
  } as any;

  await mergeGuestCartOnLogin({ prisma, userId: "user-1", guestToken: "gtok" });
  return prisma;
}

describe("mergeGuestCartOnLogin — promotion into an empty user cart", () => {
  it("promotes the guest cart wholesale when the user has no cart yet", async () => {
    const tx = createTxMock({ userCart: null });

    await runMerge(tx);

    expect(tx.cart.update).toHaveBeenCalledTimes(1);
    expect(tx.cart.update).toHaveBeenCalledWith({
      where: { id: "guest-cart-1" },
      data: { userId: "user-1", guestToken: null },
    });
  });

  it("does not copy, update, or delete individual line items when promoting", async () => {
    const tx = createTxMock({ userCart: null });

    await runMerge(tx);

    expect(tx.cartItem.create).not.toHaveBeenCalled();
    expect(tx.cartItem.update).not.toHaveBeenCalled();
    expect(tx.cartItem.delete).not.toHaveBeenCalled();
    expect(tx.cart.delete).not.toHaveBeenCalled();
  });

  it("skips variant locking on the promote path since no stock math happens", async () => {
    const tx = createTxMock({ userCart: null });

    await runMerge(tx);

    expect(tx.$queryRaw).not.toHaveBeenCalled();
    expect(tx.variant.findMany).not.toHaveBeenCalled();
  });

  it("is a no-op when the guest token references no cart", async () => {
    const tx = createTxMock({ userCart: null });
    // Override: nothing exists for this token.
    (tx.cart.findUnique as any).mockImplementation((args: {
      where: { guestToken?: string; userId?: string };
    }) =>
      args.where.guestToken !== undefined
        ? Promise.resolve(null)
        : Promise.resolve(null),
    );

    await runMerge(tx);

    expect(tx.cart.update).not.toHaveBeenCalled();
    expect(tx.cart.delete).not.toHaveBeenCalled();
    expect(tx.cartItem.create).not.toHaveBeenCalled();
  });

  it("is a no-op when the guest cart exists but holds no items", async () => {
    const tx = createTxMock({ userCart: null });
    (tx.cart.findUnique as any).mockImplementation((args: {
      where: { guestToken?: string; userId?: string };
    }) =>
      args.where.guestToken !== undefined
        ? Promise.resolve({ ...guestCartWithItems, items: [] })
        : Promise.resolve(null),
    );

    await runMerge(tx);

    expect(tx.cart.update).not.toHaveBeenCalled();
    expect(tx.cartItem.create).not.toHaveBeenCalled();
  });
});
