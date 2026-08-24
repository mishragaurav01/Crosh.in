import type { PrismaClient } from "db/client";
import { CatalogError } from "../../catalog/types/catalog-errors.js";
import { buildPublicUrl } from "../../catalog/services/image.service.js";
import type { PublicImageSlot } from "../../catalog/services/public-catalog.service.js";
import { CartError } from "../types/cart-errors.js";
import {
  ensureCartForOwner,
} from "./cart-ownership.service.js";

export interface CartOwner {
  userId?: string;
  guestToken?: string;
}

export type CartItemDto = {
  id: string;
  variantId: string;
  quantity: number;
  price: number;
  available: boolean;
  size: string;
  color: string;
  productName: string;
  productSlug: string;
  image: PublicImageSlot | null;
};

export type CartDto = {
  items: CartItemDto[];
  subtotal: number;
};

const EMPTY_CART_DTO: CartDto = { items: [], subtotal: 0 };

// GET never creates rows — an owner without a cart just sees the empty shape.
export async function getCart(params: {
  prisma: PrismaClient;
  owner: CartOwner;
}): Promise<CartDto> {
  const { prisma, owner } = params;
  return readCartDto(prisma, owner);
}

export async function addCartItem(params: {
  prisma: PrismaClient;
  owner: CartOwner;
  variantId: string;
  quantity: number;
}): Promise<{ cart: CartDto; newGuestToken?: string }> {
  const { prisma, owner, variantId, quantity } = params;

  // Lazy cart creation happens outside the item transaction; the CHECK
  // constraint plus unique indexes keep ownership well-formed either way.
  const ensured = await ensureCartForOwner({
    prisma,
    userId: owner.userId,
    guestToken: owner.guestToken,
  });

  await prisma.$transaction(async (tx) => {
    // Stock-guarded: lock the variant row so a concurrent mutation cannot
    // invalidate the stock we are about to compare against.
    const locked = await tx.$queryRaw<Array<{ stock: number }>>`
      SELECT "stock" FROM "Variant" WHERE "id" = ${variantId} FOR UPDATE
    `;
    const lockedVariant = locked[0];
    if (!lockedVariant) {
      throw new CatalogError("VARIANT_NOT_FOUND", "Variant not found", 404);
    }
    const stock = lockedVariant.stock;

    const existing = await tx.cartItem.findUnique({
      where: {
        cartId_variantId: { cartId: ensured.cartId, variantId },
      },
    });

    const targetQuantity = (existing?.quantity ?? 0) + quantity;
    if (targetQuantity > stock) {
      throw new CartError(
        "INSUFFICIENT_STOCK",
        "Requested quantity exceeds available stock",
        409,
      );
    }

    await tx.cartItem.upsert({
      where: {
        cartId_variantId: { cartId: ensured.cartId, variantId },
      },
      create: { cartId: ensured.cartId, variantId, quantity },
      update: { quantity: targetQuantity },
    });
  });

  const cart = await readCartDto(prisma, effectiveOwner(owner, ensured));
  return { cart, newGuestToken: ensured.newGuestToken };
}

export async function updateCartItem(params: {
  prisma: PrismaClient;
  owner: CartOwner;
  itemId: string;
  quantity: number;
}): Promise<CartDto> {
  const { prisma, owner, itemId, quantity } = params;

  const item = await findOwnedItem(prisma, owner, itemId);
  if (!item) {
    throw new CartError("CART_ITEM_NOT_FOUND", "Cart item not found", 404);
  }

  if (quantity === 0) {
    // Absolute set of zero is an implicit remove, not a rejection.
    await prisma.cartItem.delete({ where: { id: item.id } });
    return readCartDto(prisma, owner);
  }

  await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<Array<{ stock: number }>>`
      SELECT "stock" FROM "Variant" WHERE "id" = ${item.variantId} FOR UPDATE
    `;
    const stock = locked[0]?.stock ?? 0;

    if (quantity > stock) {
      throw new CartError(
        "INSUFFICIENT_STOCK",
        "Requested quantity exceeds available stock",
        409,
      );
    }

    await tx.cartItem.update({
      where: { id: item.id },
      data: { quantity },
    });
  });

  return readCartDto(prisma, owner);
}

export async function removeCartItem(params: {
  prisma: PrismaClient;
  owner: CartOwner;
  itemId: string;
}): Promise<CartDto> {
  const { prisma, owner, itemId } = params;

  const item = await findOwnedItem(prisma, owner, itemId);
  if (!item) {
    throw new CartError("CART_ITEM_NOT_FOUND", "Cart item not found", 404);
  }

  await prisma.cartItem.delete({ where: { id: item.id } });
  return readCartDto(prisma, owner);
}

export async function clearCartItems(params: {
  prisma: PrismaClient;
  owner: CartOwner;
}): Promise<CartDto> {
  const { prisma, owner } = params;

  const where = cartOwnerWhere(owner);
  if (where) {
    const cart = await prisma.cart.findUnique({
      where,
      select: { id: true },
    });
    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }
  }

  return readCartDto(prisma, owner);
}

function cartOwnerWhere(owner: CartOwner): { userId: string } | { guestToken: string } | null {
  if (owner.userId) {
    return { userId: owner.userId };
  }
  if (owner.guestToken) {
    return { guestToken: owner.guestToken };
  }
  return null;
}

async function findOwnedItem(
  prisma: PrismaClient,
  owner: CartOwner,
  itemId: string,
): Promise<{ id: string; variantId: string } | null> {
  const where = cartOwnerWhere(owner);
  if (!where) {
    return null;
  }
  return prisma.cartItem.findFirst({
    where: { id: itemId, cart: where },
    select: { id: true, variantId: true },
  });
}

function effectiveOwner(
  owner: CartOwner,
  ensured: { cartId: string; newGuestToken?: string },
): CartOwner {
  if (owner.userId) {
    return { userId: owner.userId };
  }
  // newGuestToken is always set when a guest cart was just created; if both
  // are somehow absent, readCartDto degrades to the empty shape.
  return { guestToken: owner.guestToken ?? ensured.newGuestToken };
}

async function readCartDto(prisma: PrismaClient, owner: CartOwner): Promise<CartDto> {
  const where = cartOwnerWhere(owner);
  if (!where) {
    return EMPTY_CART_DTO;
  }

  const cart = await prisma.cart.findUnique({
    where,
    select: {
      items: {
        orderBy: { createdAt: "asc" as const },
        select: {
          id: true,
          variantId: true,
          quantity: true,
          variant: {
            select: {
              price: true,
              stock: true,
              size: true,
              color: true,
              product: {
                select: {
                  name: true,
                  slug: true,
                  images: {
                    select: { key: true, alt: true },
                    orderBy: [{ sortOrder: "asc" as const }, { createdAt: "asc" as const }],
                    take: 1,
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!cart) {
    return EMPTY_CART_DTO;
  }

  const items = cart.items.map((item) => ({
    id: item.id,
    variantId: item.variantId,
    quantity: item.quantity,
    price: item.variant.price,
    available: item.variant.stock > 0,
    size: item.variant.size,
    color: item.variant.color,
    productName: item.variant.product.name,
    productSlug: item.variant.product.slug,
    image: item.variant.product.images[0]
      ? {
          url: buildPublicUrl(item.variant.product.images[0].key),
          alt: item.variant.product.images[0].alt,
        }
      : null,
  }));

  // Subtotal sums every line, including unavailable ones — the frontend needs
  // the would-be total even while something is out of stock
  // (Clarifications #5).
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return { items, subtotal };
}
