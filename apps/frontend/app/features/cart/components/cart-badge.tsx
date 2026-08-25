"use client";

import { useCart } from "../cart-context";

export default function CartBadge() {
  const { cart } = useCart();

  // Hidden when no data yet or bag is empty (per S1 recorded treatment).
  if (!cart) return null;

  const count = cart.items.reduce((sum, item) => sum + item.quantity, 0);
  if (count <= 0) return null;

  return (
    <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-[3px] rounded-full bg-primary text-on-primary text-[10px] leading-[15px] font-inter text-center">
      {count}
    </span>
  );
}
