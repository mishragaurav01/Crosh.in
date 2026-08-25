export interface ProductImageDto {
  url: string;
  alt: string | null;
}

export interface ProductListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  priceMin: number | null;
  priceMax: number | null;
  images: ProductImageDto[];
}

export interface CategoryListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  banner: ProductImageDto | null;
}

export interface VariantPublicDto {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  available: boolean;
}

export interface ProductDetailDto extends ProductListItemDto {
  categorySlug: string;
  variants: VariantPublicDto[];
}

export interface CollectionListItemDto {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export interface CollectionVariantDto extends VariantPublicDto {
  productId: string;
  productName: string;
  productSlug: string;
}

export interface CollectionDetailDto extends CollectionListItemDto {
  banner: ProductImageDto | null;
  variants: CollectionVariantDto[];
  // Card summaries per distinct published member product, membership order.
  // Same shape as /api/products list items.
  products: ProductListItemDto[];
}
