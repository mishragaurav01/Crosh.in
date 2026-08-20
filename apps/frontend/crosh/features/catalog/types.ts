export type { ApiError } from "@/lib/api";

export interface Category {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Variant {
  id: string;
  sku: string;
  size: string;
  color: string;
  price: number;
  stock: number;
  productId: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductCollection {
  id: string;
  productId: string;
  collectionId: string;
  createdAt: string;
}

export interface PaginatedList<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface CategoryCreateInput {
  name: string;
  description?: string | null;
  slug: string;
}

export interface CategoryUpdateInput {
  name?: string;
  description?: string | null;
  slug?: string;
}

export interface CollectionCreateInput {
  name: string;
  description?: string | null;
  slug: string;
}

export interface CollectionUpdateInput {
  name?: string;
  description?: string | null;
  slug?: string;
}

export interface ProductCreateInput {
  name: string;
  description?: string | null;
  slug: string;
  categoryId: string;
}

export interface ProductUpdateInput {
  name?: string;
  description?: string | null;
  slug?: string;
  categoryId?: string;
}

export interface VariantCreateInput {
  sku: string;
  size: string;
  color: string;
  price: number;
  stock?: number;
}

export interface VariantUpdateInput {
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  stock?: number;
}
