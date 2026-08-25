import type { Metadata } from "next";
import CartView from "@/app/features/cart/components/cart-view";

export const metadata: Metadata = {
  title: "Your Cart | Crosh.in",
};

export default function CartPage() {
  return <CartView />;
}
