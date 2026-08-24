import { randomBytes } from "node:crypto";
import type { PrismaClient } from "db/client";

// Repo precedent for hand-generated opaque tokens is
// randomBytes(32).toString("hex") (identity's CSRF tokens) — no cuid2 library
// is installed and this carries stronger entropy (Clarifications #4).
export function generateGuestToken(): string {
  return randomBytes(32).toString("hex");
}

export interface ResolvedOwnerCart {
  cartId: string;
  // Set only when this call created a brand-new guest cart; the caller must
  // issue the guest cookies on that response (lazy, mutation-only issuance).
  newGuestToken?: string;
}

export async function ensureCartForOwner(params: {
  prisma: PrismaClient;
  userId?: string;
  guestToken?: string;
}): Promise<ResolvedOwnerCart> {
  const { prisma, userId, guestToken } = params;

  if (userId) {
    const existing = await prisma.cart.findUnique({ where: { userId } });
    if (existing) {
      return { cartId: existing.id };
    }
    const created = await prisma.cart.create({ data: { userId } });
    return { cartId: created.id };
  }

  if (guestToken) {
    const existing = await prisma.cart.findUnique({ where: { guestToken } });
    if (existing) {
      return { cartId: existing.id };
    }
  }

  const token = generateGuestToken();
  const created = await prisma.cart.create({ data: { guestToken: token } });
  return { cartId: created.id, newGuestToken: token };
}

export async function mergeGuestCartOnLogin(params: {
  prisma: PrismaClient;
  userId: string;
  guestToken: string;
}): Promise<void> {
  const { prisma, userId, guestToken } = params;

  await prisma.$transaction(async (tx) => {
    const guestCart = await tx.cart.findUnique({
      where: { guestToken },
      include: { items: true },
    });

    if (!guestCart || guestCart.items.length === 0) {
      return;
    }

    const userCart = await tx.cart.findUnique({
      where: { userId },
      include: { items: true },
    });

    if (!userCart) {
      // No user cart yet — promote the guest cart wholesale. Same observable
      // outcome as merging into an empty cart, in one statement.
      await tx.cart.update({
        where: { id: guestCart.id },
        data: { userId, guestToken: null },
      });
      return;
    }

    // Lock involved variants in deterministic order before reading stock so
    // concurrent mutations serialize instead of racing between read and write.
    const variantIds = [...new Set(guestCart.items.map((i) => i.variantId))].sort();
    for (const variantId of variantIds) {
      await tx.$queryRaw`SELECT "id" FROM "Variant" WHERE "id" = ${variantId} FOR UPDATE`;
    }
    const variants = await tx.variant.findMany({
      where: { id: { in: variantIds } },
      select: { id: true, stock: true },
    });
    const stockByVariant = new Map(variants.map((v) => [v.id, v.stock]));

    const userItemByVariant = new Map(userCart.items.map((i) => [i.variantId, i]));

    for (const item of guestCart.items) {
      const existing = userItemByVariant.get(item.variantId);

      if (!existing) {
        await tx.cartItem.create({
          data: {
            cartId: userCart.id,
            variantId: item.variantId,
            quantity: item.quantity,
          },
        });
        continue;
      }

      const stock = stockByVariant.get(item.variantId) ?? 0;
      const cappedQuantity = Math.min(existing.quantity + item.quantity, stock);
      if (cappedQuantity <= 0) {
        await tx.cartItem.delete({ where: { id: existing.id } });
      } else {
        await tx.cartItem.update({
          where: { id: existing.id },
          data: { quantity: cappedQuantity },
        });
      }
    }

    await tx.cart.delete({ where: { id: guestCart.id } });
  });
}
