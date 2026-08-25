import { api } from "@/lib/api";
import type { CartDto } from "./types";

// Thin wrappers over the shared client — no second fetch wrapper.
// Every endpoint (GET and all mutations) returns the CartDto; mutations
// return the refreshed cart so callers swap state directly (Clarification #5).
export function getCart(): Promise<CartDto> {
  return api.get<CartDto>("/api/cart");
}

export function addCartItem(variantId: string): Promise<CartDto> {
  return api.post<CartDto>("/api/cart/items", { variantId });
}

export function setCartItemQty(
  itemId: string,
  quantity: number,
): Promise<CartDto> {
  return api.patch<CartDto>(`/api/cart/items/${itemId}`, { quantity });
}

export function removeCartItem(itemId: string): Promise<CartDto> {
  return api.delete<CartDto>(`/api/cart/items/${itemId}`);
}

export function clearCart(): Promise<CartDto> {
  return api.delete<CartDto>("/api/cart");
}
