// Cart DTOs exactly as returned by GET /api/cart and cart mutations
// (verified against the implemented mapping — see task.md prerequisites).
export interface CartItemImageDto {
  url: string;
  alt: string | null;
}

export interface CartItemDto {
  id: string;
  variantId: string;
  quantity: number;
  price: number;
  available: boolean;
  size: string;
  color: string;
  productName: string;
  productSlug: string;
  image: CartItemImageDto | null;
}

export interface CartDto {
  items: CartItemDto[];
  subtotal: number;
}
